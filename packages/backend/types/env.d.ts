/// <reference types="shared/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_URL: string;
    MONGO_URL: string;
  }
}
