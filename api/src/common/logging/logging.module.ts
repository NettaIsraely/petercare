import { Global, Module } from '@nestjs/common';
import { HttpRequestLogService } from './http-request-log.service';

@Global()
@Module({
  providers: [HttpRequestLogService],
  exports: [HttpRequestLogService],
})
export class LoggingModule {}
