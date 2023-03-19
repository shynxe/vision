import { Inject, Injectable } from '@nestjs/common';
import { DatasetsRepository } from './datasets.repository';
import { AUTH_SERVICE, BILLING_SERVICE } from './constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Dataset } from './schemas/dataset.schema';
import { User } from '../../auth/src/users/schemas/user.schema';

@Injectable()
export class DatasetsService {
  constructor(
    private readonly datasetsRepository: DatasetsRepository,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy,
    @Inject(AUTH_SERVICE) private authClient: ClientProxy,
  ) {}

  async createDataset(request: Omit<Dataset, '_id'>, authentication: string) {
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

  handleUploadedFile(fileUrl: string, datasetId: string) {
    console.log('DATASET SERVICE: file uploaded', fileUrl + ' ' + datasetId);
    // TODO: implement this (add fileUrl to dataset)
  }

  async userHasAccessToDataset(datasetId: any, user: User) {
    // check if dataset is public through datasets service
    const dataset = await this.datasetsRepository.findOne({ _id: datasetId });
    if (dataset.isPublic) {
      return true;
    }

    if (!user) {
      return false;
    }

    return user.datasets.includes(datasetId);
  }
}
