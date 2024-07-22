import * as ethers from "ethers";
import { erc20Abi } from "./erc20abi";
import { AppDataSource } from "./db/app-data-source";

const XDEFI_CONTRACT_ETH = "0x72b886d09c117654ab7da13a14d603001de0b777";

const XDEFI_CONTRACT_ARB = "0x180f7cf38805d1be95c7632f653e26b0838e2969";

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

async function getEvents() {
  console.log("getEvents()");

  const contract = new ethers.Contract(XDEFI_CONTRACT_ETH, erc20Abi, provider);

  const currentBlock = await provider.getBlockNumber();

  const events = await contract.queryFilter(
    "Transfer",
    currentBlock - 500,
    currentBlock
  );

  console.dir(events);

  // events.map(e => {
  //   e.
  // })
}

async function main() {
  const dataSource = await AppDataSource.initialize();
}
