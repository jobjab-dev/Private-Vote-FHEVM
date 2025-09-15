'use client';

import { useState, useEffect } from 'react';
import { usePolls } from './usePolls';
import { contractUtils } from '../lib/contract';

interface Poll {
  id: number;
  title: string;
  description: string;
  options: string[];
  startTime: number;
  endTime: number;
  revealed: boolean;
  creator: string;
  totalVoters: number;
  status: 'upcoming' | 'active' | 'ended' | 'revealed';
}

export function usePoll(pollId: number) {
  const { polls } = usePolls();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh single poll data directly from contract
  const refreshPoll = async () => {
    try {
      if (!contractUtils.isContractAvailable()) {
        console.warn('Contract not available for poll refresh');
        return;
      }

      console.log(`🔄 Refreshing poll ${pollId} data...`);
      
      const [info, status] = await Promise.all([
        contractUtils.getPollInfo(pollId),
        contractUtils.getPollStatus(pollId)
      ]);

      if (!info) {
        console.log(`❌ Poll ${pollId} not found during refresh`);
        setPoll(null);
        return;
      }

      // Determine status
      const now = Date.now();
      let pollStatus: 'upcoming' | 'active' | 'ended' | 'revealed';
      
      if (info.revealed) {
        pollStatus = 'revealed';
      } else if (now < info.startTime) {
        pollStatus = 'upcoming';
      } else if (now >= info.startTime && now < info.endTime) {
        pollStatus = 'active';
      } else {
        pollStatus = 'ended';
      }

      const refreshedPoll: Poll = {
        id: pollId,
        title: info.title,
        description: info.description,
        options: info.options,
        startTime: info.startTime,
        endTime: info.endTime,
        revealed: info.revealed,
        creator: info.creator,
        totalVoters: info.totalVoters,
        status: pollStatus,
      };

      console.log(`✅ Poll ${pollId} refreshed - revealed: ${info.revealed}`);
      setPoll(refreshedPoll);
    } catch (error) {
      console.error(`❌ Error refreshing poll ${pollId}:`, error);
    }
  };

  useEffect(() => {
    if (polls.length > 0) {
      const foundPoll = polls.find(p => p.id === pollId);
      setPoll(foundPoll || null);
      setIsLoading(false);
    }
  }, [polls, pollId]);

  return { poll, isLoading, refreshPoll };
}
