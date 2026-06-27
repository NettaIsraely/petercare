import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpRequestLogService } from '../logging/http-request-log.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpRequestLogService: HttpRequestLogService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            message:
              process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : exception instanceof Error
                  ? exception.message
                  : 'Internal server error',
          };

    const messageText =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] }).message ??
          'Unknown error');

    const logMessage =
      typeof messageText === 'string'
        ? messageText
        : messageText.join(', ');

    const startedAt = request.requestStartedAt ?? Date.now();
    this.httpRequestLogService.logError({
      request,
      status,
      durationMs: Date.now() - startedAt,
      message: logMessage,
    });

    response
      .status(status)
      .json(
        typeof exceptionResponse === 'string'
          ? { statusCode: status, message: exceptionResponse }
          : exceptionResponse,
      );
  }
}
