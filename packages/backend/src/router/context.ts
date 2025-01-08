import { apiRecords, Server, type ApiRecords } from 'shared/router';

export interface RouterContext<P extends keyof ApiRecords = keyof ApiRecords>
  extends Server.Context<P> {
  api: ApiRecords[P];
  token?: string;
  /**user data from token verification  */
  user: BTables['user'];
}
export function createContext(ctx: Server.Context): RouterContext {
  return Object.assign(Object.create(ctx), {
    api: apiRecords[ctx.path],
    token: ctx.req.headers.authorization,
    //@ts-ignore
    user: null as BTables['user'],
  });
}
