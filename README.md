# PrivateVote-FHEVM 🗳️

**Confidential Voting dApp** using Zama's Fully Homomorphic Encryption

Vote privately. Results stay encrypted until revealed. Powered by FHEVM.

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/jobjab-dev/Private-Vote-FHEVM.git
cd Private-Vote-FHEVM

# Install dependencies
npm install

# Deploy contracts (optional - using existing)
cd contracts && npm run deploy:sepolia

# Start frontend
cd ../app && npm run dev
```

Visit `http://localhost:3000` 

---

## 📦 Project Structure

```
├── app/          # Next.js Frontend (README.md)
├── contracts/    # Solidity Smart Contracts (README.md)
├── docs/         # VitePress Documentation (Getting Started, Architecture, Security)
├── package.json  # Monorepo scripts
└── README.md     # This file
```

---

## ⚡ Live Demo

- **Demo**: `https://private-vote-fhevm-app.vercel.app/` 
- **Contract**: [`0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a`](https://sepolia.etherscan.io/address/0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a#code) (Sepolia)
- **Documentation**: [Read the Docs →](docs/)

---

## 🔐 How It Works

1. **Create Poll** - Anyone pays 0.001 ETH fee
2. **Vote** - FHE encrypts votes, no one sees choices
3. **Reveal** - Anyone can reveal results after voting ends  

**Privacy**: Votes encrypted until reveal. Only final totals shown.

---

## ⚠️ Important

- **Testnet Only** - Sepolia demo, not production ready
- **Unaudited** - Experimental FHEVM implementation  
- **License** - BSD-3-Clause-Clear, see Zama's patent policy

---

## 🔗 Links

- **DApp**: [PrivateVote-DAap](https://private-vote-fhevm-app.vercel.app/)
- **GitHub**: [jobjab-dev/Private-Vote-FHEVM](https://github.com/jobjab-dev/Private-Vote-FHEVM)
- **X/Twitter**: [@jobjab_eth](https://x.com/jobjab_eth)
- **Zama**: [FHEVM Documentation](https://docs.zama.ai/protocol)

---

**Built with Zama FHEVM** 🛡️
