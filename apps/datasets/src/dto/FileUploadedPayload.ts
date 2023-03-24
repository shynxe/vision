import { IsNotEmpty, IsString } from 'class-validator';

export class FileUploadedPayload {
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  datasetId: string;
}
