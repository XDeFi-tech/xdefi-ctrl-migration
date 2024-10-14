import {
  VXDEFI_TOKEN_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
  XDEFI_VALUE_THRESHOLD,
  VXDEFI_VALUE_THRESHOLD,
} from "../../config/config";
import { MigrationContext } from "../MigrationContext";
import { migrationWhitelist } from "../../data/migrationWhitelist";
import { getTokenHolding } from "../getTokenHolding";

export type IsMigrationAllowedPrams = {
  user: string;
  tokenAddress: string;
};

/**
 * Check whether token migration is allowed for given user
 * @param ctx
 * @param IsMigrationAllowedPrams token contract to migrate from and user wallet address
 * @returns boolean whether migration is allowed
 */
export async function isMigrationAllowed(
  ctx: MigrationContext,
  { user, tokenAddress }: IsMigrationAllowedPrams
) {
  if (migrationWhitelist.has(user.toLowerCase())) {
    return [true, ""];
  }

  switch (tokenAddress.toLowerCase()) {
    case VXDEFI_TOKEN_ADDRESS.toLowerCase():
      return isVXdefiMigrationAllowed(ctx, user);

    case XDEFI_TOKEN_ADDRESS.toLowerCase():
      return isXdefiMigrationAllowed(ctx, user);

    default:
      throw new Error(`unsupported token "${tokenAddress}`);
  }
}

export async function isXdefiMigrationAllowed(
  ctx: MigrationContext,
  user: string
) {
  // const holding = getTokenHolding(XDEFI_TOKEN_ADDRESS, user);
  // const balance = BigInt(holding?.balance || "0");
  // if (!holding) {
  //   // const holding = getTokenHolding(XDEFI_TOKEN_ADDRESS, user);

  //   return [false, `address ${user} missing on token holders list`];
  // }
  /***uncomment ^^^^above^^^^ if check against  holders list is required */

  const balance = (await ctx.xdefiContract.balanceOf(user)) as bigint;

  const isAllowed = balance >= XDEFI_VALUE_THRESHOLD;

  const message = isAllowed
    ? ""
    : `holding amount below threshold ${
        XDEFI_VALUE_THRESHOLD / 10n ** 18n
      } XDEFI`;

  return [isAllowed, message];
}

export async function isVXdefiMigrationAllowed(
  ctx: MigrationContext,
  user: string
) {
  // const holding = getTokenHolding(VXDEFI_TOKEN_ADDRESS, user);

  // if (!holding) {
  //   return [false, `address ${user} missing on token holders list`];
  // }

  // const balance = BigInt(holding.balance || 0);
  /***uncomment ^^^^above^^^^ if check against  holders list is required */

  const balance = (await ctx.vXdefiContract.balanceOf(user)) as bigint;
  const isAllowed = balance >= VXDEFI_VALUE_THRESHOLD;

  const message = isAllowed
    ? ""
    : `holding amount below threshold ${
        VXDEFI_VALUE_THRESHOLD / 10n ** 18n
      } vXDEFI`;

  return [isAllowed, message];
}
