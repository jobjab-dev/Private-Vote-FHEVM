/**
 * Contract integration utilities
 * Handles interaction with PrivateVote contract
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
// Inline types to avoid path resolution issues on Vercel
export interface CreatePollParams {
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  imageFile?: File | null;
}

export interface VoteParams {
  pollId: number;
  optionId: number;
  encryptedOne: string;
  inputProof: string;
}

// Import ABI from exported file
let PrivateVoteABI: any = null;
try {
  PrivateVoteABI = require('./PrivateVote.json');
  console.log('✅ Contract ABI loaded successfully');
} catch (error) {
  console.error('❌ Contract ABI not found. Run: cd contracts && npm run export-abi');
}

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

console.log('Contract Integration:', {
  address: CONTRACT_ADDRESS,
  rpcUrl: RPC_URL,
  abiLoaded: !!PrivateVoteABI
});

// Create public client for reading
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

/**
 * Get creation fee from contract
 */
export async function getCreationFee(): Promise<string> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) {
      console.warn('Contract not available, using fallback fee');
      return '0.001';
    }

    console.log('📡 Reading creation fee from contract...');
    const fee = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'creationFee',
    } as any) as bigint;

    const feeEth = formatEther(fee);
    console.log(`💰 Creation fee from contract: ${feeEth} ETH`);
    return feeEth;
  } catch (error) {
    console.error('❌ Error getting creation fee:', error);
    return '0.001'; // Fallback
  }
}

/**
 * Get poll count
 */
export async function getPollCount(): Promise<number> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) {
      console.warn('Contract not available for poll count');
      return 0;
    }

    console.log('📊 Reading poll count from contract...');
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'pollCount',
    } as any) as bigint;

    const pollCount = Number(count);
    console.log(`📈 Total polls on contract: ${pollCount}`);
    return pollCount;
  } catch (error) {
    console.error('❌ Error getting poll count:', error);
    return 0;
  }
}

/**
 * Get poll information
 */
export async function getPollInfo(pollId: number) {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) {
      console.warn(`Contract not available for poll ${pollId}`);
      return null;
    }

    console.log(`📋 Reading poll ${pollId} info from contract...`);
    const pollInfo = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'getPollInfo',
      args: [BigInt(pollId)],
    } as any) as any[];

    const info = {
      title: pollInfo[0],
      description: pollInfo[1],
      options: pollInfo[2],
      startTime: Number(pollInfo[3]) * 1000, // Convert to milliseconds
      endTime: Number(pollInfo[4]) * 1000,
      revealed: pollInfo[5],
      creator: pollInfo[6],
      totalVoters: Number(pollInfo[7]),
    };

    console.log(`✅ Poll ${pollId} loaded:`, info.title);
    return info;
  } catch (error) {
    console.error(`❌ Error getting poll ${pollId} info:`, error);
    return null;
  }
}

/**
 * Get poll results (if revealed)
 */
export async function getPollResults(pollId: number) {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return null;

    console.log(`📊 Fetching poll ${pollId} results from contract...`);
    
    const results = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'getPollResults',
      args: [BigInt(pollId)],
    } as any) as [bigint[], bigint];

    const processedResults = {
      tallies: results[0].map(t => Number(t)),
      totalVotes: Number(results[1]),
    };

    console.log(`✅ Poll ${pollId} contract results:`, {
      rawTallies: results[0].map(t => t.toString()),
      rawTotalVotes: results[1].toString(),
      processedTallies: processedResults.tallies,
      processedTotalVotes: processedResults.totalVotes
    });

    return processedResults;
  } catch (error) {
    console.error('❌ Error getting poll results:', error);
    return null;
  }
}

/**
 * Get poll status
 */
export async function getPollStatus(pollId: number): Promise<string> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return 'unknown';

    const status = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'getPollStatus',
      args: [BigInt(pollId)],
    } as any) as string;

    return status;
  } catch (error) {
    console.error('Error getting poll status:', error);
    return 'unknown';
  }
}

/**
 * Check if user has voted
 */
export async function hasUserVoted(pollId: number, userAddress: string): Promise<boolean> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return false;

    const voted = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'hasVoted',
      args: [BigInt(pollId), userAddress as `0x${string}`],
    } as any) as boolean;

    return voted;
  } catch (error) {
    console.error('Error checking vote status:', error);
    return false;
  }
}

