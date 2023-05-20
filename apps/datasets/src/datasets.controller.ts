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
import { HyperParameters, ModelStatus } from '@app/common/types/model';
import { ModelTrainedPayload } from './dto/ModelTrainedPayload';

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

  /**
   * Handles the HTTP POST request for training a dataset.
   * Requires authentication using JWT.
   *
   * @param {string} datasetId - The ID of the dataset to be trained.
   * @param {string} modelName - The name of the model to be created.
   * @param {HyperParameters} hyperParameters - The hyperparameters for the training process.
   * @param {string} authentication - The authentication token provided in the request cookie.
   * @param {User} user - The currently authenticated user.
   * @returns {Promise<any>} - Returns a promise that resolves to the created model.
   * @throws {UnauthorizedException} - Throws an exception if the user does not have write access to the dataset.
   * @throws {BadRequestException} - Throws an exception if there is an error during training or model creation.
   */
  @Post('train')
  @UseGuards(JwtAuthGuard)
  async trainDataset(
    @Payload('datasetId') datasetId: string,
    @Payload('modelName') modelName: string,
    @Payload('hyperParameters') hyperParameters: HyperParameters,
    @Cookies('Authentication') authentication: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    // Check if the user has write access to the dataset
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
      // Emit an event to start training the dataset with the specified parameters
      await this.datasetsService.emitTrainDataset(
        datasetId,
        modelName,
        hyperParameters,
        authentication,
      );
    } catch (e) {
      console.log("Couldn't publish message to train model");
      throw new BadRequestException(e.message);
    }

    try {
      // Create a new model with the specified parameters
      return await this.datasetsService.createModel(
        datasetId,
        modelName,
        hyperParameters,
      );
    } catch (e) {
      console.log("Couldn't create model");
      throw new BadRequestException(e.message);
    }
  }

  @EventPattern('model_trained')
  @UseGuards(JwtAuthGuard)
  async modelTrained(
    @Payload() payload: ModelTrainedPayload,
    @CurrentUser() user: User,
  ) {
    const { status, message, datasetId, modelName, modelFiles } = payload;

    const hasWriteAccess = await this.datasetsService.userHasWriteAccess(
      datasetId,
      user,
    );

    if (!hasWriteAccess) {
      throw new UnauthorizedException(
        'User does not have write access to dataset',
      );
    }

    if (status === ModelStatus.FAILED) {
      return await this.datasetsService.updateModelFailed(datasetId, modelName);
    }

    return await this.datasetsService.updateModelUploaded(
      datasetId,
      modelName,
      modelFiles,
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
}
