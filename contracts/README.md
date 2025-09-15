# PrivateVote Smart Contracts 📜

**Solidity contracts** for confidential voting using Zama FHEVM

---

## 🚀 Quick Start

```bash
npm install
npm run compile
npm run test
npm run deploy:sepolia
```

**Live Contract (Sepolia)**: [`0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a`](https://sepolia.etherscan.io/address/0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a#code)

## ⚡ Quick Commands

```bash
# Development
npm run compile         # Compile contracts
npm run test           # Run tests
npm run clean          # Clean artifacts

# Deployment
npm run deploy:sepolia # Deploy to Sepolia (auto-verify)
npm run export-abi     # Export ABI to ../app/lib/

# Utilities  
npm run typechain      # Generate TypeScript bindings
```

---

## 📋 Contract Overview

### `PrivateVote.sol`
Main voting contract with FHE-encrypted tallies

**Key Features**:
- ✅ **Permissionless Creation** - Anyone can create polls (0.001 ETH fee)
- ✅ **Encrypted Voting** - Uses `euint64` for secret tallies  
- ✅ **Public Reveal** - Anyone can reveal results after voting ends
- ✅ **Access Control** - Owner can manage fees, creators control their polls
- ✅ **Anti-Double Voting** - One vote per address per poll

---

## 🔧 Core Functions

### Poll Management
```solidity
function createPoll(
    string memory title,
    string memory description,
    string[] memory options,
    uint256 startTime,
    uint256 endTime
) external payable returns (uint256 pollId)
```

### Voting  
```solidity
function vote(
    uint256 pollId,
    uint256 optionId,
    externalEuint64 encryptedOne,  // FHE-encrypted vote
    bytes calldata inputProof     // ZK proof
) external
```

### Reveal System
```solidity
// Anyone can request reveal after voting ends
function requestReveal(uint256 pollId) external votingEnded

// Anyone can reveal public polls after voting ends  
function publicReveal(uint256 pollId) external votingEnded
```

---

## 🔐 FHEVM Implementation

### Encrypted Tallies
```solidity
mapping(uint256 => euint64) encTallies;  // option => encrypted count

// Homomorphic addition during voting
euint64 newTally = FHE.add(currentTally, encVote);
```

### Access Control
```solidity
// Grant contract permission to use encrypted values
FHE.allowThis(encryptedZero);

// Enable public decryption for reveal
FHE.requestDecryption(ctsToDecrypt, this.revealCallback.selector);
```

### Oracle Callback
```solidity
function revealCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    // Verify KMS signatures
    FHE.checkSignatures(requestId, cleartexts, decryptionProof);
    // Store plaintext results
    poll.plainTallies[i] = uint256(tally);
}
```

---

## 🧪 Testing

### Unit Tests (`test/PrivateVote.test.ts`)
- ✅ Deployment and initialization
- ✅ Poll creation with fees
- ✅ Owner fee management  
- ✅ Public reveal functionality
- ✅ Access control modifiers

### Run Tests
```bash
npm run test           # Unit tests
npm run test:coverage  # Coverage report  
```

### FHEVM Note
Full FHE voting tests require FHEVM testnet environment. Unit tests focus on logic and access control.

---

## 🚀 Deployment

### Sepolia Testnet
```bash
npm run deploy:sepolia    # Deploy with gas estimation + auto-verify
npm run export-abi        # Export ABI to frontend
```

### Local Development  
```bash
npm run compile          # Compile contracts
npm run clean           # Clean artifacts
```

### Environment (`.env`)
```bash
PRIVATE_KEY="0x..."                    # Deployer private key
OWNER_ADDRESS="0x..."                  # Contract owner
SEPOLIA_RPC_URL="https://..."          # RPC endpoint (or use INFURA_API_KEY)
ETHERSCAN_API_KEY="your_key"           # For verification
USE_FIXED_GAS="false"                  # Gas estimation strategy
```

---

## 📁 Project Structure

```
contracts/
├── contracts/
│   └── PrivateVote.sol          # Main voting contract
├── script/
│   └── 01-deploy-privatevote.ts # Deploy script with auto-verification
├── utils/
│   └── gas-utils.ts             # Gas estimation utilities
├── test/
│   └── PrivateVote.test.ts      # Unit tests
├── deployments/
│   └── latest.json              # Latest deployment info
└── package.json
```

**Deployment Process**: 
1. Gas analysis (Sepolia only)
2. Contract deployment with constructor args
3. Automatic Etherscan verification  
4. Save deployment info to `deployments/latest.json`

---

## 🔍 Contract Details

### State Variables
```solidity
address public owner;                    // Contract owner
uint256 public pollCount;               // Total polls created
uint256 public creationFee;             // Fee to create poll (0.001 ETH)
mapping(uint256 => Poll) public polls;  // Poll storage
```

### Poll Structure
```solidity
struct Poll {
    string title;
    string description;
    string[] options;
    uint256 startTime;
    uint256 endTime;
    bool revealed;
    address creator;
    mapping(uint256 => euint64) encTallies;     // Encrypted tallies
    mapping(uint256 => uint256) plainTallies;   // Revealed tallies
    mapping(address => bool) hasVoted;          // Voting status
    uint256 totalVoters;                        // Public vote count
}
```

### Events
```solidity
event PollCreated(uint256 indexed pollId, address indexed creator, ...)
event Voted(uint256 indexed pollId, address indexed voter, uint256 indexed optionId)
event RevealRequested(uint256 indexed pollId, uint256 indexed requestId)
event Revealed(uint256 indexed pollId, uint256[] plainTallies, uint256 totalVotes)
```

---

## 🛡️ Security Features

- **Time Windows** - Voting restricted to startTime ↔ endTime
- **Anti-Double Vote** - `hasVoted[address]` mapping  
- **ACL Protection** - Encrypted tallies only accessible by contract
- **Signature Verification** - KMS proof validation on reveal
- **Permissionless Reveal** - Anyone can reveal results after voting ends
- **Anti-Spam** - Creation fee (0.001 ETH) prevents poll spam

---

**Integration**: See `../app/` for frontend usage examples
