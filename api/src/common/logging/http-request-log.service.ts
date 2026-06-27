import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import {
  formatBatchSummaryPrettyMessage,
  HttpLogFields,
  isSlowRead,
  normalizeRoute,
  writeHttpLog,
} from './format-http-log';
import {
  isMutationMethod,
  loadLoggingConfig,
  LoggingConfig,
} from './logging.config';

interface RequestLogInput {
  request: Request;
  status: number;
  durationMs: number;
  message?: string;
}

interface BatchState {
  clientContext?: string;
  userId?: string;
  readCount: number;
  errorCount: number;
  minDurationMs: number;
  maxDurationMs: number;
  timer?: NodeJS.Timeout;
  expiresAt: number;
}

@Injectable()
export class HttpRequestLogService {
  private readonly config: LoggingConfig;
  private readonly batches = new Map<string, BatchState>();

  constructor() {
    this.config = loadLoggingConfig();
  }

  logSuccess(input: RequestLogInput): void {
    this.handleRequest(input, 'info');
  }

  logError(input: RequestLogInput): void {
    this.handleRequest(input, input.status >= 500 ? 'error' : 'warn');
  }

  private handleRequest(
    input: RequestLogInput,
    level: HttpLogFields['level'],
  ): void {
    const { request, status, durationMs, message } = input;
    const method = request.method.toUpperCase();
    const route = normalizeRoute(request.url);
    const userId = this.extractUserId(request);
    const isError = status >= 400;
    const isMutation = isMutationMethod(method);
    const slow = isSlowRead(method, status, durationMs, this.config.httpSlowMs);
    const isHealthCheck = method === 'GET' && request.url === '/health';

    if (isHealthCheck) {
      return;
    }

    const fields: HttpLogFields = {
      level,
      requestId: request.requestId,
      clientActionId: request.clientActionId,
      clientContext: request.clientContext,
      method,
      route,
      status,
      durationMs,
      userId,
      message,
      slow,
    };

    const logIndividually = this.shouldLogIndividually({
      method,
      status,
      durationMs,
      isError,
      isMutation,
      slow,
    });

    if (logIndividually) {
      writeHttpLog(fields, this.config.logFormat);
    }

    if (request.clientActionId) {
      this.trackBatch(request, durationMs, isError, !logIndividually && !isError);
    }
  }

  private shouldLogIndividually(input: {
    method: string;
    status: number;
    durationMs: number;
    isError: boolean;
    isMutation: boolean;
    slow: boolean;
  }): boolean {
    if (input.isError || input.isMutation || input.slow) {
      return true;
    }

    if (this.config.httpLogReads === 'none') {
      return false;
    }

    if (this.config.httpLogReads === 'all') {
      return true;
    }

    return false;
  }

  private trackBatch(
    request: Request,
    durationMs: number,
    isError: boolean,
    isSilentRead: boolean,
  ): void {
    const actionId = request.clientActionId;
    if (!actionId) {
      return;
    }

    this.pruneExpiredBatches();

    let batch = this.batches.get(actionId);
    if (!batch) {
      batch = {
        clientContext: request.clientContext,
        userId: this.extractUserId(request),
        readCount: 0,
        errorCount: 0,
        minDurationMs: durationMs,
        maxDurationMs: durationMs,
        expiresAt: Date.now() + this.config.batchTtlMs,
      };
      this.batches.set(actionId, batch);
    }

    batch.clientContext ??= request.clientContext;
    batch.userId ??= this.extractUserId(request);
    batch.minDurationMs = Math.min(batch.minDurationMs, durationMs);
    batch.maxDurationMs = Math.max(batch.maxDurationMs, durationMs);
    batch.expiresAt = Date.now() + this.config.batchTtlMs;

    if (isError) {
      batch.errorCount += 1;
    } else if (isSilentRead) {
      batch.readCount += 1;
    }

    if (batch.timer) {
      clearTimeout(batch.timer);
    }

    batch.timer = setTimeout(() => {
      this.emitBatchSummary(actionId);
    }, this.config.batchDebounceMs);
  }

  private emitBatchSummary(actionId: string): void {
    const batch = this.batches.get(actionId);
    if (!batch) {
      return;
    }

    this.batches.delete(actionId);

    if (batch.readCount === 0 && batch.errorCount === 0) {
      return;
    }

    const fields: HttpLogFields = {
      level: batch.errorCount > 0 ? 'warn' : 'info',
      clientActionId: actionId,
      clientContext: batch.clientContext,
      method: 'BATCH',
      route: '',
      status: batch.errorCount > 0 ? 400 : 200,
      durationMs: batch.maxDurationMs,
      userId: batch.userId,
      batchSummary: true,
      readCount: batch.readCount,
      errorCount: batch.errorCount,
    };

    if (this.config.logFormat === 'pretty') {
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
      const level = fields.level.toUpperCase();
      const message = formatBatchSummaryPrettyMessage(
        fields,
        batch.minDurationMs,
        batch.maxDurationMs,
      );

      process.stdout.write(`${time}  ${level.padEnd(5)} HTTP  ${message}\n`);
      return;
    }

    writeHttpLog(fields, this.config.logFormat);
  }

  private pruneExpiredBatches(): void {
    const now = Date.now();

    for (const [actionId, batch] of this.batches.entries()) {
      if (batch.expiresAt <= now) {
        if (batch.timer) {
          clearTimeout(batch.timer);
        }
        this.batches.delete(actionId);
      }
    }
  }

  private extractUserId(request: Request): string | undefined {
    return (request as Request & { user?: { userId?: string } }).user?.userId;
  }
}
