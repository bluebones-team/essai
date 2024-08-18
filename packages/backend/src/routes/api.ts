import {
  initTRPC,
  type inferParser,
  type ProcedureBuilder,
} from '@trpc/server';
import { mapValues } from 'lodash-es';
import apiConfig, {
  type ApiConfig,
  type ApiRecord,
  type ApiType,
} from 'shared/api';
import { shared } from 'shared/schema';
import { zocker } from 'zocker';
import { z } from 'zod';
import { output, type Context, type Middleware } from '.';
import { auth } from './middleware';
import { observable } from '@trpc/server/observable';

export const t = initTRPC.context<Context>().create({});
const proc = t.procedure;

type ApiProcedureType<Type extends ApiType> = (typeof apiTypeMap)[Type];
// type ApiOutput<
//   Type extends ApiType,
//   Res extends z.ZodType,
//   K extends 'in' | 'out',
// > =
//   ApiProcedureType<Type> extends 'subscription'
//     ? Observable<Shared.Output<z.infer<Res>>, unknown>
//     : inferParser<ReturnType<typeof shared.output<Res>>>[K];
type ApiProcedureParams<Req extends z.ZodType, Res extends z.ZodType> =
  typeof proc extends ProcedureBuilder<infer T>
    ? Merge<
        T,
        {
          _input_in: inferParser<Req>['in'];
          _input_out: inferParser<Req>['out'];
          _output_in: inferParser<ReturnType<typeof shared.output<Res>>>['in'];
          _output_out: inferParser<
            ReturnType<typeof shared.output<Res>>
          >['out'];
        }
      >
    : never;
type ApiProcedureBuilder<Api> =
  Api extends ApiRecord<infer Type, infer Meta, infer Req, infer Res>
    ? ProcedureBuilder<ApiProcedureParams<Req, Res>>[ApiProcedureType<Type>]
    : never;

const apiTypeMap = {
  get: 'query',
  post: 'mutation',
  sse: 'subscription', // trpc 11.x 开始支持
  ws: 'subscription',
} as const;
/**API Record -> Procedure */
export function toProc(api: ApiRecord, fn: (...e: any) => any) {
  const middles: Middleware[] = [];
  if (api.meta?.token) middles.push(auth);
  return middles
    .reduce((acc, m) => acc.use(m), proc.input(api.req)) // 为减小服务器压力，这里不做 output 校验
    [apiTypeMap[api.type]](fn);
}
/**路径-实现映射 -> Router，并提供类型检查 */
export function toRouter(pathImplementMap: {
  [K in keyof ApiConfig]?: Parameters<ApiProcedureBuilder<ApiConfig[K]>>[0];
}) {
  const routerRecord = mapValues(apiConfig, (api, k) =>
    toProc(
      api,
      // pathImplementMap[k]
      api.type === 'ws'
        ? () =>
            observable((emit) => {
              const timer = setInterval(() => {
                emit.next(output.succ(zocker(api.res).generate()));
              }, 3e3);
              setTimeout(() => clearInterval(timer), 10e3);
              return () => clearInterval(timer);
            })
        : () => output.succ(zocker(api.res).generate()), // 不调用接口实现，直接返回 mock 数据,
    ),
  ) as {
    [K in keyof ApiConfig]: ReturnType<ApiProcedureBuilder<ApiConfig[K]>>;
  };
  return t.router(routerRecord);
}
