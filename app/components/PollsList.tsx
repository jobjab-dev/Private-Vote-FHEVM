'use client';

import { useState, useEffect } from 'react';
import { usePublicReveal } from '../hooks/usePublicReveal';
import NotificationToast from './NotificationToast';

// Reveal Button Component
function RevealButton({ pollId }: { pollId: number }) {
  const { isRevealing, canReveal, error, transactionHash, isConfirmed, revealPoll, checkCanReveal } = usePublicReveal(pollId);
  
  // Toast notifications state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    transactionHash?: string;
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // Check reveal status on mount
  useEffect(() => {
    checkCanReveal();
  }, [pollId]);

  // Handle transaction status changes
  useEffect(() => {
    if (transactionHash && !isConfirmed) {
      setToast({
        show: true,
        message: `Transaction submitted! Hash: ${transactionHash.slice(0, 10)}...`,
        type: 'info',
        transactionHash: transactionHash
      });
    }
  }, [transactionHash, isConfirmed]);

  useEffect(() => {
    if (isConfirmed) {
      setToast({
        show: true,
        message: 'Poll results revealed successfully! 🎉',
        type: 'success'
      });
      setTimeout(checkCanReveal, 2000);
    }
  }, [isConfirmed, pollId]);

  useEffect(() => {
    if (error) {
      setToast({
        show: true,
        message: `Error: ${error}`,
        type: 'error'
      });
    }
  }, [error]);

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  if (canReveal === null) {
    return (
      <div className="btn-zama-outline opacity-50 cursor-not-allowed animate-pulse">
        ⏳ Checking...
      </div>
    );
  }

  if (!canReveal) {
    return (
      <div className="btn-zama-outline opacity-50 cursor-not-allowed">
        🔒 Cannot Reveal Yet
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={revealPoll}
        disabled={isRevealing}
        className={`btn-zama-primary flex-1 sm:flex-none ${
          isRevealing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isRevealing ? '⏳ Revealing...' : '👁️ Reveal Results'}
      </button>
      
      <NotificationToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
        duration={toast.type === 'error' ? 8000 : 5000}
        transactionHash={toast.transactionHash}
      />
    </>
  );
}

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

interface PollsListProps {
  polls: Poll[];
  isLoading: boolean;
}

export function PollsList({ polls, isLoading }: PollsListProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'activity' | 'pass'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const POLLS_PER_PAGE = 10;

  // Filter polls based on selected filter
  const filteredPolls = polls.filter(poll => {
    switch (filter) {
      case 'upcoming':
        return poll.status === 'upcoming';
      case 'activity':
        return poll.status === 'active';
      case 'pass':
        return poll.status === 'ended' || poll.status === 'revealed';
      case 'all':
      default:
        return true;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredPolls.length / POLLS_PER_PAGE);
  const startIndex = (currentPage - 1) * POLLS_PER_PAGE;
  const endIndex = startIndex + POLLS_PER_PAGE;
  const paginatedPolls = filteredPolls.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const FilterButton = ({ 
    value, 
    label, 
    count 
  }: { 
    value: typeof filter; 
    label: string; 
    count: number; 
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        filter === value
          ? 'bg-yellow-400 text-black'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label} ({count})
    </button>
  );
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-zama animate-pulse">
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-6 bg-gray-700 rounded w-64"></div>
                <div className="h-6 bg-gray-700 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <FilterButton 
          value="all" 
          label="All" 
          count={polls.length} 
        />
        <FilterButton 
          value="upcoming" 
          label="Upcoming" 
          count={polls.filter(p => p.status === 'upcoming').length} 
        />
        <FilterButton 
          value="activity" 
          label="Active" 
          count={polls.filter(p => p.status === 'active').length} 
        />
        <FilterButton 
          value="pass" 
          label="Past" 
          count={polls.filter(p => p.status === 'ended' || p.status === 'revealed').length} 
        />
      </div>

      {/* Polls Display */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-16 lg:py-24">
          <div className="w-20 h-20 lg:w-32 lg:h-32 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="text-4xl lg:text-6xl">🗳️</div>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-gradient-zama mb-4">
            {filter === 'all' ? 'No Polls Yet' : 
             filter === 'upcoming' ? 'No Upcoming Polls' :
             filter === 'activity' ? 'No Active Polls' : 
             'No Past Polls'}
          </h3>
          <p className="text-gray-400 text-lg lg:text-xl mb-8 max-w-md mx-auto">
            {filter === 'all' ? 'No polls have been created yet. Be the first to create one!' :
             filter === 'upcoming' ? 'No polls are scheduled to start yet.' :
             filter === 'activity' ? 'No polls are currently active for voting.' :
             'No completed polls to display yet.'}
          </p>
          {filter === 'all' && (
            <a href="/create-poll" className="btn-zama-primary text-lg px-8 py-4">
              Create First Poll
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedPolls.map((poll) => (
            <div key={poll.id} className="card-zama">
              <div className="space-y-6">
            {/* Poll Header - Clean Layout */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1 space-y-3">
                {/* Title and Status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h3 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                    {poll.title}
                  </h3>
                  <span className={`self-start px-4 py-2 rounded-full text-sm font-semibold ${
                    poll.status === 'active' ? 'status-active' :
                    poll.status === 'upcoming' ? 'status-upcoming' :
                    poll.status === 'ended' ? 'status-ended' : 'status-revealed'
                  }`}>
                    {poll.status === 'revealed' ? 'Results Available' : 
                     poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                  {poll.description}
                </p>
              </div>
            </div>

            {/* Options Grid - Clean Layout */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Voting Options ({poll.options.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {poll.options.map((option, index) => (
                  <span 
                    key={index} 
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-700"
                  >
                    {index + 1}. {option}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Section - Organized */}
            <div className="border-t border-gray-800 pt-4 space-y-4">
              {/* Poll Meta Info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-lg font-bold text-yellow-400">{poll.totalVoters}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Voters</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">{poll.options.length}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Options</div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <div className="text-sm font-medium text-white">{poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Creator</div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  {poll.creationTxHash ? (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${poll.creationTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      {poll.creationTxHash.slice(0, 6)}...{poll.creationTxHash.slice(-4)}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <div className="text-sm text-gray-500">Loading TX...</div>
                  )}
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Creation Tx</div>
                </div>
              </div>
              
              {/* Actions Section */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {poll.status === 'active' && (
                  <a href={`/vote/${poll.id}`} className="btn-zama-primary flex-1 sm:flex-none">
                    🗳️ Vote Now
                  </a>
                )}
                {poll.status === 'ended' && !poll.revealed && (
                  <>
                    <a href={`/results/${poll.id}`} className="btn-zama-outline flex-1 sm:flex-none">
                      📊 Check Status
                    </a>
                    <RevealButton pollId={poll.id} />
                  </>
                )}
                {poll.status === 'revealed' && (
                  <a href={`/results/${poll.id}`} className="btn-zama-secondary flex-1 sm:flex-none">
                    📈 View Results
                  </a>
                )}
                {poll.status === 'upcoming' && (
                  <div className="bg-gray-700 text-gray-300 py-3 px-6 rounded-lg text-center font-medium">
                    ⏰ Voting Starts Soon
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Poll Info */}
            {poll.status === 'upcoming' && (
              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-300 font-semibold">⏰ Upcoming Poll</span>
                  <span className="text-blue-200 text-sm">
                    {(() => {
                      const timeLeft = poll.startTime - Date.now();
                      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                      
                      if (hours > 0) {
                        return `Starts in: ${hours}h ${minutes}m`;
                      } else if (minutes > 0) {
                        return `Starts in: ${minutes}m`;
                      } else {
                        return 'Starting soon...';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Starts: {new Date(poll.startTime).toLocaleString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                  <span>Ends: {new Date(poll.endTime).toLocaleString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              </div>
            )}

            {/* Active Poll Progress */}
            {poll.status === 'active' && (
              <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-300 font-semibold">🟢 Voting Active</span>
                  <span className="text-green-200 text-sm">
                    Time Progress: {Math.max(0, Math.min(100, 
                      ((Date.now() - poll.startTime) / (poll.endTime - poll.startTime)) * 100
                    )).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-zama">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-yellow-400 h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, 
                        ((Date.now() - poll.startTime) / (poll.endTime - poll.startTime)) * 100
                      ))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Started: {new Date(poll.startTime).toLocaleString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                  <span>Ends: {new Date(poll.endTime).toLocaleString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              </div>
            )}
              </div>
            </div>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? 'bg-yellow-400 text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Next
              </button>
            </div>
          )}
          
          {/* Pagination Info */}
          {filteredPolls.length > 0 && (
            <div className="text-center text-sm text-gray-400 pt-4">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredPolls.length)} of {filteredPolls.length} polls
            </div>
          )}
        </div>
      )}
    </div>
  );
}
