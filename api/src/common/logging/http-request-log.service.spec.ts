import { Request } from 'express';
import {
  formatBatchSummaryPrettyMessage,
  formatClientContextLabel,
  formatIndividualPrettyMessage,
  normalizeRoute,
  shortId,
} from './format-http-log';
import { HttpRequestLogService } from './http-request-log.service';

function createRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    url: '/feedings',
    requestId: 'req-12345678',
    requestStartedAt: Date.now() - 25,
    clientActionId: 'action-abcdef12',
    clientContext: 'tab:Schedule',
    user: { userId: '8bd0232c-36ff-4521-aa5f-3d00f21ec4b3' },
    ...overrides,
  } as Request;
}

describe('format-http-log helpers', () => {
  it('normalizes uuid path segments', () => {
    expect(
      normalizeRoute('/users/8bd0232c-36ff-4521-aa5f-3d00f21ec4b3'),
    ).toBe('/users/:id');
  });

  it('shortens ids for display', () => {
    expect(shortId('8bd0232c-36ff-4521-aa5f-3d00f21ec4b3')).toBe('…f21ec4b3');
  });

  it('formats client context labels', () => {
    expect(formatClientContextLabel('tab:Schedule')).toBe('Schedule tab refresh');
    expect(formatClientContextLabel('pull-refresh:MySchedule')).toBe(
      'MySchedule pull refresh',
    );
  });

  it('formats individual pretty messages', () => {
    const message = formatIndividualPrettyMessage({
      level: 'info',
      method: 'PATCH',
      route: '/feedings/:id',
      status: 200,
      durationMs: 13,
      userId: '8bd0232c-36ff-4521-aa5f-3d00f21ec4b3',
      requestId: 'req-12345678',
      clientActionId: 'action-abcdef12',
    });

    expect(message).toContain('PATCH /feedings/:id');
    expect(message).toContain('200');
    expect(message).toContain('13ms');
    expect(message).toContain('user …f21ec4b3');
  });

  it('formats batch summary pretty messages', () => {
    const message = formatBatchSummaryPrettyMessage(
      {
        level: 'info',
        method: 'BATCH',
        route: '',
        status: 200,
        durationMs: 82,
        clientContext: 'tab:Schedule',
        readCount: 8,
        batchSummary: true,
        userId: '8bd0232c-36ff-4521-aa5f-3d00f21ec4b3',
        clientActionId: 'action-abcdef12',
      },
      26,
      82,
    );

    expect(message).toBe(
      'Schedule tab refresh · 8 reads · 26–82ms · user …f21ec4b3 · action …abcdef12',
    );
  });
});

describe('HttpRequestLogService', () => {
  const originalEnv = process.env;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      LOG_FORMAT: 'pretty',
      HTTP_LOG_READS: 'summary',
      HTTP_SLOW_MS: '500',
      HTTP_BATCH_DEBOUNCE_MS: '150',
    };
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
    stdoutSpy.mockRestore();
  });

  it('logs mutations individually', () => {
    const service = new HttpRequestLogService();

    service.logSuccess({
      request: createRequest({
        method: 'PATCH',
        url: '/feedings/8bd0232c-36ff-4521-aa5f-3d00f21ec4b3',
      }),
      status: 200,
      durationMs: 13,
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('PATCH /feedings/:id');
  });

  it('suppresses routine GET success and emits one batch summary', () => {
    const service = new HttpRequestLogService();
    const request = createRequest();

    service.logSuccess({ request, status: 200, durationMs: 26 });
    service.logSuccess({ request, status: 200, durationMs: 82 });

    expect(stdoutSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(150);

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('Schedule tab refresh');
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('2 reads');
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('26–82ms');
  });

  it('logs slow GET individually and still summarizes the batch', () => {
    const service = new HttpRequestLogService();
    const request = createRequest();

    service.logSuccess({ request, status: 200, durationMs: 620 });
    service.logSuccess({ request, status: 200, durationMs: 40 });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('(slow)');

    jest.advanceTimersByTime(150);

    expect(stdoutSpy).toHaveBeenCalledTimes(2);
    expect(String(stdoutSpy.mock.calls[1][0])).toContain('1 read');
  });

  it('logs errors individually and includes failures in batch summary', () => {
    const service = new HttpRequestLogService();
    const request = createRequest();

    service.logSuccess({ request, status: 200, durationMs: 30 });
    service.logError({
      request,
      status: 401,
      durationMs: 12,
      message: 'Unauthorized',
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('401');
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('Unauthorized');

    jest.advanceTimersByTime(150);

    expect(stdoutSpy).toHaveBeenCalledTimes(2);
    expect(String(stdoutSpy.mock.calls[1][0])).toContain('1 failed');
  });

  it('logs all GET reads when HTTP_LOG_READS=all', () => {
    process.env.HTTP_LOG_READS = 'all';
    const service = new HttpRequestLogService();

    service.logSuccess({
      request: createRequest({ clientActionId: undefined, clientContext: undefined }),
      status: 200,
      durationMs: 20,
    });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    expect(String(stdoutSpy.mock.calls[0][0])).toContain('GET /feedings');
  });
});
