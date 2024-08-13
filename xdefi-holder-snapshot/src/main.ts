import { AppDataSource } from "./db/app-data-source";
import { Chain, Token } from "./types";

import { generateHoldersList } from "./commands/generateHoldersList";

const ethData: Record<string, any> = {};
export async function main() {
  const dataSource = await AppDataSource.initialize();

  const queryRunner = await dataSource.createQueryRunner();

  // >>>>>>>>>Pull event logs<<<<<<<<<<
  // const chain: Chain = "ethereum";
  // const token: Token = "vxdefi";
  // const config = chainConfig[token][chain];
  // await pullEventLogs({
  //   dataSource,
  //   chain: "ethereum",
  //   blocksInStep: config.blocksInStep,
  //   endBlock: config.blockNumberDeployedOn,
  //   token,
  // });

  const chains: Chain[] = ["ethereum", "arbitrum"];
  const tokens: Token[] = ["xdefi", "vxdefi"];

  // >>>>>>>> Build balances from pulled event logs <<<<<<<<<<<<
  // for (let chain of chains) {
  //   await buildBalances({
  //     chain,
  //     dataSource,
  //     token: "vxdefi",
  //   });
  // }

  // >>>>>>>>>> generate holders list json file from  balances derived from event logs <<<<<<<<<<<<
  await generateHoldersList({
    queryRunner,
    chain: "ethereum",
    token: "xdefi",
  });
}
