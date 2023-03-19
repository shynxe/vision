import { NestFactory } from '@nestjs/core';
import { DatasetsModule } from './datasets.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(DatasetsModule);
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService);
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('DATASETS', true));
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();
