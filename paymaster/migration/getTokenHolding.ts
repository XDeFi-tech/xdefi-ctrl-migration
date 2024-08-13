import { XDEFI_TOKEN_ADDRESS, VXDEFI_TOKEN_ADDRESS } from "../config/config";
import xdefiHoldersEth from "../data/holders/xdefi_eth_holders.json";
import xdefiHoldersArb from "../data/holders/xdefi_arb_holders.json";
import vxdefiHolders from "../data/holders/vxdefi_eth_holders.json";

export type TokenHolding = {
  address: string;
  balance: string;
};

/**
 * Get token holding from a snapshot.
 * @param token token contract address
 * @param user user wallet address
 * @returns holder record or undefined if given user address is not present on holders snapshot
 */
export function getTokenHolding(
  token: string,
  user: string
): TokenHolding | undefined {
  const addr = user.toLowerCase();
  switch (token) {
    case XDEFI_TOKEN_ADDRESS:
      return (
        xdefiHoldersEth[addr as keyof typeof xdefiHoldersEth] ||
        xdefiHoldersArb[addr as keyof typeof xdefiHoldersArb]
      );
    case VXDEFI_TOKEN_ADDRESS:
      return vxdefiHolders[addr as keyof typeof vxdefiHolders];
    default:
      throw new Error(`unsupported token address ${token}`);
  }
}
