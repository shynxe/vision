import { IsNotEmpty, IsString } from 'class-validator';

export class FileRemovedPayload {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  datasetId: string;

  @IsString()
  @IsNotEmpty()
  Authentication: string;
}
