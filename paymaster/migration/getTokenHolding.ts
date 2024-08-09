import { XDEFI_TOKEN_ADDRESS, VXDEFI_TOKEN_ADDRESS } from "../config/config";
import xdefiHolders from "../data/holders/xdefi_eth_holders.json";
import vxdefiHolders from "../data/holders/vxdefi_eth_holders.json";

export type TokenHolding = {
  address: string;
  balance: string;
};

export function getTokenHolding(
  token: string,
  user: string
): TokenHolding | undefined {
  const addr = user.toLowerCase();
  switch (token) {
    case XDEFI_TOKEN_ADDRESS:
      return xdefiHolders[addr as keyof typeof xdefiHolders];
    case VXDEFI_TOKEN_ADDRESS:
      return vxdefiHolders[addr as keyof typeof vxdefiHolders];
    default:
      throw new Error(`unsupported token address ${token}`);
  }
}
