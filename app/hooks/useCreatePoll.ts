'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { contractUtils } from '../lib/contract';

interface CreatePollParams {
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
}

export function useCreatePoll() {
  const [isCreating, setIsCreating] = useState(false);
  const [creationFee, setCreationFee] = useState<string>('0.001');
  const { address } = useAccount();
  
  const { writeContract, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Load creation fee from contract
  useEffect(() => {
    const loadCreationFee = async () => {
      try {
        const { getCreationFee } = await import('../lib/contract');
        const fee = await getCreationFee();
        setCreationFee(fee);
      } catch (error) {
        console.error('Error loading creation fee:', error);
        setCreationFee('0.001'); // Fallback
      }
    };

    loadCreationFee();
  }, [address]);

  const createPoll = async (params: CreatePollParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsCreating(true);
    
    try {
      console.log('🚀 Creating poll on Sepolia:', params);
      console.log('💰 Creation fee:', creationFee, 'ETH');

      // Get contract ABI and address
      const PrivateVoteABI = require('../lib/PrivateVote.json');
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
      
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      // Convert timestamps to seconds (contract expects Unix timestamps)
      const startTimeSeconds = Math.floor(params.startTime / 1000);
      const endTimeSeconds = Math.floor(params.endTime / 1000);

      console.log('📝 Contract parameters:', {
        title: params.title,
        description: params.description,
        options: params.options,
        startTime: startTimeSeconds,
        endTime: endTimeSeconds,
        value: parseEther(creationFee)
      });

      // Call contract createPoll function
      writeContract({
        address: contractAddress,
        abi: PrivateVoteABI.abi,
        functionName: 'createPoll',
        args: [
          params.title,
          params.description,
          params.options,
          BigInt(startTimeSeconds),
          BigInt(endTimeSeconds)
        ],
        value: parseEther(creationFee), // 0.001 ETH creation fee
      });

      console.log('📡 Transaction submitted...');
      
    } catch (error) {
      console.error('❌ Error creating poll:', error);
      setIsCreating(false);
      throw error;
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ Poll created successfully! Transaction confirmed.');
      setIsCreating(false);
    }
  }, [isConfirmed]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Transaction error:', writeError);
      setIsCreating(false);
    }
  }, [writeError]);

  // Update isCreating status based on transaction state
  const totalIsCreating = (isCreating || isConfirming) && !isConfirmed;

  return { 
    createPoll, 
    isCreating: totalIsCreating, 
    creationFee,
    hash,
    isConfirmed,
    error: writeError
  };
}
