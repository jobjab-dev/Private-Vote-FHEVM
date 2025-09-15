'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePoll } from '../../../hooks/usePoll';
import { usePollResults } from '../../../hooks/usePollResults';
import { usePublicReveal } from '../../../hooks/usePublicReveal';
import { contractUtils } from '../../../lib/contract';
import { Countdown } from '../../../components/Countdown';

export default function ResultsPage() {
  const params = useParams();
  const pollId = parseInt(params.pollId as string);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { poll, isLoading: pollLoading, refreshPoll } = usePoll(pollId);
  const { results, isLoading: resultsLoading } = usePollResults(pollId, refreshTrigger);
  const { isRevealing, canReveal, error, transactionHash, isConfirmed, revealPoll, checkCanReveal } = usePublicReveal(pollId);

  // Check reveal status once when poll loads
  useEffect(() => {
    let hasChecked = false;
    
    if (poll && !poll.revealed && !hasChecked) {
      hasChecked = true;
      checkCanReveal();
    }
  }, [poll?.id, poll?.revealed]); // Depend on specific values, not functions

  // Auto reload after reveal confirmation - Oracle callback takes time
  useEffect(() => {
    if (isConfirmed) {
      console.log('🔄 Reveal confirmed - Auto reload in 20 seconds for Oracle callback...');
      
      // Single auto reload after Oracle callback time
      const reloadTimer = setTimeout(() => {
        console.log('🔄 Auto reloading page to get Oracle results...');
        window.location.reload();
      }, 20000); // 20 seconds for Oracle callback

      return () => clearTimeout(reloadTimer);
    }
  }, [isConfirmed]);

  if (pollLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-700 rounded w-64"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
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
        <a href="/" className="btn-zama-primary">Back to Polls</a>
      </div>
    );
  }

  const now = Date.now();
  const votingEnded = now >= poll.endTime;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Poll Header */}
      <div className="card-zama">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{poll.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              poll.status === 'revealed' ? 'status-revealed' :
              poll.status === 'ended' ? 'status-ended' :
              poll.status === 'active' ? 'status-active' : 'status-upcoming'
            }`}>
              {poll.status === 'revealed' ? 'Results Available' : poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
          </div>
          
          <p className="text-gray-400">{poll.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{poll.totalVoters} total voters</span>
            <span>•</span>
            <span>
              {votingEnded ? 'Ended' : 'Ends'} {new Date(poll.endTime).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {poll.revealed || isConfirmed ? (
        <div className="space-y-6">
          {/* Success message after reveal */}
          {isConfirmed && !resultsLoading && (
            <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-green-300 font-semibold">Results Revealed Successfully!</h3>
                  <p className="text-green-200 text-sm">Poll results have been decrypted and are now available.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="card-zama">
            <h2 className="text-xl font-bold text-white mb-6">Final Results</h2>
            
            {resultsLoading ? (
              <div className="space-y-4">
                {poll.options.map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-8 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : results ? (
              <div className="space-y-4">
                {poll.options.map((option, index) => {
                  const votes = results.tallies[index] || 0;
                  const percentage = results.totalVotes > 0 
                    ? Math.round((votes / results.totalVotes) * 100) 
                    : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{option}</span>
                        <span className="text-yellow-400 font-bold">
                          {votes} votes ({percentage}%)
                        </span>
                      </div>
                      
                      <div className="progress-zama">
                        <div 
                          className="progress-zama-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* Winner Section - Always show */}
                <div className="border-t border-gray-800 pt-4">
                  {(() => {
                    // Handle case when no votes
                    if (results.totalVotes === 0) {
                      return (
                        <div className="text-center p-4 bg-gray-800 bg-opacity-50 border border-gray-600 rounded-lg">
                          <h3 className="text-gray-400 font-bold text-lg mb-1">No Votes Cast</h3>
                          <p className="text-gray-500 text-sm">This poll ended without any votes</p>
                        </div>
                      );
                    }
                    
                    // Debug results data
                    console.log('🔍 Winner calculation debug:', {
                      tallies: results.tallies,
                      totalVotes: results.totalVotes,
                      revealed: results.revealed
                    });
                    
                    // Find winner(s)
                    const maxVotes = Math.max(...results.tallies);
                    const winnerIndices = results.tallies.map((votes, index) => 
                      votes === maxVotes ? index : -1
                    ).filter(index => index !== -1);
                    
                    console.log('🏆 Winner analysis:', {
                      maxVotes,
                      winnerIndices,
                      numWinners: winnerIndices.length
                    });
                    
                    if (winnerIndices.length === 1) {
                      const winnerIndex = winnerIndices[0];
                      const percentage = Math.round((maxVotes / results.totalVotes) * 100);
                      
                      return (
                        <div className="text-center p-4 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg">
                          <h3 className="text-yellow-400 font-bold text-lg mb-1">Winning Option</h3>
                          <p className="text-white text-xl font-semibold">{poll.options[winnerIndex]}</p>
                          <p className="text-yellow-300 text-sm">{maxVotes} votes ({percentage}% of total)</p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center p-4 bg-orange-900 bg-opacity-20 border border-orange-600 rounded-lg">
                          <h3 className="text-orange-400 font-bold text-lg mb-1">Tie Result</h3>
                          <p className="text-white">
                            {winnerIndices.map(i => poll.options[i]).join(' & ')}
                          </p>
                          <p className="text-orange-300 text-sm">{maxVotes} votes each</p>
                        </div>
                      );
                    }
                  })()}
                </div>
                
                <div className="pt-4 border-t border-gray-800 text-center">
                  <span className="text-gray-400">
                    Total Votes: <span className="text-white font-semibold">{results.totalVotes}</span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No results available</p>
            )}
          </div>
        </div>
      ) : canReveal === true ? (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Voting Has Ended</h2>
          <p className="text-gray-400 mb-6">
            The voting period has ended. Results are encrypted and can be revealed by anyone.
          </p>
          
          <button
            onClick={revealPoll}
            disabled={isRevealing}
            className="btn-zama-primary"
          >
            {isRevealing ? 'Revealing Results...' : '👁️ Reveal Results'}
          </button>
          
          {/* Transaction Status */}
          {transactionHash && (
            <div className="mt-4 text-sm text-blue-400">
              Transaction: <a 
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-300"
              >
                {transactionHash.slice(0, 10)}...
              </a>
            </div>
          )}
          
          {error && (
            <div className="mt-4 text-sm text-red-400">
              Error: {error}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            🔒 All votes are currently encrypted and private
          </div>
        </div>
      ) : canReveal === null ? (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Checking Status</h2>
          <p className="text-gray-400">
            ⏳ Checking if results can be revealed...
          </p>
        </div>
      ) : votingEnded ? (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Cannot Reveal Yet</h2>
          <p className="text-gray-400">
            Voting has ended, but results cannot be revealed at this time. This may be because reveal is already in progress.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            🔒 All votes remain encrypted until reveal
          </div>
        </div>
      ) : (
        <div className="card-zama text-center">
          <h2 className="text-xl font-bold text-white mb-4">Voting in Progress</h2>
          <p className="text-gray-400 mb-6">
            Voting is currently active. Results will be available after voting ends.
          </p>
          
          <a href={`/vote/${pollId}`} className="btn-zama-primary">
            Cast Your Vote
          </a>
          
          <div className="mt-6">
            <Countdown targetTime={poll.endTime} />
          </div>
        </div>
      )}

      {/* Privacy Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-3">🛡️ Privacy Features</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Individual votes remain encrypted during voting period</li>
          <li>• Vote tallies are computed using homomorphic encryption</li>
          <li>• Only final aggregate results are revealed</li>
          <li>• No one can see who voted for what option</li>
          <li>• Anyone can trigger result revelation after voting ends</li>
        </ul>
      </div>
    </div>
  );
}
