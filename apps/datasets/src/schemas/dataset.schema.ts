import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';
import { Image, ImageSchema } from './image.schema';

@Schema({ versionKey: false })
export class Dataset extends AbstractDocument {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop([{ type: ImageSchema }])
  images: Image[];
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);
