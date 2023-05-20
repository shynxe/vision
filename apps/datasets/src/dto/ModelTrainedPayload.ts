import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ModelFile, ModelStatus } from '@app/common/types/model';

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

  @IsArray()
  modelFiles: ModelFile[];

  @IsString()
  message?: string;
}
