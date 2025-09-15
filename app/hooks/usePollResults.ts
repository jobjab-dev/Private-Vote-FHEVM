'use client';

import { useState, useEffect } from 'react';
import { contractUtils } from '../lib/contract';

interface PollResults {
  pollId: number;
  tallies: number[];
  totalVotes: number;
  revealed: boolean;
}

export function usePollResults(pollId: number, refreshTrigger?: number) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      
      try {
        if (!contractUtils.isContractAvailable()) {
          console.warn('Contract not available for poll results');
          setResults(null);
          return;
        }

        console.log(`🔍 Loading results for poll ${pollId}...`);
        
        // Get poll info to check if revealed
        const pollInfo = await contractUtils.getPollInfo(pollId);
        if (!pollInfo) {
          console.log(`❌ Poll ${pollId} not found`);
          setResults(null);
          return;
        }

        if (!pollInfo.revealed) {
          console.log(`🔒 Poll ${pollId} not revealed yet`);
          setResults({
            pollId,
            tallies: [],
            totalVotes: pollInfo.totalVoters,
            revealed: false,
          });
          return;
        }

        // Get poll results if revealed
        const contractResults = await contractUtils.getPollResults(pollId);
        if (contractResults) {
          console.log(`✅ Poll ${pollId} results loaded from contract:`, {
            tallies: contractResults.tallies,
            totalVotes: contractResults.totalVotes,
            pollRevealed: pollInfo.revealed
          });
          
          setResults({
            pollId,
            tallies: contractResults.tallies,
            totalVotes: contractResults.totalVotes,
            revealed: true,
          });
        } else {
          console.log(`❌ No contract results for poll ${pollId} (revealed: ${pollInfo.revealed})`);
          setResults(null);
        }
        
      } catch (error) {
        console.error('❌ Error loading results:', error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [pollId, refreshTrigger]);

  return { results, isLoading };
}
