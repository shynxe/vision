import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { AbstractRepository } from '@app/common';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(User.name) userModel: Model<User>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }

  async findOne(filterQuery: FilterQuery<User>): Promise<User> {
    try {
      return await super.findOne(filterQuery);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found.');
      } else {
        this.logger.error(error);
        throw error;
      }
    }
  }
}
