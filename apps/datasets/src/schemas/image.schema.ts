import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class Image {
  @Prop()
  url: string;

  @Prop()
  name: string;

  @Prop({ default: [] })
  boundingBoxes: BoundingBox[];
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
