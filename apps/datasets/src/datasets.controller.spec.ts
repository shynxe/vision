import { Test, TestingModule } from '@nestjs/testing';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';

describe('DatasetsController', () => {
  let datasetsController: DatasetsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DatasetsController],
      providers: [DatasetsService],
    }).compile();

    datasetsController = app.get<DatasetsController>(DatasetsController);
  });
});
