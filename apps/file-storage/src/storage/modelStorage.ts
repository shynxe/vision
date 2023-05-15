import { diskStorage, StorageEngine } from 'multer';
import { UploadRequest } from '../dto/UploadRequest';
import * as path from 'path';
import * as fs from 'fs';
import { STORAGE_BASE_PATH } from '../constants/storage';
import { BadRequestException } from '@nestjs/common';

const MODELS_PATH = 'models';
export const getModelDiskPath = (datasetId: string, filename: string) => {
  return path.join(STORAGE_BASE_PATH, datasetId, MODELS_PATH, filename);
};

const modelStorage: StorageEngine = diskStorage({
  destination: function (req: UploadRequest, file: Express.Multer.File, cb) {
    const datasetId = req.params.datasetId;
    if (!datasetId) {
      cb(new BadRequestException('Missing datasetId'), null);
      return;
    }

    const folderPath = path.join(STORAGE_BASE_PATH, datasetId, MODELS_PATH);
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
});

export default modelStorage;
