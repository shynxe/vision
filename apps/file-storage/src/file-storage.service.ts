import { Injectable } from '@nestjs/common';

@Injectable()
export class FileStorageService {
  getHello(): string {
    return 'Hello World!';
  }
}
