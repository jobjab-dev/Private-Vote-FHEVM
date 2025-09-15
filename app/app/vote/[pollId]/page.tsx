'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePoll } from '../../../hooks/usePoll';
import { useVote } from '../../../hooks/useVote';
import { Countdown } from '../../../components/Countdown';
import { contractUtils } from '../../../lib/contract';

export default function VotePage() {
  const params = useParams();
  const pollIdParam = params.pollId as string;
  const pollId = parseInt(pollIdParam);
  
  // Early validation - before hooks
  const isValidPollId = pollIdParam && !isNaN(pollId);
  
  const { isConnected, address } = useAccount();
  const { poll, isLoading } = usePoll(isValidPollId ? pollId : 0);
  const { vote, isVoting, error, transactionHash, isConfirmed } = useVote();
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [isCheckingVoteStatus, setIsCheckingVoteStatus] = useState(false);

  // Show error if invalid pollId
  if (!isValidPollId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Invalid Poll ID</h1>
          <p className="text-gray-400">The poll ID must be a valid number.</p>
          <a href="/" className="btn-zama-primary">Back to Home</a>
        </div>
      </div>
    );
  }

  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!poll || !address || !isConnected) {
        setHasVoted(null);
        return;
      }

      setIsCheckingVoteStatus(true);
      try {
        console.log(`🔍 Checking if ${address} has voted on poll ${pollId}...`);
        const voted = await contractUtils.hasUserVoted(pollId, address);
        setHasVoted(voted);
        console.log(`✅ Vote status for poll ${pollId}: ${voted ? 'Already voted' : 'Not voted yet'}`);
      } catch (error) {
        console.error('Error checking vote status:', error);
        setHasVoted(false);
      } finally {
        setIsCheckingVoteStatus(false);
      }
    };

    checkVoteStatus();
  }, [poll, address, isConnected, pollId]);

  // Reset hasVoted check after successful vote
  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ Vote confirmed - updating vote status');
      setHasVoted(true);
    }
  }, [isConfirmed]);

  const handleVote = async () => {
    if (selectedOption === null || !poll) return;
    
    try {
      console.log(`🗳️ Voting for option ${selectedOption} in poll ${pollId}`);
      
      await vote({
        pollId,
        optionId: selectedOption,
      });
    } catch (error) {
      console.error('❌ Error voting:', error);
      // Error is already handled in useVote hook
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-700 rounded w-64"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Poll Not Found</h2>
        <p className="text-gray-400">The poll you&apos;re looking for doesn&apos;t exist.</p>
        <a href="/" className="btn-zama-primary mt-6 inline-block">
          Back to Polls
        </a>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center py-12">
        <div className="card-zama-highlight max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet to Vote</h2>
          <p className="text-gray-400 mb-6">You need to connect your wallet to cast your vote</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  const now = Date.now();
  const isVotingActive = now >= poll.startTime && now < poll.endTime;
  const hasVotingEnded = now >= poll.endTime;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Poll Header */}
      <div className="card-zama">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{poll.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              poll.status === 'active' ? 'status-active' :
              poll.status === 'upcoming' ? 'status-upcoming' :
              poll.status === 'ended' ? 'status-ended' : 'status-revealed'
            }`}>
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
          </div>
          
          <p className="text-gray-400">{poll.description}</p>
          
          {/* Countdown */}
          {isVotingActive && (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-yellow-300 font-medium">Voting ends in:</span>
                <Countdown targetTime={poll.endTime} />
              </div>
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{poll.totalVoters} voters</span>
            <span>•</span>
            <span>{poll.options.length} options</span>
          </div>
        </div>
      </div>

      {/* Vote Status Check */}
      {isCheckingVoteStatus ? (
        <div className="card-zama text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-48 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-32 mx-auto"></div>
          </div>
        </div>
      ) : hasVoted ? (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Vote Cast Successfully</h2>
          <p className="text-gray-400 mb-6">
            You have already voted in this poll. Your vote has been encrypted and recorded on the blockchain.
          </p>
          
          {transactionHash && (
            <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-sm">
                <strong>Your vote transaction:</strong>
              </p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline font-mono text-sm"
              >
                {transactionHash.slice(0, 20)}...
              </a>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Your vote choice remains encrypted until results are revealed
            </p>
            <a href={`/results/${pollId}`} className="btn-zama-secondary inline-block">
              Check Results
            </a>
          </div>
        </div>
      ) : isVotingActive ? (
        <div className="card-zama">
          <h2 className="text-xl font-bold text-white mb-6">Cast Your Vote</h2>
          
          <div className="space-y-3 mb-6">
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedOption === index
                    ? 'border-yellow-400 bg-yellow-400 bg-opacity-10 text-yellow-400'
                    : 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedOption === index
                      ? 'border-yellow-400 bg-yellow-400'
                      : 'border-gray-500'
                  }`} />
                  {option}
                </div>
              </button>
            ))}
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">🔒 Privacy Guarantee</h3>
            <p className="text-sm text-gray-400">
              Your vote will be encrypted using FHE. No one can see your choice until the poll results are officially revealed.
            </p>
            <p className="text-xs text-blue-400">
              🔐 Fully Homomorphic Encryption powered by Zama FHEVM
            </p>
          </div>

          {/* Vote Button */}
          <button
            onClick={handleVote}
            disabled={selectedOption === null || isVoting}
            className="w-full btn-zama-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVoting ? 'Encrypting &amp; Casting Vote...' : 'Cast Encrypted Vote'}
          </button>
          
          {/* Transaction Status */}
          {transactionHash && (
            <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4 mt-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-300">
                  {isConfirmed ? '✅ Vote Confirmed!' : '🔄 Vote Submitted'}
                </h4>
                <div className="text-sm text-blue-200">
                  <strong>Transaction:</strong>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-yellow-400 hover:underline ml-2"
                  >
                    {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                  </a>
                </div>
                {isConfirmed ? (
                  <div className="text-green-300">Your vote has been recorded!</div>
                ) : (
                  <div className="text-blue-300">⏳ Waiting for confirmation...</div>
                )}
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-red-300 mb-2">❌ Vote Failed</h4>
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}
        </div>
      ) : hasVotingEnded ? (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Voting Has Ended</h2>
          <p className="text-gray-400 mb-6">
            This poll has ended. Results will be available after admin triggers the reveal.
          </p>
          <a href={`/results/${pollId}`} className="btn-zama-secondary">
            Check Results
          </a>
        </div>
      ) : (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Voting Not Started</h2>
          <p className="text-gray-400 mb-6">
            This poll hasn&apos;t started yet. Come back when voting begins.
          </p>
          <Countdown targetTime={poll.startTime} />
        </div>
      )}
    </div>
  );
}
