'use client';

import { useState, useEffect } from 'react';

interface Poll {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  options: string[];
  startTime: number;
  endTime: number;
  revealed: boolean;
  creator: string;
  totalVoters: number;
  status: 'upcoming' | 'active' | 'ended' | 'revealed';
  creationTxHash?: string;
}

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPolls = async () => {
      setIsLoading(true);
      
      try {
        // Load from PrivateVote contract on Sepolia
        const { contractUtils } = await import('../lib/contract');
        
        console.log('🔍 Loading polls from contract...');
        
        // Get total poll count
        const count = await contractUtils.getPollCount();
        console.log(`📊 Found ${count} polls on contract`);
        
        if (count === 0) {
          setPolls([]);
          setIsLoading(false);
          return;
        }

        // Load all polls from contract
        const pollPromises = [];
        for (let i = 0; i < count; i++) {
          pollPromises.push(
            Promise.all([
              contractUtils.getPollInfo(i),
              contractUtils.getPollStatus(i),
              contractUtils.getPollCreationTx(i)
            ]).then(([info, status, creationTxHash]) => {
              if (!info) return null;
              
              // Determine status based on timestamps and revealed state
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
              
              return {
                id: i,
                title: info.title,
                description: info.description,
                options: info.options,
                startTime: info.startTime,
                endTime: info.endTime,
                revealed: info.revealed,
                creator: info.creator,
                totalVoters: info.totalVoters,
                status: pollStatus,
                creationTxHash: creationTxHash || undefined,
              };
            })
          );
        }

        const pollResults = await Promise.all(pollPromises);
        const validPolls = pollResults.filter(poll => poll !== null) as Poll[];
        
        console.log(`✅ Loaded ${validPolls.length} polls from contract`);
        setPolls(validPolls);
        setIsLoading(false);
        return;
        
      } catch (error) {
        console.error('❌ Error loading from contract:', error);
      }
      
      // No polls from contract or error occurred - show empty state
      setPolls([]);
      setIsLoading(false);
    };

    loadPolls();
  }, []);

  return { polls, isLoading };
}
