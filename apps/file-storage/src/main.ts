import { NestFactory } from '@nestjs/core';
import { FileStorageModule } from './file-storage.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(FileStorageModule);
  const configService = app.get(ConfigService);
  await app.listen(configService.get('PORT'));
}

bootstrap();
