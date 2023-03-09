import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDatasetRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsOptional()
  description: string;
  @IsBoolean()
  @IsOptional()
  isPublic: boolean;
}
