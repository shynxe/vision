import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
import { Cookies } from '@app/common/cookies/cookies.decorator';
import validateBoundingBoxes from './helpers/validateBoundingBoxes';
import { HyperParameters, Model } from '@app/common/types/model.schema';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createDataset(
    @Body() datasetRequest: CreateDatasetRequest,
    @Req() req: any,
    @Cookies('Authentication') authentication: string,
  ) {
    return this.datasetsService.createDataset(datasetRequest, authentication);
  }

  @Post('images/remove')
  @UseGuards(JwtAuthGuard)
  async removeFileFromDataset(
    @Body() removeFileRequest: RemoveFileRequest,
    @Cookies('Authentication') authentication: string,
  ) {
    return this.datasetsService.removeFileFromDataset(
      removeFileRequest,
      authentication,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getDatasets(@CurrentUser() user: User) {
    return this.datasetsService.getDatasetsForUser(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getDatasetById(
    @Param('id') datasetId: string,
    @CurrentUser() user: User,
  ) {
    const userHasReadAccess = await this.datasetsService.userHasReadAccess(
      datasetId,
      user,
    );

    if (!userHasReadAccess) {
      throw new UnauthorizedException(
        'User does not have read access to dataset',
      );
    }

    return this.datasetsService.getDatasetById(datasetId);
  }

  @EventPattern('image_uploaded')
  @UseGuards(JwtAuthGuard)
  async fileUploaded(@Payload() payload: FileUploadedPayload) {
    const { fileUrl, datasetId } = payload;
    return this.datasetsService.addUploadedImageToDataset(fileUrl, datasetId);
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

  @Post('images/boxes')
  @UseGuards(JwtAuthGuard)
  async updateBoundingBoxesForImage(
    @Payload('datasetId') datasetId: string,
    @Payload('imageId') imageId: string,
    @Payload('boundingBoxes') boundingBoxes: BoundingBox[],
    @CurrentUser() user: User,
  ) {
    // check if user has write access to dataset
    const hasWriteAccess = await this.datasetsService.userHasWriteAccess(
      datasetId,
      user,
    );

    if (!hasWriteAccess) {
      throw new UnauthorizedException(
        'User does not have write access to dataset',
      );
    }

    try {
      validateBoundingBoxes(boundingBoxes);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    return this.datasetsService.updateBoundingBoxesForImage(
      datasetId,
      imageId,
      boundingBoxes,
    );
  }

  @Post('train')
  @UseGuards(JwtAuthGuard)
  async trainDataset(
    @Payload('datasetId') datasetId: string,
    @Payload('modelName') modelName: string,
    @Payload('hyperParameters') hyperParameters: HyperParameters,
    @Cookies('Authentication') authentication: string,
  ) {
    return this.datasetsService.trainDataset(
      datasetId,
      modelName,
      hyperParameters,
      authentication,
    );
  }

  @Post('remove')
  @UseGuards(JwtAuthGuard)
  async removeDataset(
    @Payload('datasetId') datasetId: string,
    @CurrentUser() user: User,
  ) {
    const hasWriteAccess = await this.datasetsService.userHasWriteAccess(
      datasetId,
      user,
    );

    if (!hasWriteAccess) {
      throw new UnauthorizedException(
        'User does not have write access to dataset',
      );
    }

    return this.datasetsService.removeDataset(datasetId);
  }

  @Post('models/add')
  @UseGuards(JwtAuthGuard)
  async addModel(
    @Payload('datasetId') datasetId: string,
    @Payload('model') model: Model,
    @CurrentUser() user: User,
  ) {
    const hasWriteAccess = await this.datasetsService.userHasWriteAccess(
      datasetId,
      user,
    );

    if (!hasWriteAccess) {
      throw new UnauthorizedException(
        'User does not have write access to dataset',
      );
    }

    return this.datasetsService.addModel(datasetId, model);
  }

  @Post('models/remove')
  @UseGuards(JwtAuthGuard)
  async removeModel(
    @Payload('datasetId') datasetId: string,
    @Payload('modelId') modelId: string,
    @CurrentUser() user: User,
  ) {
    const hasWriteAccess = await this.datasetsService.userHasWriteAccess(
      datasetId,
      user,
    );

    if (!hasWriteAccess) {
      throw new UnauthorizedException(
        'User does not have write access to dataset',
      );
    }

    return this.datasetsService.removeModel(datasetId, modelId);
  }
}
