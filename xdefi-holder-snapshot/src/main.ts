import { AppDataSource } from "./db/app-data-source";
import { buildBalances } from "./hadnlers/buildBalances/buildBalances";
import { pullEventLogs } from "./hadnlers/pullEventLogs/pullEventLogs";
import { chainConfig } from "./config";
import { Chain, Token } from "./types";

import * as fs from "fs";

const ethData: Record<string, any> = {};
export async function main() {
  const dataSource = await AppDataSource.initialize();

  const queryRunner = await dataSource.createQueryRunner();

  // const minAmount = 100 * 10 ** 18;

  const data = await queryRunner.manager.query(`
      SELECT * from holder_balance  WHERE "chain"='ethereum' and "token"='vxdefi' and balance > 0
    `);

  data.forEach((holderRecord: any) => {
    ethData[holderRecord.address] = {
      address: holderRecord.address,
      balance: holderRecord.balance,
    };
  });

  fs.writeFileSync(
    "vxdefi_holders_ethereum.json",
    JSON.stringify(ethData, null, 2)
  );

  // const chains: Chain[] = ["ethereum"];
  // for (let chain of chains) {
  //   await buildBalances({
  //     chain,
  //     dataSource,
  //     token: "vxdefi",
  //   });
  // }

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
}
