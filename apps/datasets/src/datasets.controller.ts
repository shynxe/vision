import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetRequest } from './dto/CreateDatasetRequest';
import { JwtAuthGuard } from '@app/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser } from '../../auth/src/current-user.decorator';
import { User } from '../../auth/src/users/schemas/user.schema';
import { BypassAuth } from '@app/common/auth/bypass.decorator';

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

  @EventPattern('file_uploaded')
  @UseGuards(JwtAuthGuard)
  async fileUploaded(@Payload() payload: any) {
    const { fileUrl, datasetId } = payload;
    return this.datasetsService.handleUploadedFile(fileUrl, datasetId);
  }

  @MessagePattern('user_has_access_to_dataset')
  @BypassAuth()
  @UseGuards(JwtAuthGuard)
  async userHasAccessToDataset(
    @Payload('datasetId') datasetId: string,
    @CurrentUser() user: User,
  ) {
    console.log('found user', user);
    return this.datasetsService.userHasAccessToDataset(datasetId, user);
  }
}
