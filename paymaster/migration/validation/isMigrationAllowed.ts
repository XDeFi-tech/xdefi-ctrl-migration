import {
  VXDEFI_TOKEN_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
  USD_VALUE_THRESHOLD,
  VXDEFI_VALUE_THRESHOLD,
} from "../../config/config";
import { getTokenPrice } from "../getTokenPrice";
import { MigrationContext } from "../MigrationContext";
import xdefiArbitrumHolders from "../../data/holders/xdefi_arb_holders.json";
import xdefiEthereumHolders from "../../data/holders/xdefi_eth_holders.json";
import vXdefiEthereumHolders from "../../data/holders/vxdefi_eth_holders.json";
import { migrationWhitelist } from "../../data/migrationWhitelist";

export type IsMigrationAllowedPrams = {
  user: string;
  tokenAddress: string;
};

export async function isMigrationAllowed(
  ctx: MigrationContext,
  { user, tokenAddress }: IsMigrationAllowedPrams
) {
  if (migrationWhitelist.has(user.toLowerCase())) {
    return [true, ""];
  }

  switch (tokenAddress) {
    case VXDEFI_TOKEN_ADDRESS:
      return isVXdefiMigrationAllowed(ctx, user);

    case XDEFI_TOKEN_ADDRESS:
      return isXdefiMigrationAllowed(ctx, user);

    default:
      throw new Error(`unsupported token "${tokenAddress}`);
  }
}

export async function isXdefiMigrationAllowed(
  ctx: MigrationContext,
  user: string
) {
  const addr = user.toLowerCase();
  if (!xdefiEthereumHolders[addr]) {
    return [false, `address ${user} missing on token holders list`];
  }
  const tokenPriceResponse = await getTokenPrice();
  const tokenData = xdefiEthereumHolders[addr];

  const xdefiAmount = parseInt(
    (BigInt(tokenData.balance) / BigInt(10 ** 18)).toString()
  );

  const xdefiAmountInUsd = xdefiAmount * tokenPriceResponse.current_price;
  const isAllowed = xdefiAmountInUsd >= USD_VALUE_THRESHOLD;
  const message = isAllowed
    ? ""
    : `holding amount below threshhold ${USD_VALUE_THRESHOLD} USD`;

  return [isAllowed, message];
}

export async function isVXdefiMigrationAllowed(
  ctx: MigrationContext,
  user: string
) {
  const addr = user.toLowerCase();
  if (!vXdefiEthereumHolders[addr]) {
    return [false, `address ${user} missing on token holders list`];
  }

  const balance = BigInt(vXdefiEthereumHolders[addr]?.balance || 0);

  const isAllowed = balance >= VXDEFI_VALUE_THRESHOLD;

  const message = isAllowed
    ? ""
    : `holding amount below threshold ${VXDEFI_VALUE_THRESHOLD / 10n ** 18n}`;

  return [isAllowed, message];
}
