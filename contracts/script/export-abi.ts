import * as fs from 'fs';
import * as path from 'path';

async function exportABI() {
  try {
    // Read latest deployment info
    const latestDeploymentPath = path.join(__dirname, '..', 'deployments', 'latest.json');
    if (!fs.existsSync(latestDeploymentPath)) {
      throw new Error('No deployment found. Please deploy the contract first.');
    }

    const latestDeployment = JSON.parse(fs.readFileSync(latestDeploymentPath, 'utf8'));
    const { networkName, contractAddress } = latestDeployment;

    // Read contract deployment data from hardhat-deploy
    const deploymentPath = path.join(__dirname, '..', 'deployments', networkName, 'PrivateVote.json');
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    // Prepare ABI export for frontend
    const exportData = {
      abi: deploymentData.abi,
      address: contractAddress,
      contractName: "PrivateVote"
    };

    // Export to frontend lib directory
    const frontendLibPath = path.join(__dirname, '..', '..', 'app', 'lib', 'PrivateVote.json');
    const frontendLibDir = path.dirname(frontendLibPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(frontendLibDir)) {
      fs.mkdirSync(frontendLibDir, { recursive: true });
    }

    // Write ABI to frontend
    fs.writeFileSync(frontendLibPath, JSON.stringify(exportData, null, 2));

    console.log('===================================');
    console.log('✅ ABI Export Successful!');
    console.log(`📁 Exported to: ${frontendLibPath}`);
    console.log(`🔗 Contract: ${contractAddress}`);
    console.log(`🌐 Network: ${networkName}`);
    console.log('===================================');
    
  } catch (error) {
    console.error('❌ ABI Export Failed:', error);
    process.exit(1);
  }
}

// Run the export
exportABI();
