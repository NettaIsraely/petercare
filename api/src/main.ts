process.env.TZ = 'UTC';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (process.env.NODE_ENV === 'production') {
    Logger.overrideLogger(['log', 'warn', 'error']);
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(
    `Listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`,
  );
}
bootstrap();
