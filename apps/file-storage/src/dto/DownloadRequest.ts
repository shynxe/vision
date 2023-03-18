import { Request } from 'express';
import { User } from '../../../auth/src/users/schemas/user.schema';

export interface DownloadRequest extends Request {
  user: Pick<User, '_id' | 'datasets'>;
}
