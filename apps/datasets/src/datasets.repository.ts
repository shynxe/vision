import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Dataset } from './schemas/dataset.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

@Injectable()
export class DatasetsRepository extends AbstractRepository<Dataset> {
  protected readonly logger = new Logger(DatasetsRepository.name);

  constructor(
    @InjectModel(Dataset.name) datasetModel: Model<Dataset>,
    @InjectConnection() connection: Connection,
  ) {
    super(datasetModel, connection);
  }
}
