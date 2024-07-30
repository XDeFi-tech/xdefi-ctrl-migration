import { Contract, JsonRpcProvider, Wallet } from "ethers";
import {
  PROVIDER_RPC_URL,
  PRIVATE_KEY,
  MIGRATION_CONTRACT_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
} from "../config/config";
import { xdefiToCtrlMigrationAbi } from "../data/abi/xdefiToCtrlMigrationAbi";
import { erc20Abi } from "../data/abi/erc20Abi";

export type MigrationContext = {
  migrationContract: Contract;
  xdefiContract: Contract;
  provider: JsonRpcProvider;
  wallet: Wallet;
};

export function createMigrationContext(): MigrationContext {
  const provider = new JsonRpcProvider(PROVIDER_RPC_URL);
  const wallet = new Wallet(
    Wallet.fromPhrase(PRIVATE_KEY).privateKey,
    provider
  );

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
