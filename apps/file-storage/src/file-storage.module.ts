import { Module } from '@nestjs/common';
import { FileStorageController } from './file-storage.controller';
import { FileStorageService } from './file-storage.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule, RmqModule } from '@app/common';
import { DATASETS_SERVICE } from './constants/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
      }),
      envFilePath: './apps/file-storage/.env',
    }),
    RmqModule.register({ name: DATASETS_SERVICE }),
    RmqModule,
    AuthModule,
  ],
  controllers: [FileStorageController],
  providers: [FileStorageService],
})
export class FileStorageModule {}
