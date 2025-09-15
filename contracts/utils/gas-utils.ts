import { createPublicClient, http, parseGwei, formatGwei } from 'viem';
import { sepolia } from 'viem/chains';

// Gas estimation utilities using viem
export class GasEstimator {
  private client;
  private multiplier: number;

  constructor(rpcUrl: string, multiplier: number = 1.1) {
    this.client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    this.multiplier = multiplier;
  }

  /**
   * Get current gas price from network
   */
  async getCurrentGasPrice(): Promise<{ gwei: string; wei: bigint }> {
    try {
      const gasPrice = await this.client.getGasPrice();
      const adjustedGasPrice = BigInt(Math.floor(Number(gasPrice) * this.multiplier));
      
      return {
        gwei: formatGwei(adjustedGasPrice),
        wei: adjustedGasPrice,
      };
    } catch (error) {
      console.warn('Failed to get network gas price, using fallback:', error);
      
      // Fallback to 20 gwei
      const fallbackGasPrice = parseGwei('20');
      return {
        gwei: '20',
        wei: fallbackGasPrice,
      };
    }
  }

  /**
   * Estimate gas for a contract deployment
   */
  async estimateDeploymentGas(
    bytecode: string,
    constructorArgs: any[] = []
  ): Promise<{ gasLimit: bigint; gasPrice: bigint; totalCost: bigint }> {
    try {
      const gasPrice = await this.getCurrentGasPrice();
      
      // Estimate gas limit (fallback to 8M if estimation fails)
      let gasLimit: bigint;
      try {
        gasLimit = await this.client.estimateGas({
          data: bytecode as `0x${string}`,
        });
        
        // Add 20% buffer for safety
        gasLimit = BigInt(Math.floor(Number(gasLimit) * 1.2));
      } catch {
        gasLimit = BigInt(8000000); // 8M gas fallback
      }

      const totalCost = gasLimit * gasPrice.wei;

      return {
        gasLimit,
        gasPrice: gasPrice.wei,
        totalCost,
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      
      // Return safe defaults
      return {
        gasLimit: BigInt(8000000),
        gasPrice: parseGwei('20'),
        totalCost: BigInt(8000000) * parseGwei('20'),
      };
    }
  }

  /**
   * Format wei to ETH for display
   */
  formatEthCost(wei: bigint): string {
    const eth = Number(wei) / 1e18;
    return `${eth.toFixed(6)} ETH`;
  }

  /**
   * Get gas configuration for Hardhat network
   */
  async getNetworkGasConfig(useFixed: boolean) {
    if (useFixed) {
      const gasPrice = parseGwei(process.env.GAS_PRICE || "20");
      const gasLimit = parseInt(process.env.GAS_LIMIT || "8000000");
      
      console.log(`Using FIXED gas: ${formatGwei(gasPrice)} gwei, limit: ${gasLimit.toLocaleString()}`);
      
      return {
        gas: gasLimit,
        gasPrice: gasPrice,
      };
    } else {
      const estimation = await this.getCurrentGasPrice();
      
      console.log(`Using AUTO gas estimation: ${estimation.gwei} gwei (${this.multiplier}x multiplier)`);
      
      return {
        // Let Hardhat estimate gas limit automatically
        gasMultiplier: this.multiplier,
      };
    }
  }
}

/**
 * Pre-deployment gas estimation
 */
export async function preDeploymentCheck(
  rpcUrl: string,
  contractBytecode: string,
  useFixedGas: boolean
): Promise<void> {
  console.log('\n=== Pre-Deployment Gas Analysis ===');
  
  const estimator = new GasEstimator(rpcUrl);
  
  if (useFixedGas) {
    const gasPrice = parseGwei(process.env.GAS_PRICE || "20");
    const gasLimit = BigInt(process.env.GAS_LIMIT || "8000000");
    const totalCost = gasLimit * gasPrice;
    
    console.log(`Mode: FIXED GAS`);
    console.log(`Gas Price: ${formatGwei(gasPrice)} gwei`);
    console.log(`Gas Limit: ${gasLimit.toLocaleString()}`);
    console.log(`Estimated Cost: ${estimator.formatEthCost(totalCost)}`);
  } else {
    const estimation = await estimator.estimateDeploymentGas(contractBytecode);
    
    console.log(`Mode: AUTO ESTIMATION`);
    console.log(`Gas Price: ${formatGwei(estimation.gasPrice)} gwei`);
    console.log(`Gas Limit: ${estimation.gasLimit.toLocaleString()}`);
    console.log(`Estimated Cost: ${estimator.formatEthCost(estimation.totalCost)}`);
  }
  
  console.log('===================================\n');
}
