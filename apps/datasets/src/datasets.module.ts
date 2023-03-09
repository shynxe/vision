import { Module } from '@nestjs/common';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule, DatabaseModule, RmqModule } from '@app/common';
import { DatasetsRepository } from './datasets.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { AUTH_SERVICE, BILLING_SERVICE } from './constants/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.number().required(),
      }),
      envFilePath: './apps/datasets/.env',
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      {
        name: Dataset.name,
        schema: DatasetSchema,
      },
    ]),
    RmqModule.register({ name: BILLING_SERVICE }),
    RmqModule.register({ name: AUTH_SERVICE }),
    AuthModule,
  ],
  controllers: [DatasetsController],
  providers: [DatasetsService, DatasetsRepository],
})
export class DatasetsModule {}
