import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ModelFiles, ModelStatus } from '@app/common/types/model';

export class ModelTrainedPayload {
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsString()
  @IsNotEmpty()
  datasetId: string;

  @IsEnum(ModelStatus)
  @IsNotEmpty()
  status: ModelStatus;

  @IsObject()
  modelFiles: ModelFiles;

  @IsString()
  message?: string;
}
