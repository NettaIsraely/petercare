export type LogFormat = 'pretty' | 'json';
export type HttpLogReads = 'summary' | 'all' | 'none';

export interface LoggingConfig {
  logFormat: LogFormat;
  httpLogReads: HttpLogReads;
  httpSlowMs: number;
  batchDebounceMs: number;
  batchTtlMs: number;
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

export function loadLoggingConfig(
  env: NodeJS.ProcessEnv = process.env,
): LoggingConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const logFormatRaw = env.LOG_FORMAT?.toLowerCase();
  const httpLogReadsRaw = env.HTTP_LOG_READS?.toLowerCase();

  return {
    logFormat:
      logFormatRaw === 'json' || logFormatRaw === 'pretty'
        ? logFormatRaw
        : nodeEnv === 'production'
          ? 'json'
          : 'pretty',
    httpLogReads:
      httpLogReadsRaw === 'summary' ||
      httpLogReadsRaw === 'all' ||
      httpLogReadsRaw === 'none'
        ? httpLogReadsRaw
        : 'summary',
    httpSlowMs: parsePositiveInt(env.HTTP_SLOW_MS, 500),
    batchDebounceMs: parsePositiveInt(env.HTTP_BATCH_DEBOUNCE_MS, 150),
    batchTtlMs: parsePositiveInt(env.HTTP_BATCH_TTL_MS, 30_000),
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
