import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '@app/common';

// schema for the object detection dataset
@Schema({ versionKey: false })
export class Dataset extends AbstractDocument {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  usersWithAccess: string[];

  @Prop({ default: false })
  isPublic: boolean;
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);
