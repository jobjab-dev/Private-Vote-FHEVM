/**
 * Hook for revealing poll results publicly
 * Anyone can call publicReveal() after voting ends
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractUtils, CONTRACT_ADDRESS } from '../lib/contract';

export interface UsePublicRevealResult {
  isRevealing: boolean;
  canReveal: boolean | null;
  error: string | null;
  transactionHash: string | null;
  isConfirmed: boolean;
  revealPoll: () => Promise<void>;
  checkCanReveal: () => Promise<void>;
}

export function usePublicReveal(pollId: number): UsePublicRevealResult {
  const [canReveal, setCanReveal] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Account hook
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

  const isRevealing = (isWritePending || isConfirmPending) && !isConfirmed;

  // Debounced check function to prevent spam
  const checkCanReveal = useCallback(async () => {
    // Clear any pending checks
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Debounce: wait 500ms before actual check
    checkTimeoutRef.current = setTimeout(async () => {
      if (isChecking) {
        console.log('🔄 Already checking reveal status, skipping...');
        return;
      }

      setIsChecking(true);
      
      try {
        if (!contractUtils.isContractAvailable()) {
          setError('Contract not available');
          return;
        }

        console.log(`🔍 Checking if poll ${pollId} can be revealed...`);
        const canRevealResult = await contractUtils.canRevealPoll(pollId);
        setCanReveal(canRevealResult);
        
        console.log(`✅ Poll ${pollId} can reveal: ${canRevealResult}`);
      } catch (err) {
        console.error('Error checking reveal status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check reveal status');
        setCanReveal(false);
      } finally {
        setIsChecking(false);
      }
    }, 500);
  }, [pollId, isChecking]);

  // Reveal poll results
  const revealPoll = async () => {
    try {
      setError(null);
      resetWrite();

      if (!contractUtils.isContractAvailable() || !CONTRACT_ADDRESS) {
        throw new Error('Contract not available');
      }

      // Double-check reveal status
      const canRevealNow = await contractUtils.canRevealPoll(pollId);
      if (!canRevealNow) {
        throw new Error('Poll cannot be revealed yet or is already revealed');
      }

      console.log(`🚀 Calling publicReveal for poll ${pollId}...`);

      // Call publicReveal function
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractUtils.getABI(),
        functionName: 'publicReveal',
        args: [BigInt(pollId)],
        chain,
        account: address
      });

      console.log('⏳ Public reveal transaction submitted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reveal poll';
      console.error('❌ Public reveal failed:', errorMessage);
      setError(errorMessage);
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

  // Log transaction status changes
  useEffect(() => {
    if (transactionHash) {
      console.log(`📝 Public reveal transaction hash: ${transactionHash}`);
    }
  }, [transactionHash]);

  useEffect(() => {
    if (isConfirmed) {
      console.log(`✅ Poll ${pollId} reveal confirmed!`);
      // Don't auto-refresh reveal status - let parent handle data refresh
    }
  }, [isConfirmed, pollId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  return {
    isRevealing,
    canReveal,
    error,
    transactionHash: transactionHash || null,
    isConfirmed,
    revealPoll,
    checkCanReveal,
  };
}
