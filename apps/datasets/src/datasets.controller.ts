import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetRequest } from './dto/CreateDatasetRequest';
import { JwtAuthGuard } from '@app/common';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createDataset(
    @Body() datasetRequest: CreateDatasetRequest,
    @Req() req: any,
  ) {
    return this.datasetsService.createDataset(
      datasetRequest,
      req.cookies?.Authentication,
    );
  }

  @Get()
  async getDatasets() {
    return this.datasetsService.getDatasets();
  }
}
