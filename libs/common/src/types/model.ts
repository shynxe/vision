import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HyperParameters = {
  epochs?: number;
  patience?: number;
  batch?: number;
  imgsz?: number;
  optimizer?: string;
};

export enum ModelStatus {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  UPLOADED = 'UPLOADED',
}

export type FileType = 'pytorch' | 'onnx' | 'torchscript';
export type ModelFiles = {
  [key in FileType]?: {
    url: string;
  };
};

@Schema({ versionKey: false })
export class Model {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({ type: Object })
  files?: ModelFiles;

  @Prop({ type: Object })
  hyperParameters: HyperParameters;

  @Prop({ type: String, enum: ModelStatus, default: ModelStatus.PENDING })
  status: ModelStatus;
}

export const ModelSchema = SchemaFactory.createForClass(Model);
