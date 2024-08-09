import { TransactionResponse } from "ethers";
import { VXDEFI_TOKEN_ADDRESS, XDEFI_TOKEN_ADDRESS } from "../config/config";
import { MigrationContext } from "./MigrationContext";

export type MigrateFromParams = {
  user: string;
  amount: BigInt;
  deadline: number;
  v: any;
  r: any;
  s: any;
};

/**
 * Execute gassless migration on migration contract
 * @param ctx MigrationContext
 * @param tokenAddress contract address to migrate from
 * @param MigrateFromParams amount, signature, wallet address
 * @returns Transaction
 */
export async function migrateGaslessFrom(
  ctx: MigrationContext,
  tokenAddress: string,
  { user, deadline, amount, v, r, s }: MigrateFromParams
): Promise<TransactionResponse> {
  switch (tokenAddress) {
    case XDEFI_TOKEN_ADDRESS: {
      return await ctx.migrationContract.migrateWithGaslessApproval(
        user,
        amount,
        deadline,
        v,
        r,
        s
      );
    }
    case VXDEFI_TOKEN_ADDRESS: {
      return await ctx.migrationContract.migrateGaslessFromVXDEFI(
        user,
        amount,
        deadline,
        v,
        r,
        s
      );
    }

    default:
      throw new Error(`unsupported token address "${tokenAddress}"`);
  }
}
