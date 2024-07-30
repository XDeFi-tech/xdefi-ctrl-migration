import {
  VXDEFI_TOKEN_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
  USD_VALUE_THRESHOLD,
  VXDEFI_VALUE_THRESHOLD,
} from "../../config/config";
import { getTokenPrice } from "../getTokenPrice";
import { MigrationContext } from "../MigrationContext";
import xdefiArbitrumHolders from "../../data/holders/xdefi_arb_holders.json";
import xdefiEthereumHolders from "../../data/holders/vxdefi_eth_holders.json";
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
  if (migrationWhitelist.has(user)) {
    return true;
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
  if (!xdefiEthereumHolders[user]) {
    return false;
  }
  const tokenPriceResponse = await getTokenPrice();
  const tokenData = xdefiArbitrumHolders[user];

  const xdefiAmount = parseInt(
    (BigInt(tokenData.balance) / BigInt(10 ** 18)).toString()
  );

  return xdefiAmount * tokenPriceResponse.current_price >= USD_VALUE_THRESHOLD;
}

export async function isVXdefiMigrationAllowed(
  ctx: MigrationContext,
  user: string
) {
  if (!vXdefiEthereumHolders[user]) {
    return false;
  }

  const balance = BigInt(vXdefiEthereumHolders[user]?.balance || 0);

  return balance >= VXDEFI_VALUE_THRESHOLD;
}
