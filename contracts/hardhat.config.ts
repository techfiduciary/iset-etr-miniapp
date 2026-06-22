import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
dotenv.config();

const PK = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: {
    celoSepolia: { url: "https://forno.celo-sepolia.celo-testnet.org", chainId: 11142220, accounts: PK },
    celo: { url: "https://forno.celo.org", chainId: 42220, accounts: PK },
  },
  etherscan: {
    apiKey: { celoSepolia: process.env.CELOSCAN_API_KEY || "", celo: process.env.CELOSCAN_API_KEY || "" },
    customChains: [
      { network: "celoSepolia", chainId: 11142220, urls: { apiURL: "https://api-sepolia.celoscan.io/api", browserURL: "https://sepolia.celoscan.io" } },
      { network: "celo", chainId: 42220, urls: { apiURL: "https://api.celoscan.io/api", browserURL: "https://celoscan.io" } },
    ],
  },
};

export default config;
