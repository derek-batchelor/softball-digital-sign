import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest<Request>();
      const reason = this.extractReason(err, info);

      this.logger.debug(`JWT validation failed for ${request.method} ${request.url}: ${reason}`);

      throw err || new UnauthorizedException(reason);
    }

    return user;
  }

  private extractReason(err: Error | null, info: unknown): string {
    if (err) {
      return err.message;
    }

    if (info instanceof Error) {
      return info.message;
    }

    if (typeof info === 'string') {
      return info;
    }

    return 'Unauthorized';
  }
}
