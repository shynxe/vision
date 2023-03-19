import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import * as path from 'path';
import { createReadStream } from 'fs';
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

  hasAccessToDataset(datasetId: string, authentication: string) {
    // call datasets service to check if user has access to dataset
    return lastValueFrom(
      this.datasetsClient.send('user_has_access_to_dataset', {
        datasetId,
        Authentication: authentication,
      }),
    );
  }
}
