import { Contract, JsonRpcProvider, Wallet } from "ethers";
import {
  PROVIDER_RPC_URL,
  MIGRATION_CONTRACT_ADDRESS,
  XDEFI_TOKEN_ADDRESS,
} from "../config/config";
import { xdefiToCtrlMigrationAbi } from "../data/abi/xdefiToCtrlMigrationAbi";
import { erc20Abi } from "../data/abi/erc20Abi";
import { getMnemonic } from "./getMnemonic";
import { PaymasterDataSource } from "../db/paymaster-data-source";
import { DataSource } from "typeorm";

export type MigrationContext = {
  migrationContract: Contract;
  xdefiContract: Contract;
  provider: JsonRpcProvider;
  wallet: Wallet;
  dataSource: DataSource;
};

let context: MigrationContext;

async function createMigrationContext(): Promise<MigrationContext> {
  const provider = new JsonRpcProvider(PROVIDER_RPC_URL);

  const mnemonic = await getMnemonic();
  const dataSource = await PaymasterDataSource.initialize();
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
    dataSource,
  };
}

export async function getMigrationContext() {
  if (!context) {
    context = await createMigrationContext();
  }
  return context;
}
