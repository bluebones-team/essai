import jwt, { type VerifyErrors } from 'jsonwebtoken';
import { BizCode } from 'shared/enum';
import { jwtTokenSecret } from '~/service';
import { output, type Middleware } from '.';

// middleware
export const auth: Middleware = async ({ ctx, next }) => {
  const token = ctx.req.headers.authorization;
  if (!token) {
    ctx.req.body = output.data({
      code: BizCode.Unauthorizen._value,
      msg: 'token不存在',
    });
    return next();
  }
  jwt.verify(token, jwtTokenSecret, (err: VerifyErrors | null, decoded) => {
    if (err) {
      return output.data({
        code: BizCode.Unauthorizen._value,
        msg: '未认证',
      });
    } else {
      //@ts-ignore
      ctx.req.user = decoded;
      console.log('通过认证:', decoded);
    }
  });
  return next();
};
