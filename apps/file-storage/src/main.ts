import { NestFactory } from '@nestjs/core';
import { FileStorageModule } from './file-storage.module';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(FileStorageModule);
  const configService = app.get(ConfigService);
  const rmqService = app.get<RmqService>(RmqService);
  app.enableCors({
    origin: [configService.get('CORS_ORIGIN').split(',')],
    credentials: true,
  });
  app.connectMicroservice(rmqService.getOptions('FILESTORAGE', true));
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();
