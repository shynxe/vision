import {
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@app/common';

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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Uploaded file: ' + file?.filename);
    return {
      originalName: file?.originalname,
      fileName: file?.filename,
      destination: file?.destination,
    };
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard)
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

  /* TODO: endpoint for downloading a file
  @Get('image')
  public async getImage(@Res() res: Response) {
    const imagePath = path.join(__dirname, '..', 'public', 'images', 'your-image-file.jpg');
    const stream = createReadStream(imagePath);
    res.setHeader('Content-Type', 'image/jpeg');
    return stream.pipe(res);
  }
   */

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
