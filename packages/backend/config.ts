import { configDotenv } from "dotenv";
import path from "path";

configDotenv({
  path: path.resolve(__dirname, ".env"),
});

export default {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
};
