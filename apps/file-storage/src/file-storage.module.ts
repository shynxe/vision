import { BadRequestException, Module } from '@nestjs/common';
import { FileStorageController } from './file-storage.controller';
import { FileStorageService } from './file-storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const storage = diskStorage({
  destination: function (req, file, cb) {
    const { datasetId } = req.body;

    // make sure datasetId is provided
    if (!datasetId) {
      cb(new BadRequestException('Missing datasetId'), null);
      return;
    }

    // make sure datasetId is a valid folder name (no slashes, etc.)
    if (!datasetId.match(/^[a-zA-Z0-9_-]+$/)) {
      cb(new BadRequestException('Invalid datasetId'), null);
      return;
    }

    const folderPath = path.join('/tmp/uploads', datasetId);
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

@Module({
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
  controllers: [FileStorageController],
  providers: [FileStorageService],
})
export class FileStorageModule {}
