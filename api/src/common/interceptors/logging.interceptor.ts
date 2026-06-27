import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpRequestLogService } from '../logging/http-request-log.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly httpRequestLogService: HttpRequestLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    if (method === 'GET' && url === '/health') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        this.httpRequestLogService.logSuccess({
          request,
          status: response.statusCode,
          durationMs: this.getDurationMs(request),
        });
      }),
    );
  }

  private getDurationMs(request: Request): number {
    const startedAt = request.requestStartedAt ?? Date.now();
    return Date.now() - startedAt;
  }
}
