import { DataSource } from "typeorm";
import { HolderBalance } from "../../db/entity/HolderBalance";
import { TransferLog } from "../../db/entity/TransferLog";
import { Chain } from "../../types";

export type BuildBalancesParams = {
  chain: Chain;
  dataSource: DataSource;
  lastBlockNumber?: boolean;
};
export async function buildBalances({
  chain,
  dataSource,
  lastBlockNumber,
}: BuildBalancesParams) {
  const queryRunner = await dataSource.createQueryRunner();

  const logsQuery = queryRunner.manager
    .getRepository(TransferLog)
    .createQueryBuilder("tl");

  logsQuery
    .where("tl.chain = :chain", { chain })
    .orderBy("tl.blockNumber", "ASC")
    .addOrderBy("tl.transactionHash");

  if (lastBlockNumber) {
    logsQuery.andWhere("tl.blockNumber >= :lastBlockNumber", {
      lastBlockNumber: lastBlockNumber,
    });
  }

  const holderRepository = queryRunner.manager.getRepository(HolderBalance);

  let limit = 1000;
  let offset = 0;

  let logs: TransferLog[] = [];
  do {
    logsQuery.limit(limit).offset(offset);
    logs = await logsQuery.getMany();

    for (const log of logs) {
      let holderFrom = await holderRepository.findOneBy({
        address: log.from,
      });

      let holderTo = await holderRepository.findOneBy({
        address: log.to,
      });

      if (!holderFrom) {
        holderFrom = holderRepository.create({
          address: log.from,
          chain,
          balance: "0",
        });
      }

      if (!holderTo) {
        holderTo = holderRepository.create({
          address: log.to,
          chain,
          balance: "0",
        });
      }

      holderFrom.balance = (
        BigInt(holderFrom.balance) - BigInt(log.amount)
      ).toString();

      holderTo.balance = (
        BigInt(holderTo.balance) + BigInt(log.amount)
      ).toString();

      await holderRepository.save([holderFrom, holderTo]);
    }

    offset += limit;
  } while (logs.length !== 0);
}
