import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

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

    const userId = (request as Request & { user?: { userId?: string } }).user
      ?.userId;
    const userSuffix = userId ? ` user=${userId}` : '';
    const line = `${request.method} ${request.url} ${status} ${logMessage}${userSuffix}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      if (process.env.NODE_ENV !== 'production' && stack) {
        this.logger.error(line, stack);
      } else {
        this.logger.error(line);
      }
    } else {
      this.logger.warn(line);
    }

    response
      .status(status)
      .json(
        typeof exceptionResponse === 'string'
          ? { statusCode: status, message: exceptionResponse }
          : exceptionResponse,
      );
  }
}
