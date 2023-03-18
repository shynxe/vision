import { Request } from 'express';
import { User } from '../../../auth/src/users/schemas/user.schema';

export interface UploadRequest extends Request {
  user: Pick<User, '_id' | 'datasets'>;
  body: { datasetId: string };
}
