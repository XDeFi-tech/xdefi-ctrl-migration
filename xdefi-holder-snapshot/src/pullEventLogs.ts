import { DataSource } from "typeorm";
import { chainConfig } from "./config";
import * as ethers from "ethers";
import { erc20Abi } from "./erc20Abi";
import { TransferLog } from "./db/entity/TransferLog";

export type Chain = "ethereum" | "arbitrum";
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

export async function pullEventLogs({
  dataSource,
  chain,
}: {
  dataSource: DataSource;
  chain: Chain;
}) {
  const { contract, provider } = getProvider(chain);

  const currentBlockNumber = await provider.getBlockNumber();

  const blockNumberDeployedOn = chainConfig[chain].blockNumberDeployedOn;

  let events: any[];

  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();

  let lastProcessedBlockNumber = currentBlockNumber;
  do {
    events = await contract.queryFilter(
      "Transfer",
      lastProcessedBlockNumber - 500,
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
    lastProcessedBlockNumber -= 500;
  } while (
    events.length !== 0 ||
    lastProcessedBlockNumber >= blockNumberDeployedOn
  );
}
