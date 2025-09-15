---
layout: home

hero:
  name: "PrivateVote FHEVM"
  text: "Confidential Voting on Ethereum"
  tagline: Built with Zama's Fully Homomorphic Encryption
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/jobjab-dev/Private-Vote-FHEVM

features:
  - icon: 🔐
    title: Fully Confidential
    details: Votes are encrypted using Zama FHEVM. No one can see individual votes, even the poll creator.

  - icon: ⚡
    title: Real-time Tallies
    details: Vote counts are calculated homomorphically in real-time while keeping all votes encrypted.

  - icon: 🌐
    title: Permissionless
    details: Anyone can create polls and vote. Results are revealed publicly after voting ends.

  - icon: 🛡️
    title: Secure by Design
    details: Built on Ethereum with Zama's battle-tested FHE technology and comprehensive security features.
---

## What is PrivateVote FHEVM?

PrivateVote FHEVM is a **confidential voting dApp** that preserves voter privacy using **Fully Homomorphic Encryption (FHE)**. Unlike traditional voting systems, votes remain encrypted throughout the entire process—even while being counted.

### Key Features

- **🔒 Complete Privacy**: Individual votes are never revealed, only final tallies
- **🚀 Permissionless**: Anyone can create polls with a small anti-spam fee (0.001 ETH)  
- **⏰ Time-bound Voting**: Polls have clear start and end times
- **🔍 Public Verification**: Results are revealed transparently after voting ends
- **🛡️ Anti-Double Voting**: One vote per address per poll

### How It Works

1. **Poll Creation**: Users create polls with encrypted tallies starting at zero
2. **Encrypted Voting**: Votes are encrypted client-side using Zama's SDK before submission
3. **Homomorphic Counting**: Smart contract adds encrypted votes without decryption
4. **Public Reveal**: Anyone can trigger result decryption after voting period ends
5. **Transparent Results**: Final tallies are published on-chain for verification

### Built With

- **[Zama FHEVM](https://zama.ai)**: Fully Homomorphic Encryption on Ethereum
- **Solidity**: Smart contract development
- **Next.js**: Modern React frontend
- **TypeScript**: Type-safe development
- **Sepolia Testnet**: Currently deployed for testing

### Live Demo

Try the dApp: **[privatevote-demo.vercel.app](#)**

Contract on Sepolia: [`0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a`](https://sepolia.etherscan.io/address/0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a#code)

---

**Ready to get started?** [Follow our quick setup guide →](/getting-started)
