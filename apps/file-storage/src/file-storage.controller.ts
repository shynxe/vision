import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Logger,
  Param,
  Post,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@app/common';
import { BypassAuth } from '@app/common/auth/bypass.decorator';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FileRemovedPayload } from './dto/FileRemovedPayload';
import { Cookies } from '@app/common/cookies/cookies.decorator';
import imageStorage from './storage/imageStorage';
import modelStorage from './storage/modelStorage';

@Controller()
export class FileStorageController {
  protected readonly logger = new Logger(FileStorageController.name);

  constructor(private readonly fileStorageService: FileStorageService) {}

  @Get()
  getHello(): string {
    return this.fileStorageService.getHello();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('datasetId') datasetId: string,
    @Cookies('Authentication') authentication: string,
  ) {
    this.logger.log('Uploaded file: ' + file?.filename);
    return await this.fileStorageService.handleUploadedImage(
      datasetId,
      file,
      authentication,
    );
  }

  @Post('upload/images/:datasetId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', null, { storage: imageStorage }))
  uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('datasetId') datasetId: string,
    @Cookies('Authentication') authentication: string,
  ) {
    this.logger.log('Uploaded (' + files?.length + ') files');
    return this.fileStorageService.handleUploadedImages(
      datasetId,
      files,
      authentication,
    );
  }

  // TODO: remove @Header and replace with @Res() res: Response
  @Get('image/:datasetId/:filename')
  @Header('Content-Type', 'image/png')
  @BypassAuth()
  @UseGuards(JwtAuthGuard)
  public async getImage(
    @Param('datasetId') datasetId: string,
    @Param('filename') filename: string,
    @Cookies('Authentication') authentication: string,
  ): Promise<StreamableFile> {
    // check if user has access to dataset
    const userHasAccess = await this.fileStorageService.hasReadAccess(
      datasetId,
      authentication,
    );
    if (!userHasAccess) {
      throw new UnauthorizedException();
    }

    return this.fileStorageService.getImage(datasetId, filename);
  }

  @Get('model/:datasetId/:filename')
  @Header('Content-Type', 'application/octet-stream')
  @UseGuards(JwtAuthGuard)
  public async getModel(
    @Param('datasetId') datasetId: string,
    @Param('filename') filename: string,
    @Cookies('Authentication') authentication: string,
  ): Promise<StreamableFile> {
    // check if user has access to dataset
    const userHasAccess = await this.fileStorageService.hasReadAccess(
      datasetId,
      authentication,
    );
    if (!userHasAccess) {
      throw new UnauthorizedException();
    }

    return this.fileStorageService.getModel(datasetId, filename);
  }

  @EventPattern('file_removed')
  @UseGuards(JwtAuthGuard)
  async handleFileRemoved(@Payload() payload: FileRemovedPayload) {
    const { datasetId, fileUrl } = payload;
    return this.fileStorageService.removeFileByUrl(datasetId, fileUrl);
  }

  @Post('upload/model/:datasetId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('model', { storage: modelStorage }))
  async uploadTrainerModel(
    @UploadedFile() model: Express.Multer.File,
    @Param('datasetId') datasetId: string,
  ) {
    if (!model) {
      throw new BadRequestException('Missing model file');
    }
    return this.fileStorageService.handleUploadedModel(datasetId, model);
  }

  /* TODO: endpoint to get all files in a dataset using stream.pipe
  @Get('files')
  public async getFiles(@Req() req: any, @Res() res: Response) {
    const { datasetId } = req.query;
    const files = await this.fileStorageService.getFiles(datasetId);
    const zip = archiver('zip', {
      zlib: { level: 9 },
    });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${datasetId}.zip"`);
    zip.pipe(res);
    files.forEach((file) => {
      zip.append(file.createReadStream(), { name: file.name });
    });
    await zip.finalize();
  }
  */
}
