export const NODE_ENV = process.env.NODE_ENV || "local";
export const DB_DATABASE = process.env.DB_DATABASE || "gastank";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_PORT = Number(process.env.DB_PORT) || 5432;
export const DB_USERNAME = process.env.DB_USERNAME || "postgres";
export const DB_SSL_MODE = process.env.DB_SSL_MODE
  ? (process.env.DB_SSL_MODE || "").toLowerCase() === "true"
  : NODE_ENV !== "local";

export const chainConfig = {
  ethereum: {
    providerUrl: "",
    tokenContract: "0x72b886d09c117654ab7da13a14d603001de0b777",
  },
  arbitrum: {
    providerUrl: "",
    tokenContract: "0x180f7cf38805d1be95c7632f653e26b0838e2969",
  },
} as const;
