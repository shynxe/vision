import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetRequest } from './dto/CreateDatasetRequest';
import { JwtAuthGuard } from '@app/common';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createDataset(@Body() dataset: CreateDatasetRequest, @Req() req: any) {
    console.log(req.user);
    return this.datasetsService.createDataset(
      dataset,
      req.cookies?.Authentication,
    );
  }

  @Get()
  async getDatasets() {
    return this.datasetsService.getDatasets();
  }
}
