import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileStorageService } from '../file-storage.service';

@Injectable()
export class StorageKeyGuard implements CanActivate {
  constructor(private readonly fileStorageService: FileStorageService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    return this.fileStorageService.validateApiKey(apiKey);
  }
}
