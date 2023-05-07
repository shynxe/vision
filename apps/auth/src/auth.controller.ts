import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import JwtAuthGuard from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from './users/schemas/user.schema';
import { Cookies } from '@app/common/cookies/cookies.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response);
    response.send(user);
  }

  @Post('refresh')
  async refresh(
    @Cookies('Authentication') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.refresh(token, response);
    response.send(user);
  }

  @MessagePattern('validate_user')
  @UseGuards(JwtAuthGuard)
  async validateUser(@CurrentUser() user: User) {
    return this.authService.validateUser(user);
  }
}
