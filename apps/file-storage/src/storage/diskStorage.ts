import { diskStorage, StorageEngine } from 'multer';
import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { Request } from 'express';

const localStorage: StorageEngine = diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
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
  filename: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export default localStorage;
