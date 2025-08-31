import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: { chainId: 31337 },
    sepolia: {
      url: ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}` : "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  }
};
export default config;
