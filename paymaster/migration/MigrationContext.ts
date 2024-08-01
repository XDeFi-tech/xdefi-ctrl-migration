import { Contract, JsonRpcProvider, Wallet } from "ethers";
import {
  PROVIDER_RPC_URL,
  MIGRATION_CONTRACT_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
} from "../config/config";
import { xdefiToCtrlMigrationAbi } from "../data/abi/xdefiToCtrlMigrationAbi";
import { erc20Abi } from "../data/abi/erc20Abi";
import { getMnemonic } from "./getMnemonic";

export type MigrationContext = {
  migrationContract: Contract;
  xdefiContract: Contract;
  provider: JsonRpcProvider;
  wallet: Wallet;
};

export async function createMigrationContext(): Promise<MigrationContext> {
  const provider = new JsonRpcProvider(PROVIDER_RPC_URL);

  const mnemonic = await getMnemonic();
  const wallet = new Wallet(Wallet.fromPhrase(mnemonic).privateKey, provider);

  const migrationContract = new Contract(
    MIGRATION_CONTRACT_ADDRESS,
    xdefiToCtrlMigrationAbi,
    wallet
  );

  const xdefiContract = new Contract(XDEFI_TOKEN_ADDRESS, erc20Abi, provider);

  return {
    migrationContract,
    xdefiContract,
    provider,
    wallet,
  };
}
