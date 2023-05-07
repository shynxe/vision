import { NestFactory } from '@nestjs/core';
import { DatasetsModule } from './datasets.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(DatasetsModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [configService.get('CORS_ORIGIN').split(',')],
    credentials: true,
  });
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('DATASETS', true));
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();
