import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user?: Record<string, unknown> };

@Injectable()
export class ClaimsGuard implements CanActivate {
  private readonly logger = new Logger(ClaimsGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const claimName = this.configService.get<string>('AUTH_REQUIRED_CLAIM');
    const claimValue = this.configService.get<string>('AUTH_REQUIRED_CLAIM_VALUE');

    if (!claimName || !claimValue) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      this.logger.debug(
        `Claims validation failed for ${request.method} ${request.url}: missing authenticated payload`,
      );
      throw new UnauthorizedException('Missing authenticated user payload');
    }

    const value = user[claimName];

    if (Array.isArray(value) && value.includes(claimValue)) {
      return true;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      if (String(value) === claimValue) {
        return true;
      }
    }

    if (typeof value === 'string' && value === claimValue) {
      return true;
    }

    this.logger.debug(
      `Claims validation failed for ${request.method} ${request.url}: ${claimName}=${JSON.stringify(value)} does not include required value ${claimValue}`,
    );

    throw new ForbiddenException(
      `Required claim ${claimName} with value ${claimValue} not present.`,
    );
  }
}
