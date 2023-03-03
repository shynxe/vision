import { IsString, IsUrl } from 'class-validator';

export class CreateDatasetRequest {
  @IsString()
  name: string;
  @IsString()
  description: string;
  @IsUrl()
  url: string;
}
