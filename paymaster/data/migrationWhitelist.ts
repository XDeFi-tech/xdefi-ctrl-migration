import { WHITELISTED_ADDRESS } from "../config/config";

const allowedAddresses: string[] = [
  "0x1b9700859ad250bfe97bc6c93ff8f99b10be7f3a",
  "0xe3ca57348c1909a353234c3dae043abfb434bc16",
];

export const migrationWhitelist = new Set(
  ([] as string[]).concat(allowedAddresses, WHITELISTED_ADDRESS)
);
