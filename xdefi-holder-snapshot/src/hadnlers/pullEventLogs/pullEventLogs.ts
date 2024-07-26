import { DataSource } from "typeorm";
import { chainConfig } from "../../config";
import * as ethers from "ethers";
import { erc20Abi } from "../../erc20Abi";
import { TransferLog } from "../../db/entity/TransferLog";
import { Chain } from "../../types";

function getProvider(chain: Chain) {
  const chainData = chainConfig[chain];

  const provider = new ethers.JsonRpcProvider(chainData.providerUrl);

  const contract = new ethers.Contract(
    chainData.tokenContract,
    erc20Abi,
    provider
  );

  return {
    provider,
    contract,
  };
}

export type PullEventLogsParams = {
  dataSource: DataSource;
  chain: Chain;
  startBlock?: number;
  endBlock: number;
  blocksInStep: number;
};

export async function pullEventLogs({
  dataSource,
  chain,
  startBlock = 0,
  endBlock,
  blocksInStep,
}: PullEventLogsParams) {
  const { contract, provider } = getProvider(chain);

  let currentBlockNumber = startBlock;

  if (!currentBlockNumber) {
    currentBlockNumber = await provider.getBlockNumber();
  }

  let events: any[];

  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  let lastProcessedBlockNumber = currentBlockNumber;
  do {
    events = await contract.queryFilter(
      "Transfer",
      lastProcessedBlockNumber - blocksInStep,
      lastProcessedBlockNumber
    );

    let entities: TransferLog[] = [];

    for (const event of events) {
      const {
        args: [from, to, amount],
        blockNumber,
        transactionHash,
      } = event;

      const eventLog = queryRunner.manager.create(TransferLog, {
        amount: amount.toString(),
        from,
        to,
        chain,
        blockNumber,
        transactionHash,
      });

      entities.push(eventLog);
    }

    await queryRunner.manager.save(entities);

    entities = [];
    lastProcessedBlockNumber -= blocksInStep;
  } while (events.length !== 0 || lastProcessedBlockNumber >= endBlock);

  await queryRunner.release();
}
