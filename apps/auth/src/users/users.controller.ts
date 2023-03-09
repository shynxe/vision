import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateUserRequest } from './dto/create-user.request';
import { UsersService } from './users.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard } from '@app/common';

@Controller('auth/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() request: CreateUserRequest) {
    return this.usersService.createUser(request);
  }

  @EventPattern('dataset_created')
  @UseGuards(JwtAuthGuard)
  async datasetCreated(@Payload() data: any) {
    const user = data.user;
    const datasetId = data.datasetId;
    await this.usersService.addDataset(user, datasetId);
  }

  @EventPattern('dataset_deleted')
  @UseGuards(JwtAuthGuard)
  async datasetDeleted(@Payload() data: any) {
    const user = data.user;
    const datasetId = data.datasetId;
    await this.usersService.removeDataset(user, datasetId);
  }
}
