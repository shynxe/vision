import {
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
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
import type { Request, Response } from 'express';
import { DownloadRequest } from './dto/DownloadRequest';

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

  @Get('image/:datasetId/:filename')
  @UseGuards(JwtAuthGuard)
  public getImage(@Req() req: DownloadRequest): StreamableFile {
    const { datasetId, filename } = req.params;

    // check if user has access to dataset
    if (!req.user.datasets.includes(datasetId)) {
      throw new UnauthorizedException('Unauthorized to access this dataset');
    }

    return this.fileStorageService.getFile(datasetId, filename);
  }

  // endpoint for html file that displays the image from the above endpoint
  // FOR DEBUGGING ONLY
  @Get('image-html')
  public async getImageHtml(@Req() req: Request, @Res() res: Response) {
    res.set({
      'Content-Type': 'text/html',
    });
    return res.send(`
      <html>
        <body>
          <img src="http://localhost:3002/image/6415f8f09013deb96185d912/1679162174670-Screenshot from 2023-01-04 14-55-22.png" />
        </body>
      </html>
    `);
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
