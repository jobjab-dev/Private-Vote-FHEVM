# Deployment

Complete guide to deploying PrivateVote FHEVM on your own infrastructure.

## Prerequisites

### Development Environment
- **Node.js 18+** with npm/yarn
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Blockchain Setup
- **Ethereum Wallet** with private key
- **Sepolia ETH** for gas fees ([Get testnet ETH](https://sepoliafaucet.com/))
- **Etherscan API Key** for contract verification ([Get free key](https://etherscan.io/apis))

### Hosting (Optional)
- **Vercel/Netlify** for frontend hosting
- **Domain Name** for custom URL

## Smart Contract Deployment

### 1. Environment Setup

Create `contracts/.env`:
```bash
# Required: Deployer wallet
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
OWNER_ADDRESS="0xYOUR_ADDRESS"

# Required: Network connection  
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
# OR use Infura/Alchemy
INFURA_API_KEY="your_infura_key"

# Required: Contract verification
ETHERSCAN_API_KEY="your_etherscan_key"

# Optional: Gas settings
USE_FIXED_GAS="false"
```

### 2. Deploy Contract

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to Sepolia (with auto-verification)
npm run deploy:sepolia
```

**Expected Output**:
```
✅ PrivateVote deployed to: 0xYOUR_CONTRACT_ADDRESS
✅ Contract verified on Etherscan!
📄 Deployment info saved to: deployments/latest.json
```

### 3. Export ABI

```bash
# Export contract ABI to frontend
npm run export-abi
```

This copies the ABI to `../app/lib/PrivateVote.json`

## Frontend Deployment

### 1. Configure Environment

Create `app/.env.local`:
```bash
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS="0xYOUR_DEPLOYED_ADDRESS"
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Zama FHEVM Configuration
NEXT_PUBLIC_GATEWAY_URL="https://gateway.sepolia.zama.ai"
NEXT_PUBLIC_KMS_URL="https://kms.sepolia.zama.ai"

# Optional: WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="your_project_id"
```

### 2. Local Development

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit **http://localhost:3000** to test locally

### 3. Production Build

```bash
# Build for production
npm run build

# Start production server (optional)
npm run start
```

## Hosting Options

### Vercel (Recommended)

1. **Connect Repository**:
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Deploy PrivateVote"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables from `app/.env.local`
   - Deploy automatically

3. **Custom Domain** (Optional):
   - Add domain in Vercel dashboard
   - Configure DNS records
   - SSL automatically provisioned

### Netlify Alternative

1. **Build Settings**:
   ```
   Build Command: cd app && npm run build
   Publish Directory: app/out
   ```

2. **Environment Variables**:
   - Add all variables from `app/.env.local`
   - Ensure `NEXT_PUBLIC_` prefix on client variables

### Self-hosted

```bash
# Using PM2 for production
npm install -g pm2

cd app
npm run build
pm2 start npm --name "privatevote" -- start
pm2 startup
pm2 save
```

## Custom Network Deployment

### Mainnet (Production)
⚠️ **Not recommended until FHEVM mainnet launch**

```bash
# Add mainnet config to hardhat.config.ts
mainnet: {
  url: process.env.MAINNET_RPC_URL,
  accounts: [process.env.PRIVATE_KEY],
  chainId: 1
}

# Deploy (when available)
npm run deploy:mainnet
```

### Local Development

```bash
# Start local FHEVM node (when available)
npx hardhat node --fhe

# Deploy locally
npm run deploy:localhost
```

## Verification & Testing

### Contract Verification
```bash
# Manual verification if auto-verify fails
npx hardhat verify --network sepolia CONTRACT_ADDRESS "OWNER_ADDRESS"
```

### Frontend Testing
1. **Connect Wallet**: MetaMask on Sepolia
2. **Create Poll**: Test poll creation flow
3. **Vote**: Cast encrypted votes
4. **Reveal**: Trigger result revelation

### Health Checks
- **Contract**: Verify on Etherscan
- **Frontend**: Check all pages load
- **Integration**: Test full voting flow

## Monitoring & Maintenance

### Contract Monitoring
```solidity
// Events to monitor
event PollCreated(uint256 indexed pollId, ...);
event Voted(uint256 indexed pollId, address indexed voter, ...);
event Revealed(uint256 indexed pollId, uint256[] plainTallies, ...);
```

### Analytics Setup
```javascript
// Add to app/lib/analytics.js
import { Analytics } from '@vercel/analytics/react'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### Error Tracking
```bash
# Install Sentry (optional)
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentry } = require('@sentry/nextjs')
module.exports = withSentry({ /* config */ })
```

## Cost Estimation

### Deployment Costs (Sepolia)
- **Contract Deployment**: ~0.01 ETH
- **Contract Verification**: Free
- **Frontend Hosting**: Free (Vercel/Netlify)

### Operational Costs
- **Poll Creation**: 0.001 ETH fee + gas
- **Voting**: ~0.001 ETH gas per vote
- **Result Reveal**: ~0.005 ETH gas

### Scaling Considerations
- **High Usage**: Consider gas optimization
- **Large Polls**: Monitor FHE operation costs
- **Global Access**: Use CDN for better performance

## Troubleshooting

### Common Issues

**❌ Contract Deployment Fails**
- Check PRIVATE_KEY format (with 0x prefix)
- Ensure sufficient ETH balance
- Verify RPC URL is accessible

**❌ Frontend Build Errors**
- Clear node_modules and reinstall
- Check environment variable format
- Ensure all dependencies installed

**❌ Wallet Connection Issues**
- Verify CHAIN_ID matches network
- Check MetaMask network settings
- Clear browser cache/cookies

**❌ FHE Operations Fail**
- Ensure using supported browser
- Check Zama gateway URLs
- Verify network connectivity

### Getting Help

- **GitHub Issues**: Technical problems and bugs
- **Discord**: Community support and discussions
- **Documentation**: Check other guide sections
- **Zama Docs**: Official FHEVM documentation

## Next Steps

After successful deployment:

1. **Test Thoroughly**: Run comprehensive voting tests
2. **Gather Feedback**: Share with trusted users
3. **Monitor Usage**: Track performance and errors
4. **Security Review**: Consider professional audit
5. **Community Building**: Engage with users and developers

---

**Congratulations!** 🎉 You now have a fully deployed confidential voting dApp using Zama FHEVM.
