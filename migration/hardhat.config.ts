import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as envConfig } from "dotenv";
envConfig();

// This adds support for typescript paths mappings
import "tsconfig-paths/register";

const PRIVATE_KEY: string = process.env.PRIVATE_KEY || "";
const SEPOLIA_API: string =
    process.env.SEPOLIA_API ||
    "https://eth-sepolia.g.alchemy.com/v2/5mkt3seuOH3k2m8SwCsQDDckTC5jT27e";
const ETHEREUM_API =
    process.env.ETHEREUM_API || "https://ethereum-mainnet.xdefiservices.com";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_API,
      accounts: [PRIVATE_KEY],
    },
    ethereum: {
      url: ETHEREUM_API,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
