import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import * as path from 'path';
import { createReadStream, promises as fs } from 'fs';
import { ClientProxy } from '@nestjs/microservices';
import { DATASETS_SERVICE } from './constants/services';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { getImageDiskPath } from './storage/imageStorage';
import { getModelDiskPath } from './storage/modelStorage';

@Injectable()
export class FileStorageService {
  constructor(
    @Inject(DATASETS_SERVICE) private datasetsClient: ClientProxy,
    private config: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getImage(datasetId: string, filename: string): StreamableFile {
    const imagePath = getImageDiskPath(datasetId, filename);
    const file = createReadStream(imagePath);

    return new StreamableFile(file);
  }

  getModel(datasetId: string, filename: string): StreamableFile {
    const modelPath = getModelDiskPath(datasetId, filename);
    const file = createReadStream(modelPath);

    return new StreamableFile(file);
  }

  // TODO: replace this with handleUploadedImages
  async handleUploadedImage(
    datasetId: string,
    file: Express.Multer.File,
    authentication: string,
  ) {
    const port = this.config.get<string>('PORT');
    const host = this.config.get<string>('HOST');
    const fileUrl = `${host}:${port}/image/${datasetId}/${file?.filename}`;
    await lastValueFrom(
      this.datasetsClient.emit('image_uploaded', {
        fileUrl,
        datasetId,
        Authentication: authentication,
      }),
    );
    return {
      originalName: file?.originalname,
      fileName: file?.filename,
      destination: file?.destination,
      fileUrl,
    };
  }

  async removeFileByUrl(datasetId: string, fileUrl: string) {
    const filename = fileUrl.split('/').pop();
    const filePath = path.join('/tmp/uploads/', datasetId, filename);

    // remove from disk storage
    await fs.unlink(filePath);

    return {
      fileUrl,
      datasetId,
    };
  }

  hasReadAccess(datasetId: string, authentication: string) {
    // call datasets service to check if user has access to dataset
    return lastValueFrom(
      this.datasetsClient.send('user_has_read_access', {
        datasetId,
        Authentication: authentication,
      }),
    );
  }

  // TODO: replace handleUploadedImage with this
  async handleUploadedImages(
    datasetId: string,
    files: Express.Multer.File[],
    authentication: string,
  ) {
    const promises = files.map((file) => {
      return this.handleUploadedImage(datasetId, file, authentication);
    });

    return await Promise.all(promises);
  }

  async handleUploadedModel(datasetId: string, file: Express.Multer.File) {
    const port = this.config.get<string>('PORT');
    const host = this.config.get<string>('HOST');
    const fileUrl = `${host}:${port}/model/${datasetId}/${file?.filename}`;
    return {
      originalName: file?.originalname,
      fileName: file?.filename,
      destination: file?.destination,
      fileUrl,
    };
  }

  validateApiKey(apiKey: string) {
    const key = this.config.get<string>('API_KEY');

    return key === apiKey;
  }
}
