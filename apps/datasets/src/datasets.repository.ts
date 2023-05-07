import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Dataset } from './schemas/dataset.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';

@Injectable()
export class DatasetsRepository extends AbstractRepository<Dataset> {
  protected readonly logger = new Logger(DatasetsRepository.name);

  constructor(
    @InjectModel(Dataset.name) datasetModel: Model<Dataset>,
    @InjectConnection() connection: Connection,
  ) {
    super(datasetModel, connection);
  }

  async findOne(filterQuery: FilterQuery<Dataset>): Promise<Dataset> {
    try {
      return await super.findOne(filterQuery);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Dataset not found.');
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid query parameters.');
      } else {
        this.logger.error(error);
        throw error;
      }
    }
  }

  async find(filterQuery: FilterQuery<Dataset>): Promise<Dataset[]> {
    try {
      return await super.find(filterQuery);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Dataset not found.');
      } else if (error.name === 'CastError') {
        throw new BadRequestException('Invalid query parameters.');
      } else {
        this.logger.error(error);
        throw error;
      }
    }
  }
}
