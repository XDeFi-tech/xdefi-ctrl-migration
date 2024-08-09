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
  const holding = getTokenHolding(XDEFI_TOKEN_ADDRESS, user);

  if (!holding) {
    return [false, `address ${user} missing on token holders list`];
  }

  const isAllowed = BigInt(holding.balance) >= XDEFI_VALUE_THRESHOLD;

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
  const holding = getTokenHolding(VXDEFI_TOKEN_ADDRESS, user);

  if (!holding) {
    return [false, `address ${user} missing on token holders list`];
  }

  const balance = BigInt(holding.balance || 0);

  const isAllowed = balance >= VXDEFI_VALUE_THRESHOLD;

  const message = isAllowed
    ? ""
    : `holding amount below threshold ${
        VXDEFI_VALUE_THRESHOLD / 10n ** 18n
      } vXDEFI`;

  return [isAllowed, message];
}
