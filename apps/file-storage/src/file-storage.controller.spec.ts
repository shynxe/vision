import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageController } from './file-storage.controller';
import { FileStorageService } from './file-storage.service';

describe('FileStorageController', () => {
  let fileStorageController: FileStorageController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FileStorageController],
      providers: [FileStorageService],
    }).compile();

    fileStorageController = app.get<FileStorageController>(
      FileStorageController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(fileStorageController.getHello()).toBe('Hello World!');
    });
  });
});
