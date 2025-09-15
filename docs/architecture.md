# Architecture

Overview of PrivateVote FHEVM's technical architecture and how FHE enables confidential voting.

## System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contract │    │   Zama Network  │
│   (Next.js)     │    │   (Sepolia)     │    │     (FHE)       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Vote Encrypt  │───▶│ • Store Polls   │───▶│ • KMS Service   │
│ • UI/UX         │    │ • FHE Operations│    │ • Oracle System │
│ • Wallet Connect│    │ • Access Control│    │ • Decryption    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. Frontend Application
**Technology**: Next.js 15 + React 19 + TypeScript

- **Client-side Encryption**: Uses Zama SDK to encrypt votes before submission
- **Wallet Integration**: RainbowKit + wagmi for Web3 connectivity  
- **Real-time Updates**: Automatic polling for poll status and results
- **Responsive UI**: Tailwind CSS for modern, mobile-first design

### 2. Smart Contract Layer
**Technology**: Solidity + Hardhat + FHEVM

- **Poll Management**: Create, store, and manage voting polls
- **FHE Operations**: Homomorphic addition of encrypted votes
- **Access Control**: Time-based voting windows and permission systems
- **Oracle Integration**: Request decryption from Zama's KMS

### 3. Zama FHEVM Network
**Technology**: Fully Homomorphic Encryption

- **KMS (Key Management Service)**: Manages encryption/decryption keys
- **Oracle System**: Handles decryption requests and callbacks
- **Gateway**: Provides client-side encryption utilities

## Data Flow

### Poll Creation
```
User Input → Frontend → Smart Contract → Blockchain Storage
```

1. User submits poll details via frontend
2. Smart contract validates and stores poll metadata
3. Initial encrypted tallies set to zero (`euint64(0)`)
4. Creation fee (0.001 ETH) collected for anti-spam

### Voting Process
```
Vote Selection → Client Encryption → Smart Contract → FHE Addition
```

1. **Client-side**: Vote encrypted using Zama SDK (`createEncryptedInput`)
2. **Submit**: Encrypted vote submitted to smart contract with proof
3. **Validation**: Contract checks voting eligibility and time window
4. **FHE Addition**: `FHE.add(currentTally, encryptedVote)`
5. **Storage**: Updated encrypted tally stored on-chain

### Result Revelation
```
Trigger Reveal → Oracle Request → KMS Decryption → Public Results
```

1. **Trigger**: Anyone calls `publicReveal()` after voting ends
2. **Oracle Request**: Contract requests decryption via `FHE.requestDecryption()`
3. **KMS Processing**: Zama's KMS service decrypts tallies
4. **Callback**: Decrypted results sent back to contract
5. **Public Storage**: Plain tallies stored and events emitted

## FHE Implementation Details

### Encrypted Types
```solidity
mapping(uint256 => euint64) encTallies;  // Encrypted tallies per option
```

### Homomorphic Operations
```solidity
// Add encrypted vote to existing tally
euint64 newTally = FHE.add(encTallies[optionId], encryptedVote);

// Allow contract to use the encrypted value
FHE.allowThis(newTally);
```

### Access Control Lists (ACL)
```solidity
// Grant contract permission to encrypted data
FHE.allowThis(encryptedZero);

// Only authorized addresses can decrypt
FHE.isAllowed(encTallies[optionId], address(this)); // true
```

## Security Model

### Privacy Guarantees
- **Vote Secrecy**: Individual votes never revealed, even to contract owner
- **Tally Privacy**: Only final results revealed, intermediate tallies encrypted
- **Forward Secrecy**: Past votes remain private even if future keys compromised

### Access Controls
- **Time Windows**: Voting only allowed between `startTime` and `endTime`
- **Single Vote**: `hasVoted[address]` mapping prevents double voting
- **Permissionless Reveal**: Anyone can reveal results (no single point of failure)

### Anti-Abuse Mechanisms  
- **Creation Fee**: 0.001 ETH prevents poll spam
- **Gas Optimization**: Efficient FHE operations minimize costs
- **Event Logging**: All actions logged for transparency and debugging

## Scalability Considerations

### Current Limitations
- **FHE Cost**: Homomorphic operations are computationally expensive
- **Testnet Only**: Currently deployed on Sepolia for testing
- **Option Limit**: Practical limit of ~10 options per poll

### Future Improvements
- **Layer 2**: Deploy on FHE-enabled L2 networks when available
- **Batch Operations**: Optimize multiple vote processing
- **Advanced FHE**: Utilize more complex FHE primitives as they become available

## Monitoring & Analytics

### On-chain Data
- Poll creation rates and patterns
- Voting participation statistics  
- Gas usage and optimization opportunities
- Reveal success rates and timing

### Off-chain Metrics
- Frontend performance and user experience
- Wallet connection success rates
- Error rates and common failure points

---

Next: Learn about the [smart contract implementation →](/smart-contracts)
