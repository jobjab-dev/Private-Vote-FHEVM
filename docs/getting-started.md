# Getting Started

Get PrivateVote FHEVM running locally in 5 minutes.

## Prerequisites

- **Node.js 18+**
- **npm/yarn** 
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** for testing ([Get testnet ETH](https://sepoliafaucet.com/))

## Quick Setup

### 1. Clone Repository

```bash
git clone https://github.com/jobjab-dev/Private-Vote-FHEVM.git
cd Private-Vote-FHEVM
```

### 2. Install Dependencies

```bash
# Install all packages (monorepo)
npm install

# Or install separately
cd app && npm install
cd ../contracts && npm install
```

### 3. Environment Configuration

#### Frontend (app/.env)
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS="0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a"
NEXT_PUBLIC_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
NEXT_PUBLIC_CHAIN_ID="11155111"
```

#### Backend (contracts/.env)  
```bash
PRIVATE_KEY="your-private-key"
OWNER_ADDRESS="your-address"
ETHERSCAN_API_KEY="your-etherscan-key"
```

### 4. Start Frontend

```bash
cd app
npm run dev
```

Visit **http://localhost:3000**

## Using the dApp

### Connect Wallet
1. Click "Connect Wallet" in the header
2. Select MetaMask and connect
3. Switch to Sepolia network if prompted

### Create a Poll
1. Click "Create Poll" button
2. Fill in poll details:
   - Title and description
   - 2-4 voting options
   - Start and end times
3. Pay 0.001 ETH creation fee
4. Wait for transaction confirmation

### Vote on Polls
1. Browse active polls on homepage
2. Click on a poll to view details
3. Select your choice and click "Vote"
4. Confirm transaction in wallet
5. Vote is encrypted automatically

### View Results
1. Results are available after voting period ends
2. Anyone can trigger the reveal process
3. Final tallies are displayed publicly
4. Individual votes remain private forever

## Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://ethereum-sepolia-rpc.publicnode.com
- **Block Explorer**: https://sepolia.etherscan.io
- **Contract**: `0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a`

### Get Testnet ETH
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

## Development Commands

### Frontend
```bash
cd app
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linting
```

### Smart Contracts
```bash
cd contracts
npm run compile        # Compile contracts
npm run test          # Run tests
npm run deploy:sepolia # Deploy to Sepolia
```

## Troubleshooting

### Common Issues

**MetaMask Connection Issues**
- Clear browser cache and cookies
- Reset MetaMask account in Advanced settings
- Ensure you're on Sepolia network

**Transaction Failures**
- Check you have enough Sepolia ETH
- Increase gas limit if needed
- Wait for network congestion to clear

**FHEVM Encryption Errors**
- Ensure you're using a supported browser
- Check browser console for errors
- Try refreshing the page

### Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/jobjab-dev/Private-Vote-FHEVM/issues)
- **X/Twitter**: [@jobjab_eth](https://x.com/jobjab_eth) for updates and support
- **Documentation**: Check our technical guides

Ready to dive deeper? Learn about the [architecture →](/architecture)
