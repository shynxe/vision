import { Logger, NotFoundException } from '@nestjs/common';
import {
  Connection,
  FilterQuery,
  Model,
  SaveOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    private readonly connection: Connection,
  ) {}

  async create(
    document: Partial<TDocument>,
    options?: SaveOptions,
  ): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (
      await createdDocument.save(options)
    ).toJSON() as unknown as TDocument;
  }

  async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument> {
    const document = await this.model.findOne(filterQuery, {}, { lean: true });

    if (!document) {
      this.logger.warn('Document not found with filterQuery', filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async findById(id: string) {
    const document = await this.model.findById(id, {}, { lean: true });

    if (!document) {
      this.logger.warn('Document not found with id', id);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ) {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
    });

    if (!document) {
      this.logger.warn(`Document not found with filterQuery:`, filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async upsert(
    filterQuery: FilterQuery<TDocument>,
    document: Partial<TDocument>,
  ) {
    return this.model.findOneAndUpdate(filterQuery, document, {
      lean: true,
      upsert: true,
      new: true,
    });
  }

  async find(filterQuery: FilterQuery<TDocument>) {
    return this.model.find(filterQuery, {}, { lean: true });
  }

  async deleteOne(filterQuery: FilterQuery<TDocument>) {
    const result = await this.model.deleteOne(filterQuery);

    if (result.deletedCount === 0) {
      this.logger.warn(`No document deleted with filterQuery:`, filterQuery);
      throw new NotFoundException('No document deleted.');
    }

    return result.deletedCount;
  }

  async deleteMany(filterQuery: FilterQuery<TDocument>) {
    const result = await this.model.deleteMany(filterQuery);

    if (result.deletedCount === 0) {
      this.logger.warn(`No documents deleted with filterQuery:`, filterQuery);
      throw new NotFoundException('No documents deleted.');
    }

    return result.deletedCount;
  }

  async findByIdAndDelete(id: string) {
    const result = await this.model.findByIdAndDelete(id);

    if (!result) {
      this.logger.warn(`No document deleted with id:`, id);
      throw new NotFoundException('No document deleted.');
    }

    return result;
  }

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    return session;
  }
}
