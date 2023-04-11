import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetRequest } from './dto/CreateDatasetRequest';
import { JwtAuthGuard } from '@app/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser } from '../../auth/src/current-user.decorator';
import { User } from '../../auth/src/users/schemas/user.schema';
import { BypassAuth } from '@app/common/auth/bypass.decorator';
import { RemoveFileRequest } from './dto/RemoveFileRequest';
import { FileUploadedPayload } from './dto/FileUploadedPayload';
import { BoundingBox } from './schemas/image.schema';

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

  @Post('removeFile')
  @UseGuards(JwtAuthGuard)
  async removeFileFromDataset(
    @Body() removeFileRequest: RemoveFileRequest,
    @Req() req: any,
  ) {
    return this.datasetsService.removeFileFromDataset(
      removeFileRequest,
      req.cookies?.Authentication,
    );
  }

  @Get()
  async getDatasets() {
    return this.datasetsService.getDatasets();
  }

  @EventPattern('file_uploaded')
  @UseGuards(JwtAuthGuard)
  async fileUploaded(@Payload() payload: FileUploadedPayload) {
    const { fileUrl, datasetId } = payload;
    return this.datasetsService.addUploadedFile(fileUrl, datasetId);
  }

  @MessagePattern('user_has_read_access')
  @BypassAuth()
  @UseGuards(JwtAuthGuard)
  async userHasAccessToDataset(
    @Payload('datasetId') datasetId: string,
    @CurrentUser() user: User,
  ) {
    return this.datasetsService.userHasReadAccess(datasetId, user);
  }

  @Post('updateBoundingBoxes')
  @UseGuards(JwtAuthGuard)
  async updateBoundingBoxesForImage(
    @Payload('datasetId') datasetId: string,
    @Payload('imageId') imageId: string,
    @Payload('boundingBoxes') boundingBoxes: BoundingBox[],
  ) {
    return this.datasetsService.updateBoundingBoxesForImage(
      datasetId,
      imageId,
      boundingBoxes,
    );
  }
}
