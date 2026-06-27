import { isMutationMethod } from './logging.config';

const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface HttpLogFields {
  level: 'info' | 'warn' | 'error';
  requestId?: string;
  clientActionId?: string;
  clientContext?: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  userId?: string;
  message?: string;
  slow?: boolean;
  batchSummary?: boolean;
  readCount?: number;
  errorCount?: number;
}

export function normalizeRoute(url: string): string {
  const path = url.split('?')[0] ?? url;

  return (
    path
      .split('/')
      .map((segment) => (UUID_SEGMENT.test(segment) ? ':id' : segment))
      .join('/') || '/'
  );
}

export function shortId(id?: string): string | undefined {
  if (!id) {
    return undefined;
  }

  return id.length > 8 ? `…${id.slice(-8)}` : id;
}

export function formatClientContextLabel(context?: string): string {
  if (!context) {
    return 'Client refresh';
  }

  const [kind, name] = context.split(':');
  if (kind === 'tab') {
    return `${name} tab refresh`;
  }
  if (kind === 'pull-refresh') {
    return `${name} pull refresh`;
  }
  if (kind === 'screen') {
    return `${name} screen refresh`;
  }

  return context;
}

export function formatIndividualPrettyMessage(fields: HttpLogFields): string {
  const parts = [
    `${fields.method} ${fields.route}`,
    String(fields.status),
    `${fields.durationMs}ms`,
  ];

  if (fields.slow) {
    parts[2] = `${fields.durationMs}ms (slow)`;
  }

  if (fields.message) {
    parts.splice(2, 0, fields.message);
  }

  const suffixes: string[] = [];
  const user = shortId(fields.userId);
  const request = shortId(fields.requestId);
  const action = shortId(fields.clientActionId);

  if (user) {
    suffixes.push(`user ${user}`);
  }
  if (request) {
    suffixes.push(`req ${request}`);
  }
  if (action) {
    suffixes.push(`action ${action}`);
  }

  if (suffixes.length > 0) {
    parts.push(suffixes.join(' · '));
  }

  return parts.join(' · ');
}

export function formatDurationRange(
  minDurationMs: number,
  maxDurationMs: number,
): string {
  if (minDurationMs === maxDurationMs) {
    return `${minDurationMs}ms`;
  }

  return `${minDurationMs}–${maxDurationMs}ms`;
}

export function formatBatchSummaryPrettyMessage(
  fields: HttpLogFields,
  minDurationMs?: number,
  maxDurationMs?: number,
): string {
  const label = formatClientContextLabel(fields.clientContext);
  const parts = [label];

  if (fields.readCount !== undefined) {
    parts.push(`${fields.readCount} read${fields.readCount === 1 ? '' : 's'}`);
  }

  if (fields.errorCount && fields.errorCount > 0) {
    parts.push(`${fields.errorCount} failed`);
  }

  const min = minDurationMs ?? fields.durationMs;
  const max = maxDurationMs ?? fields.durationMs;
  parts.push(formatDurationRange(min, max));

  const suffixes: string[] = [];
  const user = shortId(fields.userId);
  const action = shortId(fields.clientActionId);

  if (user) {
    suffixes.push(`user ${user}`);
  }
  if (action) {
    suffixes.push(`action ${action}`);
  }

  if (suffixes.length > 0) {
    parts.push(suffixes.join(' · '));
  }

  return parts.join(' · ');
}

export function writeHttpLog(
  fields: HttpLogFields,
  logFormat: 'pretty' | 'json',
): void {
  if (logFormat === 'json') {
    process.stdout.write(
      `${JSON.stringify({
        ...fields,
        timestamp: new Date().toISOString(),
      })}\n`,
    );
    return;
  }

  const level = fields.level.toUpperCase();
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const message = fields.batchSummary
    ? formatBatchSummaryPrettyMessage(fields)
    : formatIndividualPrettyMessage(fields);

  process.stdout.write(`${time}  ${level.padEnd(5)} HTTP  ${message}\n`);
}

export function isSlowRead(
  method: string,
  status: number,
  durationMs: number,
  httpSlowMs: number,
): boolean {
  return (
    !isMutationMethod(method) &&
    status < 400 &&
    durationMs >= httpSlowMs
  );
}
