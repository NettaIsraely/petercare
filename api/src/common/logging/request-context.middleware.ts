import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';

function generateRequestId(): string {
  return randomBytes(4).toString('hex');
}

function readHeader(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  return undefined;
}

export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = readHeader(req.headers['x-request-id']);
  req.requestId = incomingRequestId ?? generateRequestId();
  req.requestStartedAt = Date.now();
  req.clientActionId = readHeader(req.headers['x-client-action-id']);
  req.clientContext = readHeader(req.headers['x-client-context']);

  next();
}
