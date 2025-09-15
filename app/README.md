# PrivateVote Frontend 📱

**Next.js Web App** for confidential voting with Zama FHEVM

---

## 🚀 Quick Start

```bash
npm install
npm run dev     # Start at localhost:3000
```

---

## ✨ Features

### 🗳️ Current Working Features
- **Poll Creation** - Create polls with 0.001 ETH fee
- **Encrypted Voting** - FHE-encrypted votes via Zama SDK
- **Public Reveal** - Anyone can reveal results after end time
- **Responsive Design** - Mobile, tablet, desktop optimized
- **Real-time Status** - Live countdown, progress tracking
- **Transaction Tracking** - Links to Sepolia explorer

### 🎨 UI Components
- **Polls List** - Filters: All, Upcoming, Active, Past (10/page)
- **Create Poll** - Form with start/end times, options
- **Vote Page** - Option selection with FHE encryption
- **Results Page** - Charts and tallies after reveal
- **Toast Notifications** - Bottom-left with explorer links

---

## 🔧 Configuration

### Environment Variables (`app/.env`)
```bash
NEXT_PUBLIC_CHAIN_ID="11155111"                                      # Sepolia
NEXT_PUBLIC_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"   # PublicNode RPC
NEXT_PUBLIC_CONTRACT_ADDRESS="0xB96556247aC1db6A1D81bA617681C86fFa7C3B58"
NEXT_PUBLIC_GATEWAY_URL="https://gateway.sepolia.zama.ai"
NEXT_PUBLIC_KMS_URL="https://kms.sepolia.zama.ai"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="demo"
```

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15 + React 19 + TypeScript 5.6
- **Web3**: wagmi 2.12 + viem 2.21 + RainbowKit 2.1
- **Styling**: Tailwind CSS (Zama yellow-black theme)
- **FHE**: Zama Relayer SDK 0.2.0 (CDN + npm fallback)
- **Icons**: Lucide React

---

## 📱 Pages & Components

### Pages
- **`/`** - Polls list with filters and pagination
- **`/create-poll`** - Poll creation form
- **`/vote/[pollId]`** - Voting interface with FHE encryption
- **`/results/[pollId]`** - Results display with charts

### Key Components
- **`PollsList`** - Main polls display with filters
- **`RevealButton`** - Public reveal functionality
- **`NotificationToast`** - Transaction status notifications
- **`Providers`** - Web3 and React Query setup

### Hooks
- **`useCreatePoll`** - Poll creation with contract interaction
- **`useVote`** - FHE voting with transaction handling
- **`usePublicReveal`** - Public reveal functionality
- **`usePolls`** - Poll data fetching from contract

---

## 🔐 FHEVM Integration

### Client-Side Encryption
```typescript
// lib/fhevm.ts - Real FHEVM SDK integration
const instance = await getFHEVMInstance();
const buffer = instance.createEncryptedInput(contractAddress, userAddress);
buffer.add64(1n); // Vote value
const ciphertexts = await buffer.encrypt();
```

### Vote Flow
1. **Load FHEVM SDK** (CDN → npm fallback)
2. **Initialize WASM** (`initSDK()`)
3. **Create Instance** (Sepolia config)
4. **Encrypt Vote** (client-side)
5. **Submit Transaction** (to PrivateVote contract)

---

## 🎯 Current Status

### ✅ Working
- Poll creation with real contract
- FHE voting with encryption
- Public reveal mechanism  
- Responsive UI design
- Transaction confirmations

### 🔄 In Progress
- Better error handling
- Performance optimizations
- Additional UI polish

---

**Tech Details**: See `lib/fhevm.ts` for FHEVM implementation and `hooks/` for contract interactions.
