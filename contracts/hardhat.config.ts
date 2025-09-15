import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // Load from root
dotenv.config({ path: "./.env" }); // Load from current directory (priority)

// Debug environment loading
console.log('Environment loading:');
console.log(`PRIVATE_KEY: ${process.env.PRIVATE_KEY ? 'SET' : 'NOT SET'}`);
console.log(`INFURA_API_KEY: ${process.env.INFURA_API_KEY ? 'SET' : 'NOT SET'}`);

// Use environment variables
const PRIVATE_KEY: string = process.env.PRIVATE_KEY || "0x1234567890123456789012345678901234567890123456789012345678901234";
const INFURA_API_KEY: string = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY || "";

// Gas Configuration
const USE_FIXED_GAS = process.env.USE_FIXED_GAS === "true";
const GAS_PRICE_GWEI = parseInt(process.env.GAS_PRICE || "20");
const GAS_LIMIT = parseInt(process.env.GAS_LIMIT || "8000000");
const GAS_PRICE_MULTIPLIER = parseFloat(process.env.GAS_PRICE_MULTIPLIER || "1.1");

// Convert gwei to wei (1 gwei = 1e9 wei)
const GAS_PRICE_WEI = GAS_PRICE_GWEI * 1e9;

// Log gas configuration
console.log(`Gas Configuration: ${USE_FIXED_GAS ? 'FIXED' : 'AUTO'}`);
if (USE_FIXED_GAS) {
  console.log(`  Gas Price: ${GAS_PRICE_GWEI} gwei (${GAS_PRICE_WEI} wei)`);
  console.log(`  Gas Limit: ${GAS_LIMIT.toLocaleString()}`);
} else {
  console.log(`  Gas: Auto-estimation with ${GAS_PRICE_MULTIPLIER}x multiplier`);
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
      accounts: [
        {
          privateKey: PRIVATE_KEY,
          balance: "10000000000000000000000", // 10000 ETH
        }
      ],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [PRIVATE_KEY],
    },
    sepolia: {
      url: INFURA_API_KEY && INFURA_API_KEY !== "a4f07abe883344e1bad9386a2c96fa23" 
        ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
        : "https://ethereum-sepolia-rpc.publicnode.com", // Fallback to public RPC
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
      // Gas configuration - conditional based on USE_FIXED_GAS
      ...(USE_FIXED_GAS && {
        gas: GAS_LIMIT,
        gasPrice: GAS_PRICE_WEI,
      }),
      // If USE_FIXED_GAS=false, Hardhat will use viem to estimate gas automatically
      // with gasPrice multiplier for more reliable transactions
      ...(!USE_FIXED_GAS && {
        gasMultiplier: GAS_PRICE_MULTIPLIER,
      }),
    },
  },

  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },

  namedAccounts: {
    deployer: 0,
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./script",
  },

  mocha: {
    timeout: 60000, // 60 seconds for FHE operations
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },

  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
