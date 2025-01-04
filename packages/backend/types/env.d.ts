/// <reference types="shared/types" />

import type { OutgoingHttpHeaders } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ApiRecord } from 'shared/router';
import type WebSocket from 'ws';

declare global {
  interface BaseContext {
    req: IncomingMessage;
    path: string;
    /**请求数据 */
    input: any;
    /**响应数据 */
    output: any;
  }
  interface HttpContext extends BaseContext {
    res: ServerResponse;
    set(this: HttpContext, headers: OutgoingHttpHeaders): void;
    send(this: HttpContext, code: number, data?: any): void;
  }
  interface WsContext extends BaseContext {
    ws: WebSocket;
  }
  type Context = HttpContext | WsContext;
}
