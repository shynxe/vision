import { diskStorage, StorageEngine } from 'multer';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { Request } from 'express';
import { UploadRequest } from '../dto/UploadRequest';

const imageStorage: StorageEngine = diskStorage({
  destination: function (req: UploadRequest, file: Express.Multer.File, cb) {
    console.log('received file', file);
    const datasetId = req.params.datasetId;
    const user = req.user;

    if (!user.datasets.includes(datasetId)) {
      cb(
        new UnauthorizedException('Unauthorized to upload to this dataset'),
        null,
      );
      return;
    }

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
  filename: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export default imageStorage;
