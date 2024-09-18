import jwt from 'jsonwebtoken';

export const SMS_CODE_EX = 60 * 5;
export const jwtTokenSecret = process.env.JWT_SECRET_KEY ?? 'key';
/** 生成用户ID
 * 生成规则：手机号*1000+当前时间戳的后三位
 * @param phone 手机号
 * @returns 用户ID
 */
export const generateUserId = (phone: string) => {
  return +phone * 1000 + +Date.now().toString().slice(-3);
};
/** 生成6位验证码 */
export const generateCode = () => {
  return Math.floor(Math.random() * 1e6);
};
/**
 * 生成token
 * @param phone 手机号
 * @param id 用户ID
 */
export const generateToken = (phone: string, id: number): Shared.Token => {
  const payload = { phone, id };
  return {
    access: jwt.sign(payload, jwtTokenSecret, { expiresIn: '15m' }),
    refresh: jwt.sign(payload, jwtTokenSecret, { expiresIn: '7d' }),
  };
};
