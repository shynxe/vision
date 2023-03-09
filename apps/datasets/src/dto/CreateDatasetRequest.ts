import { IsString } from 'class-validator';

export class CreateDatasetRequest {
  @IsString()
  name: string;
  @IsString()
  description: string;
}
