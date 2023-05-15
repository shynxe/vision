import { Prop, Schema } from '@nestjs/mongoose';

export type Model = ModelSchema & Document;

export type HyperParameters = {
  epochs?: number;
  patience?: number;
  batch?: number;
  imgsz?: number;
  optimizer?: string;
};

export enum ModelStatus {
  TRAINING = 'TRAINING',
  FAILED = 'FAILED',
  ACTIVE = 'ACTIVE',
}

@Schema({ versionKey: false })
export class ModelSchema {
  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  name: string;

  @Prop()
  url: string;

  @Prop({ type: Object })
  hyperParameters: HyperParameters;

  @Prop({ type: String, enum: ModelStatus, default: ModelStatus.TRAINING })
  status: ModelStatus;
}
