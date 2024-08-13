export const XDEFI_TOKEN_ADDRESS =
  process.env.XDEFI_TOKEN_ADDRESS ||
  "0x0D6118C80cb2F954cf791EC5736FC218Ba644d05";

export const VXDEFI_TOKEN_ADDRESS =
  process.env.VXDEFI_TOKEN_ADDRESS ||
  "0x97890070f6144012b2F8aEd70a8818E3972156af";

export const CTRL_TOKEN_ADDRESS =
  process.env.CTRL_TOKEN_ADDRESS ||
  "0x3A1ccBF76c9649DD3C57A0f641658678B30af1E5";

export const MIGRATION_CONTRACT_ADDRESS =
  process.env.MIGRATION_CONTRACT_ADDRESS ||
  "0x83df4Dc89402230b7B6ef7E8a0283CfEd80cDbC0";

export const PROVIDER_RPC_URL =
  process.env.PROVIDER_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/5mkt3seuOH3k2m8SwCsQDDckTC5jT27e";

export const USD_VALUE_THRESHOLD = parseFloat(
  process.env.USD_VALUE_THRESHOLD || "1"
);

export const VXDEFI_VALUE_THRESHOLD =
  BigInt(process.env.VXDEFI_VALUE_THRESHOLD || "1") * BigInt(10 ** 18);

export const XDEFI_VALUE_THRESHOLD =
  BigInt(process.env.VXDEFI_VALUE_THRESHOLD || "1") * BigInt(10 ** 18);
