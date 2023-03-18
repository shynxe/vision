import { Injectable, StreamableFile } from '@nestjs/common';
import * as path from 'path';
import { createReadStream } from 'fs';

@Injectable()
export class FileStorageService {
  getHello(): string {
    return 'Hello World!';
  }

  getFile(datasetId: string, filename: string): StreamableFile {
    const imagePath = path.join('/tmp/uploads/', datasetId, filename);

    const file = createReadStream(imagePath);
    return new StreamableFile(file);
  }
}
