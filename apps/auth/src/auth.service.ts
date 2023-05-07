import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { User } from './users/schemas/user.schema';
import { UsersService } from './users/users.service';

export interface TokenPayload {
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(user: User, response: Response) {
    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
    };

    const expires = new Date();
    const currentSeconds = expires.getSeconds();
    expires.setSeconds(
      currentSeconds + Number(this.configService.get('JWT_EXPIRATION')),
    );

    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      httpOnly: true,
      expires,
    });
  }

  async refresh(token: string, response: Response) {
    const decodedToken = await this.jwtService.verifyAsync(token);
    const userId = decodedToken.userId;
    const user = await this.usersService.getUser({ _id: userId });
    await this.login(user, response);
    return user;
  }

  logout(response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      expires: new Date(),
    });
  }

  async validateUser(user: User) {
    // TODO: validate token
    return this.usersService.getUser({ _id: user._id });
  }
}
