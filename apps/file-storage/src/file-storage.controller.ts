import {
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller()
export class FileStorageController {
  protected readonly logger = new Logger(FileStorageController.name);

  constructor(private readonly fileStorageService: FileStorageService) {}

  @Get()
  getHello(): string {
    return this.fileStorageService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Uploaded file: ' + file?.filename);
    return {
      originalName: file?.originalname,
      fileName: file?.filename,
      destination: file?.destination,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files'))
  uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    this.logger.log(
      'Uploaded ' +
        files.length +
        ' file(s): ' +
        files.map((file) => file?.filename).join(', '),
    );
    return files.map((file) => ({
      originalName: file?.originalname,
      fileName: file?.filename,
    }));
  }
}
