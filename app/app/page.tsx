'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PollsList } from '../components/PollsList';
import { usePolls } from '../hooks/usePolls';

export default function PollsListPage() {
  const { isConnected } = useAccount();
  const { polls, isLoading } = usePolls();

  return (
    <div className="space-y-6 md:space-y-8 lg:space-y-12">
      {/* Clean Hero Section */}
      <div className="text-center py-12 lg:py-20">
        <div className="space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold">
            <span className="text-gradient-zama">Private Voting</span>
          </h1>
          <div className="space-y-2">
            <h2 className="text-xl lg:text-2xl text-gray-300">
              Powered by{' '}
              <a 
                href="https://www.zama.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 transition-colors underline decoration-dotted"
              >
                Zama FHEVM
              </a>
            </h2>
            <div className="text-sm text-gray-500">
              Contract:{' '}
              <a 
                href="https://sepolia.etherscan.io/address/0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a#code" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-yellow-400 hover:text-yellow-300 transition-colors underline decoration-dotted"
              >
                0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a
              </a>
            </div>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Vote confidentially using Fully Homomorphic Encryption.
            Individual votes remain private while results are publicly verifiable.
          </p>
        </div>
      </div>

      {/* Clean Main Content */}
      {!isConnected ? (
        <div className="flex justify-center py-16">
          <div className="card-zama-highlight max-w-lg text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              <div className="text-2xl">🔗</div>
            </div>
            <h3 className="text-2xl font-bold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 leading-relaxed">
              Connect your wallet to participate in confidential voting.
            </p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="text-sm text-gray-300">
                🌐 <strong>Network:</strong> Sepolia Testnet
              </div>
              <div className="text-sm text-gray-300">
                💰 <strong>Fee:</strong> 0.001 ETH per poll
              </div>
              <div className="text-sm text-gray-300">
                🔒 <strong>Privacy:</strong> Votes encrypted until reveal
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Polls Section Header */}
          <div className="border-b border-gray-800 pb-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  All Polls
                </h2>
                <p className="text-gray-400 text-lg">
                  Participate in confidential voting with FHEVM encryption
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📊 Total: {polls.length} polls</span>
                  <span>•</span>
                  <span>🔗 Live on Sepolia</span>
                </div>
              </div>
              
              {/* Create Poll Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="/create-poll" 
                  className="btn-zama-primary flex items-center justify-center gap-3 px-8 py-4 text-lg"
                >
                  <span>💰</span>
                  <span>Create Poll</span>
                </a>
              </div>
            </div>
          </div>

          {/* Polls List */}
          <PollsList polls={polls} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
