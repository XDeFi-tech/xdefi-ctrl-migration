import { DataSource } from "typeorm";
import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  DB_SSL_MODE,
  NODE_ENV,
} from "../config";
import { TransferLog } from "./entity/TransferLog";

const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true,
  ssl: DB_SSL_MODE
    ? process.env.CA_CERT
      ? {
          rejectUnauthorized: true,
          ca: process.env.CA_CERT,
        }
      : {
          rejectUnauthorized: false,
        }
    : false,
  logging: false,
  entities: [TransferLog],
  migrations:
    NODE_ENV === "local"
      ? ["src/migrations/**/*.ts"]
      : ["dist/migrations/**/*.js"],
  subscribers:
    NODE_ENV === "local"
      ? ["src/subscriber/**/*.ts"]
      : ["dist/subscriber/**/*.js"],
});

export { AppDataSource };
