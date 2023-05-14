import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import * as path from 'path';
import { createReadStream, promises as fs } from 'fs';
import { ClientProxy } from '@nestjs/microservices';
import { DATASETS_SERVICE } from './constants/services';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FileStorageService {
  constructor(
    @Inject(DATASETS_SERVICE) private datasetsClient: ClientProxy,
    private config: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getFile(datasetId: string, filename: string): StreamableFile {
    const imagePath = path.join('/tmp/uploads/', datasetId, filename);

    const file = createReadStream(imagePath);
    return new StreamableFile(file);
  }

  // TODO: replace this with handleUploadedFiles
  async handleUploadedFile(
    datasetId: string,
    file: Express.Multer.File,
    authentication: string,
  ) {
    const port = this.config.get<string>('PORT');
    const fileUrl = `http://localhost:${port}/image/${datasetId}/${file?.filename}`;
    await lastValueFrom(
      this.datasetsClient.emit('file_uploaded', {
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

  async removeFileByName(datasetId: string, filename: string) {
    const filePath = path.join('/tmp/uploads/', datasetId, filename);

    // remove from disk storage
    await fs.unlink(filePath);

    return {
      filename,
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

  // TODO: replace handleUploadedFile with this
  async handleUploadedFiles(
    datasetId: string,
    files: Express.Multer.File[],
    authentication: string,
  ) {
    const promises = files.map((file) => {
      return this.handleUploadedFile(datasetId, file, authentication);
    });

    return await Promise.all(promises);
  }

  validateApiKey(apiKey: string) {
    const key = this.config.get<string>('API_KEY');

    return key === apiKey;
  }
}
