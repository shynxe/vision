import { Inject, Injectable } from '@nestjs/common';
import { DatasetsRepository } from './datasets.repository';
import {
  AUTH_SERVICE,
  BILLING_SERVICE,
  FILESTORAGE_SERVICE,
  TRAINER_SERVICE,
} from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom, tap, throwError } from 'rxjs';
import { Dataset } from './schemas/dataset.schema';
import { User } from '../../auth/src/users/schemas/user.schema';
import { RemoveFileRequest } from './dto/RemoveFileRequest';
import { BoundingBox } from './schemas/image.schema';

@Injectable()
export class DatasetsService {
  constructor(
    private readonly datasetsRepository: DatasetsRepository,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy,
    @Inject(FILESTORAGE_SERVICE) private fileStorageClient: ClientProxy,
    @Inject(AUTH_SERVICE) private authClient: ClientProxy,
    @Inject(TRAINER_SERVICE) private trainerClient: ClientProxy,
  ) {}

  async createDataset(request: Partial<Dataset>, authentication = '') {
    const session = await this.datasetsRepository.startTransaction();
    try {
      const dataset = await this.datasetsRepository.create(request, {
        session,
      });
      await lastValueFrom(
        this.billingClient.emit('dataset_created', {
          request,
          Authentication: authentication,
        }),
      );
      await lastValueFrom(
        this.authClient.emit('dataset_created', {
          datasetId: dataset._id,
          Authentication: authentication,
        }),
      );
      await session.commitTransaction();
      return dataset;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }
  }

  async getDatasets() {
    return this.datasetsRepository.find({});
  }

  async getDatasetsForUser(user: User) {
    const userDatasets = user.datasets;
    return await this.datasetsRepository.find({
      _id: { $in: userDatasets },
    });
  }

  async addUploadedFile(fileUrl: string, datasetId: string) {
    const newImage = {
      url: fileUrl,
      name: fileUrl.split('/').pop(),
      boundingBoxes: [],
    };

    return await this.datasetsRepository.findOneAndUpdate(
      { _id: datasetId },
      { $push: { images: newImage } },
    );
  }

  async removeFileFromDataset(
    removeFileRequest: RemoveFileRequest,
    authentication: string,
  ) {
    const dataset = await this.datasetsRepository.findOne({
      _id: removeFileRequest.datasetId,
    });

    const matchFound = dataset.images.some((image, index) => {
      if (image.url === removeFileRequest.fileUrl) {
        dataset.images.splice(index, 1);
        return true; // Stop iterating
      }

      return false;
    });

    if (!matchFound) {
      throw new Error('File not found');
    }

    await this.datasetsRepository.findOneAndUpdate(
      { _id: removeFileRequest.datasetId },
      { $pull: { images: { url: removeFileRequest.fileUrl } } },
    );

    await lastValueFrom(
      this.fileStorageClient.emit('file_removed', {
        fileUrl: removeFileRequest.fileUrl,
        datasetId: removeFileRequest.datasetId,
        Authentication: authentication,
      }),
    );
  }

  async userHasReadAccess(datasetId: string, user: User) {
    // check if dataset is public through datasets service
    const dataset = await this.datasetsRepository.findOne({ _id: datasetId });

    if (!dataset) {
      return false;
    }

    if (dataset.isPublic) {
      return true;
    }

    if (!user) {
      return false;
    }

    return user.datasets.includes(datasetId);
  }

  async userHasWriteAccess(datasetId: any, user: User) {
    if (!user) {
      return false;
    }

    return user.datasets.includes(datasetId);
  }

  async updateBoundingBoxesForImage(
    datasetId: string,
    imageId: string,
    boundingBoxes: BoundingBox[],
  ) {
    return await this.datasetsRepository.findOneAndUpdate(
      { _id: datasetId, 'images._id': imageId },
      { $set: { 'images.$.boundingBoxes': boundingBoxes } },
    );
  }

  async trainDataset(
    datasetId: string,
    modelName: string,
    authentication: string,
  ) {
    const dataset = await this.getDatasetById(datasetId);
    return await lastValueFrom(
      this.trainerClient
        .send('train', {
          datasetId,
          modelName,
          images: dataset.images,
          Authentication: authentication,
        })
        .pipe(
          tap((response) => {
            console.log(response);
          }),
          catchError((error) => {
            console.log(error);
            return throwError(error);
          }),
        ),
    );
  }

  getDatasetById(datasetId: string) {
    return this.datasetsRepository.findById(datasetId);
  }

  removeDataset(datasetId: string) {
    return this.datasetsRepository.findByIdAndDelete(datasetId);
  }
}
