# Smart Contracts

Deep dive into the PrivateVote smart contract implementation using Zama FHEVM.

## Contract Overview

**Contract**: `PrivateVote.sol`  
**Address**: [`0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a`](https://sepolia.etherscan.io/address/0x2BcE7330F68d3f36749fb248D3C76Bd82A6FA71a#code)  
**Network**: Sepolia Testnet

## Core Data Structures

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
    
    // FHE-encrypted tallies (private)
    mapping(uint256 => euint64) encTallies;
    
    // Plain tallies (revealed after voting)
    mapping(uint256 => uint256) plainTallies;
    
    // Voting tracking
    mapping(address => bool) hasVoted;
    uint256 totalVoters;
}
```

### State Variables
```solidity
address public owner;           // Contract owner
uint256 public pollCount;       // Total polls created
uint256 public creationFee;     // 0.001 ETH anti-spam fee

mapping(uint256 => Poll) public polls;
```

## Key Functions

### Poll Management

#### Create Poll
```solidity
function createPoll(
    string memory title,
    string memory description,
    string[] memory options,
    uint256 startTime,
    uint256 endTime
) external payable returns (uint256 pollId)
```

**Requirements**:
- Pay creation fee (0.001 ETH)
- 2-10 options
- `startTime < endTime`
- `endTime` in the future

**Process**:
1. Validate inputs and fee payment
2. Store poll metadata
3. Initialize encrypted tallies to zero
4. Emit `PollCreated` event

#### Set Creation Fee (Owner Only)
```solidity
function setCreationFee(uint256 newFee) external onlyOwner
```

### Voting System

#### Cast Vote
```solidity
function vote(
    uint256 pollId,
    uint256 optionId,
    externalEuint64 encryptedOne,
    bytes calldata inputProof
) external
```

**Requirements**:
- Voting window is active (`startTime <= block.timestamp <= endTime`)
- User hasn't voted on this poll
- Valid option ID

**Process**:
1. Import encrypted vote: `FHE.fromExternal(encryptedOne, inputProof)`
2. Add to current tally: `FHE.add(currentTally, encryptedVote)`
3. Grant ACL permission: `FHE.allowThis(newTally)`
4. Update voting status and emit `Voted` event

### Result Revelation

#### Request Reveal
```solidity
function publicReveal(uint256 pollId) external
```

**Requirements**:
- Voting has ended (`block.timestamp > endTime`)
- Results not already revealed

**Process**:
1. Collect all encrypted tallies
2. Request decryption from Oracle: `FHE.requestDecryption(ctsToDecrypt, this.revealCallback.selector)`
3. Emit `RevealRequested` event

#### Oracle Callback
```solidity
function revealCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external
```

**Process**:
1. Verify KMS signatures: `FHE.checkSignatures(requestId, cleartexts, decryptionProof)`
2. Decode decrypted tallies
3. Store plain results in `plainTallies` mapping
4. Mark poll as revealed and emit `Revealed` event

## FHE Integration

### Encrypted Operations
```solidity
import "fhevm/abstracts/EIP712WithModifier.sol";
import {FHE} from "fhevm/FHE.sol";

// Zero initialization
euint64 encryptedZero = FHE.asEuint64(0);
FHE.allowThis(encryptedZero);

// Homomorphic addition
euint64 newTally = FHE.add(encTallies[optionId], encryptedVote);
FHE.allowThis(newTally);
```

### Access Control Lists
```solidity
// Grant contract permission to use encrypted values
FHE.allowThis(encryptedValue);

// Check if address can access encrypted data
bool canAccess = FHE.isAllowed(encryptedValue, address(this));
```

### Decryption Request
```solidity
euint64[] memory ctsToDecrypt = new euint64[](poll.options.length);
for (uint256 i = 0; i < poll.options.length; i++) {
    ctsToDecrypt[i] = poll.encTallies[i];
}

FHE.requestDecryption(ctsToDecrypt, this.revealCallback.selector);
```

## Events

### Poll Lifecycle
```solidity
event PollCreated(
    uint256 indexed pollId,
    address indexed creator,
    string title,
    uint256 startTime,
    uint256 endTime,
    uint256 optionsCount
);

event Voted(
    uint256 indexed pollId,
    address indexed voter,
    uint256 indexed optionId
);

event RevealRequested(
    uint256 indexed pollId,
    uint256 indexed requestId
);

event Revealed(
    uint256 indexed pollId,
    uint256[] plainTallies,
    uint256 totalVotes
);
```

### Administrative
```solidity
event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
event FundsWithdrawn(address indexed to, uint256 amount);
```

## View Functions

### Poll Information
```solidity
function getPollInfo(uint256 pollId) external view returns (...)
function getPollStatus(uint256 pollId) external view returns (PollStatus)
function getPollResults(uint256 pollId) external view returns (uint256[] memory)
```

### User Interaction
```solidity
function hasUserVoted(uint256 pollId, address user) external view returns (bool)
function canRevealPoll(uint256 pollId) external view returns (bool)
```

### Contract State
```solidity
function getCreationFee() external view returns (uint256)
function isDecryptionInProgress(uint256 pollId) external view returns (bool)
```

## Modifiers

### Access Control
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}
```

### Validation
```solidity
modifier validPoll(uint256 pollId) {
    require(pollId > 0 && pollId <= pollCount, "Invalid poll ID");
    _;
}

modifier votingActive(uint256 pollId) {
    Poll storage poll = polls[pollId];
    require(block.timestamp >= poll.startTime, "Voting not started");
    require(block.timestamp <= poll.endTime, "Voting ended");
    _;
}

modifier votingEnded(uint256 pollId) {
    require(block.timestamp > polls[pollId].endTime, "Voting still active");
    _;
}
```

## Gas Optimization

### Efficient Storage
- Pack related data in structs
- Use events for off-chain indexing
- Minimize storage writes

### FHE Operations
- Batch decryption requests
- Reuse encrypted zero values
- Optimize ACL grants

### Example Costs (Sepolia)
- **Poll Creation**: ~200K gas + 0.001 ETH fee
- **Voting**: ~150K gas  
- **Reveal Request**: ~100K gas per option

---

Next: Learn about [security considerations →](/security)
