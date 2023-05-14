import { diskStorage, StorageEngine } from 'multer';
import { UploadRequest } from '../dto/UploadRequest';
import * as path from 'path';
import * as fs from 'fs';

const modelStorage: StorageEngine = diskStorage({
  destination: function (req: UploadRequest, file: Express.Multer.File, cb) {
    const datasetId = req.params.datasetId;

    // TODO: create the model storage with its specific permissions
    // console.log('received file', file);
    // const user = req.user;
    //
    // if (!user.datasets.includes(datasetId)) {
    //   cb(
    //     new UnauthorizedException('Unauthorized to upload to this dataset'),
    //     null,
    //   );
    //   return;
    // }
    //
    // // make sure datasetId is provided
    // if (!datasetId) {
    //   cb(new BadRequestException('Missing datasetId'), null);
    //   return;
    // }
    //
    // // make sure datasetId is a valid folder name (no slashes, etc.)
    // if (!datasetId.match(/^[a-zA-Z0-9_-]+$/)) {
    //   cb(new BadRequestException('Invalid datasetId'), null);
    //   return;
    // }

    const folderPath = path.join('/tmp/uploads', datasetId);
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
});

export default modelStorage;
