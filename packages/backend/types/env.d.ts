/// <reference types="shared/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: number;
    REDIS_URL?: string;
    MONGO_URL?: string;
    JWT_SECRET_KEY: string;
    ALIBABA_CLOUD_ACCESS_KEY_ID: string;
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: string;
    SIGN: string;
    CODE_TEMPLATE_ID: string;
  }
}
