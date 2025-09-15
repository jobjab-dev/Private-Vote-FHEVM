'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractUtils, CONTRACT_ADDRESS } from '../lib/contract';
import { encryptVoteInput } from '../lib/fhevm';

interface VoteParams {
  pollId: number;
  optionId: number;
}

export function useVote() {
  const [error, setError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { address, chain } = useAccount();
  
  // Contract interaction hooks
  const {
    writeContract,
    data: transactionHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  const {
    isLoading: isConfirmPending,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const isVoting = (isWritePending || isConfirmPending || isEncrypting) && !isConfirmed;

  const vote = async (params: VoteParams) => {
    try {
      setError(null);
      resetWrite();
      setIsEncrypting(true);

      if (!contractUtils.isContractAvailable() || !CONTRACT_ADDRESS) {
        throw new Error('Contract not available');
      }

      if (!address) {
        throw new Error('Wallet not connected');
      }

      console.log('🗳️ Casting vote:', params);

      // Use FHEVM SDK to encrypt the vote
      console.log('🔒 Encrypting vote input with FHEVM...');
      const { encryptedVote, inputProof } = await encryptVoteInput(
        CONTRACT_ADDRESS,
        address,
        1n // Always vote with value 1
      );

      setIsEncrypting(false);
      console.log('✅ Vote encrypted successfully');

      // Call vote function on contract with real encrypted values
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractUtils.getABI(),
        functionName: 'vote',
        args: [
          BigInt(params.pollId),
          BigInt(params.optionId),
          encryptedVote,
          inputProof
        ],
        chain,
        account: address
      });

      console.log('⏳ Vote transaction submitted');
    } catch (err) {
      setIsEncrypting(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cast vote';
      console.error('❌ Vote failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Write contract error:', writeError);
      setError(writeError.message || 'Transaction failed');
    } else if (confirmError) {
      console.error('❌ Transaction confirmation error:', confirmError);
      setError('Transaction confirmation failed');
    }
  }, [writeError, confirmError]);

  // Log success
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ Vote confirmed!');
    }
  }, [isConfirmed]);

  return { 
    vote, 
    isVoting,
    error,
    transactionHash,
    isConfirmed
  };
}
