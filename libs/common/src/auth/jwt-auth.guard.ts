import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SERVICE } from '@app/common/auth/services';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, Observable, of, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { shouldBypassAuth } from '@app/common/auth/bypass.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(AUTH_SERVICE) private authClient: ClientProxy,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authentication = this.getAuthentication(context);
    const shouldBypass = shouldBypassAuth(context, this.reflector);
    return this.authClient
      .send('validate_user', {
        Authentication: authentication,
      })
      .pipe(
        tap((res) => {
          this.addUserToContext(res, context);
        }),
        catchError(() => {
          if (shouldBypass) {
            return of(true);
          }
          throw new UnauthorizedException();
        }),
      );
  }

  private getAuthentication(context: ExecutionContext) {
    let authentication: string;
    if (context.getType() === 'rpc') {
      authentication = context.switchToRpc().getData().Authentication;
    } else if (context.getType() === 'http') {
      authentication = context.switchToHttp().getRequest()
        .cookies?.Authentication;
    }
    const shouldBypass = shouldBypassAuth(context, this.reflector);
    if (!authentication && !shouldBypass) {
      throw new UnauthorizedException(
        'No value was provided for the Authentication',
      );
    }
    return authentication;
  }

  private addUserToContext(user: any, context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      context.switchToRpc().getData().user = user;
    } else if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    }
  }
}
