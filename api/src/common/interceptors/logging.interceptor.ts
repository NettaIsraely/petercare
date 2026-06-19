import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    if (method === 'GET' && url === '/health') {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const durationMs = Date.now() - start;
        const userId = (request as Request & { user?: { userId?: string } }).user
          ?.userId;
        const userSuffix = userId ? ` user=${userId}` : '';

        this.logger.log(
          `${method} ${url} ${response.statusCode} ${durationMs}ms${userSuffix}`,
        );
      }),
    );
  }
}
