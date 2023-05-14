import { Prop, Schema } from '@nestjs/mongoose';

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
}

export type Model = ModelSchema & Document;

export type HyperParameters = {
  epochs: number;
  patience: number;
  batch: number;
  imgsz: number;
  optimizer: string;
};
