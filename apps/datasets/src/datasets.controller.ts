import { Body, Controller, Get, Post } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetRequest } from './dto/CreateDatasetRequest';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  async createDataset(@Body() dataset: CreateDatasetRequest) {
    return this.datasetsService.createDataset(dataset);
  }

  @Get()
  async getDatasets() {
    return this.datasetsService.getDatasets();
  }
}
