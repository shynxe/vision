import { NestFactory } from '@nestjs/core';
import { FileStorageModule } from './file-storage.module';

async function bootstrap() {
  const app = await NestFactory.create(FileStorageModule);
  await app.listen(3002);
}

bootstrap();
