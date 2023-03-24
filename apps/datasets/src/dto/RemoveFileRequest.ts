import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveFileRequest {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  datasetId: string;
}
