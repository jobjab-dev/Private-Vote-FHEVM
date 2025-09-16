import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { preDeploymentCheck } from "../utils/gas-utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const owner = deployer; // Use deployer as owner

  console.log("===================================");
  console.log(`Deploying PrivateVote on ${network.name}...`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Owner: ${owner}`);
  console.log("===================================");

  // Clean up old deployment cache for fresh deployment
  const fs = require("fs");
  const path = require("path");
  const deploymentDir = path.join(__dirname, "..", "deployments", network.name);
  if (fs.existsSync(deploymentDir)) {
    // Remove entire network deployment directory
    fs.rmSync(deploymentDir, { recursive: true, force: true });
    console.log(`🗑️  Removed entire deployment directory: ${deploymentDir}`);
  }

  // Pre-deployment gas analysis (Sepolia only)
  if (network.name === "sepolia") {
    const useFixedGas = process.env.USE_FIXED_GAS === "true";
    const rpcUrl = process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
    
    try {
      // Get contract artifact for bytecode
      const PrivateVoteArtifact = await hre.artifacts.readArtifact("PrivateVote");
      await preDeploymentCheck(rpcUrl, PrivateVoteArtifact.bytecode, useFixedGas);
    } catch (error) {
      console.log("⚠️  Gas estimation failed, proceeding with deployment...");
    }
  }

  const privatevote = await deploy("PrivateVote", {
    from: deployer,
    args: [owner], // Owner address as constructor argument
    log: true,
    waitConfirmations: network.name === "sepolia" ? 5 : 1,
    skipIfAlreadyDeployed: false, // Always deploy new contract, never reuse
    deterministicDeployment: false, // Disable deterministic deployment to force new address
  });

  console.log("===================================");
  console.log(`✅ PrivateVote deployed to: ${privatevote.address}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Creation Fee: 0.001 ETH`);
  console.log(`   Transaction: ${privatevote.transactionHash}`);
  console.log("===================================");

  // Save deployment info to file for frontend

  const deploymentInfo = {
    chainId: network.config.chainId,
    networkName: network.name,
    contractAddress: privatevote.address,
    owner: owner,
    creationFee: "0.001",
    deploymentBlock: privatevote.receipt?.blockNumber,
    deploymentTime: new Date().toISOString(),
    transactionHash: privatevote.transactionHash,
  };

  const deploymentPath = path.join(__dirname, "..", "deployments", "latest.json");
  const dir = path.dirname(deploymentPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  console.log('');
  console.log('📋 Next steps:');
  console.log('1. npm run export-abi                    # Export ABI to frontend');
  console.log(`2. npx tsx script/update-frontend-config.ts ${privatevote.address}  # Update frontend config`);
  console.log('3. cd ../app && npm run dev             # Start frontend');
  console.log('4. Visit http://localhost:3000          # Test the dApp');

  // Verification on Etherscan (if not localhost)
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("⏳ Waiting for verification...");
    try {
      await hre.run("verify:verify", {
        address: privatevote.address,
        constructorArguments: [owner],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }
};

func.tags = ["PrivateVote", "main"];

export default func;
