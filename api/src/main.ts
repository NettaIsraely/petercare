process.env.TZ = 'UTC';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpRequestLogService } from './common/logging/http-request-log.service';
import { requestContextMiddleware } from './common/logging/request-context.middleware';
import { getDatabaseTargetLabel } from './database/typeorm.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (process.env.NODE_ENV === 'production') {
    Logger.overrideLogger(['log', 'warn', 'error']);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(requestContextMiddleware);

  const httpRequestLogService = app.get(HttpRequestLogService);
  app.useGlobalFilters(new HttpExceptionFilter(httpRequestLogService));
  app.useGlobalInterceptors(new LoggingInterceptor(httpRequestLogService));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const dbTarget = getDatabaseTargetLabel((key) => process.env[key]);
  logger.log(
    `Listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'}, DB=${dbTarget})`,
  );
}
bootstrap();
