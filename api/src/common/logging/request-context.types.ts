import { Request } from 'express';

export interface RequestContext {
  requestId: string;
  requestStartedAt: number;
  clientActionId?: string;
  clientContext?: string;
}

export type RequestWithContext = Request & RequestContext;

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    requestStartedAt?: number;
    clientActionId?: string;
    clientContext?: string;
  }
}
