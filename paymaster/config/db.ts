export const NODE_ENV = process.env.NODE_ENV || "local";
export const DB_DATABASE = process.env.DB_DATABASE || "gas-tank";
export const DB_HOST = process.env.DB_HOST || "host.docker.internal";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_PORT = Number(process.env.DB_PORT) || 5432;
export const DB_USERNAME = process.env.DB_USERNAME || "murzik";
export const DB_SSL_MODE = process.env.DB_SSL_MODE
  ? (process.env.DB_SSL_MODE || "").toLowerCase() === "true"
  : NODE_ENV !== "local";
