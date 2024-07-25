import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";

import { config as envConfig } from "dotenv";
envConfig();

// This adds support for typescript paths mappings
import "tsconfig-paths/register";

const PRIVATE_KEY: string = process.env.PRIVATE_KEY || "";
const BOB_PRIVATE_KEY: string = process.env.BOB_PRIVATE_KEY || "";
const ALICE_PRIVATE_KEY: string = process.env.ALICE_PRIVATE_KEY || "";
const SEPOLIA_API: string =
  process.env.SEPOLIA_API ||
  "https://eth-sepolia.g.alchemy.com/v2/5mkt3seuOH3k2m8SwCsQDDckTC5jT27e";
const ETHEREUM_API =
  process.env.ETHEREUM_API || "https://ethereum-mainnet.xdefiservices.com";

const REPORT_GAS: boolean = process.env.REPORT_GAS === "true";
const COINMARKETCAP_API_KEY: string = process.env.COINMARKETCAP_API_KEY || "";
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "sepolia",
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    token: "ETH",
    L1: "ethereum",
    gasPriceApi: `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${ETHERSCAN_API_KEY}`,
    coinmarketcap: COINMARKETCAP_API_KEY,
    reportFormat: "markdown",
    outputFile: "gas-report.md",
  },
  etherscan: {
    apiKey: {
      // Ethereum
      goerli: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_API,
      accounts: [PRIVATE_KEY, BOB_PRIVATE_KEY, ALICE_PRIVATE_KEY],
    },
    ethereum: {
      url: ETHEREUM_API,
      accounts: [PRIVATE_KEY, BOB_PRIVATE_KEY, ALICE_PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 100000000,
    retries: 0,
  },
};

export default config;