/**
 * Get contract owner
 */
export async function getContractOwner(): Promise<string | null> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return null;

    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'owner',
    } as any) as string;

    return owner;
  } catch (error) {
    console.error('Error getting contract owner:', error);
    return null;
  }
}

/**
 * Check if decryption is in progress
 */
export async function isDecryptionInProgress(pollId: number): Promise<boolean> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return false;

    const inProgress = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: PrivateVoteABI.abi,
      functionName: 'isDecryptionInProgress',
      args: [BigInt(pollId)],
    } as any) as boolean;

    return inProgress;
  } catch (error) {
    console.error('Error checking decryption progress:', error);
    return false;
  }
}

// Cache reveal check results to prevent excessive API calls
const revealCheckCache = new Map<number, { result: boolean; timestamp: number; }>(); 
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Clear cache for a specific poll (useful after reveal confirm)
 */
export function clearRevealCache(pollId: number) {
  revealCheckCache.delete(pollId);
  console.log(`🗑️ Cleared reveal cache for poll ${pollId}`);
}

/**
 * Check if poll can be revealed (ended but not revealed and no decryption in progress)
 */
export async function canRevealPoll(pollId: number): Promise<boolean> {
  try {
    // Check cache first
    const cached = revealCheckCache.get(pollId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Using cached reveal status for poll ${pollId}: ${cached.result}`);
      return cached.result;
    }

    console.log(`🔍 Fetching fresh reveal status for poll ${pollId}...`);
    
    const [pollInfo, status, inProgress] = await Promise.all([
      getPollInfo(pollId),
      getPollStatus(pollId),
      isDecryptionInProgress(pollId)
    ]);

    if (!pollInfo) {
      revealCheckCache.set(pollId, { result: false, timestamp: Date.now() });
      return false;
    }

    const canReveal = (
      status === 'ended' && 
      !pollInfo.revealed && 
      !inProgress
    );

    // Cache the result
    revealCheckCache.set(pollId, { result: canReveal, timestamp: Date.now() });
    
    console.log(`✅ Poll ${pollId} reveal check: ${canReveal} (cached for ${CACHE_DURATION/1000}s)`);
    
    return canReveal;
  } catch (error) {
    console.error('Error checking reveal status:', error);
    return false;
  }
}

/**
 * Get creation transaction hash for a poll from event logs
 */
export async function getPollCreationTx(pollId: number): Promise<string | null> {
  try {
    if (!PrivateVoteABI || !CONTRACT_ADDRESS) return null;

    console.log(`🔍 Looking up creation transaction for poll ${pollId}...`);

    // Query PollCreated events from the contract
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'PollCreated',
        inputs: [
          { type: 'uint256', name: 'pollId', indexed: true },
          { type: 'address', name: 'creator', indexed: true },
          { type: 'string', name: 'title' },
          { type: 'uint256', name: 'startTime' },
          { type: 'uint256', name: 'endTime' },
          { type: 'uint256', name: 'optionsCount' },
          { type: 'uint256', name: 'creationFee' }
        ]
      },
      args: {
        pollId: BigInt(pollId)
      },
      fromBlock: 'earliest',
      toBlock: 'latest'
    });

    if (logs.length > 0) {
      const txHash = logs[0].transactionHash;
      console.log(`✅ Found creation transaction for poll ${pollId}: ${txHash}`);
      return txHash;
    }

    console.log(`❌ No creation transaction found for poll ${pollId}`);
    return null;
  } catch (error) {
    console.error(`❌ Error getting creation tx for poll ${pollId}:`, error);
    return null;
  }
}

/**
 * Utils for frontend
 */
export const contractUtils = {
  getCreationFee,
  getPollCount,
  getPollInfo,
  getPollResults,
  getPollStatus,
  hasUserVoted,
  getContractOwner,
  isDecryptionInProgress,
  canRevealPoll,
  getPollCreationTx,
  clearRevealCache,
  
  // Helper to check if contract is available
  isContractAvailable: () => Boolean(PrivateVoteABI && CONTRACT_ADDRESS),
  
  // Helper to get ABI
  getABI: () => PrivateVoteABI?.abi || [],
  
  // Helper to parse creation fee
  parseCreationFee: (fee: string) => parseEther(fee),
  
  // Helper to format wei amounts
  formatFee: (wei: bigint) => formatEther(wei),
};
