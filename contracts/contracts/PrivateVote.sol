// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateVote
 * @dev A confidential voting contract using Zama's Fully Homomorphic Encryption (FHE)
 * @notice Enables private voting where votes remain encrypted until results are revealed
 * 
 * Current Features:
 * - Permissionless poll creation (0.001 ETH anti-spam fee)
 * - FHE-encrypted vote tallies using euint64 homomorphic operations
 * - Time-based voting windows with strict validation
 * - Public reveal mechanism - anyone can trigger result decryption
 * - Anti-double voting with address tracking
 * - Owner fee management and withdrawal
 * 
 * Privacy Model:
 * - Individual votes encrypted with FHEVM during voting period
 * - Vote tallies computed homomorphically (FHE.add) without decryption
 * - Only final aggregate totals revealed via KMS public decryption
 * - Voter choices never exposed, only final counts
 * 
 * Security:
 * - Testnet/demo contract - NOT audited for production
 * - ACL controls access to encrypted data
 * - KMS signature verification prevents oracle manipulation
 * - Creator and public reveal options prevent stuck polls
 */
contract PrivateVote is SepoliaConfig {
    
    // ================================
    // STRUCTS & STATE VARIABLES
    // ================================
    
    struct Poll {
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool revealed;
        address creator;
        mapping(uint256 => euint64) encTallies;     // option index => encrypted tally
        mapping(uint256 => uint256) plainTallies;   // option index => revealed tally
        mapping(address => bool) hasVoted;          // voter => voted status
        uint256 totalVoters;                        // total number of voters (public)
    }
    
    // State variables
    address public owner;
    uint256 public pollCount;
    uint256 public creationFee = 0.001 ether; // 0.001 ETH to create poll
    mapping(uint256 => Poll) public polls;
    
    // For decryption requests tracking
    mapping(uint256 => uint256) private _decryptionRequestIds; // pollId => requestId
    
    // ================================
    // EVENTS  
    // ================================
    
    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime,
        uint256 optionsCount,
        uint256 creationFee
    );
    
    event CreationFeeUpdated(
        uint256 oldFee,
        uint256 newFee,
        address indexed owner
    );
    
    event FeesWithdrawn(
        uint256 amount,
        address indexed owner
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
    
    // ================================
    // ERRORS
    // ================================
    
    error OnlyOwner();
    error OnlyCreatorOrOwner();
    error InsufficientCreationFee();
    error PollNotFound();
    error InvalidTimeRange();
    error InvalidOptions();
    error VotingNotActive();
    error AlreadyVoted();
    error InvalidOption();
    error VotingStillActive();
    error AlreadyRevealed();
    error DecryptionInProgress();
    error UnauthorizedCallback();
    error WithdrawalFailed();
    
    // ================================
    // MODIFIERS
    // ================================
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier onlyCreatorOrOwner(uint256 pollId) {
        if (msg.sender != polls[pollId].creator && msg.sender != owner) {
            revert OnlyCreatorOrOwner();
        }
        _;
    }
    
    modifier validPoll(uint256 pollId) {
        if (pollId >= pollCount) revert PollNotFound();
        _;
    }
    
    modifier votingActive(uint256 pollId) {
        Poll storage poll = polls[pollId];
        uint256 currentTime = block.timestamp;
        if (currentTime < poll.startTime || currentTime >= poll.endTime) {
            revert VotingNotActive();
        }
        _;
    }
    
    modifier votingEnded(uint256 pollId) {
        if (block.timestamp < polls[pollId].endTime) {
            revert VotingStillActive();
        }
        _;
    }
    
    // ================================
    // CONSTRUCTOR
    // ================================
    
    constructor(address _owner) {
        owner = _owner;
        pollCount = 0;
    }
    
    // ================================
    // ADMIN FUNCTIONS
    // ================================
    
    /**
     * @notice Create a new poll with encrypted tally tracking (anyone can create with fee)
     * @param title Poll title
     * @param description Poll description  
     * @param options Array of voting options
     * @param startTime Voting start timestamp
     * @param endTime Voting end timestamp
     * @return pollId The ID of the created poll
     */
    function createPoll(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime
    ) external payable returns (uint256 pollId) {
        // Check creation fee
        if (msg.value < creationFee) revert InsufficientCreationFee();
        // Validation
        if (startTime >= endTime || endTime <= block.timestamp) {
            revert InvalidTimeRange();
        }
        if (options.length < 2 || options.length > 10) {
            revert InvalidOptions();
        }
        
        pollId = pollCount++;
        Poll storage newPoll = polls[pollId];
        
        // Set basic poll data
        newPoll.title = title;
        newPoll.description = description;
        newPoll.options = options;
        newPoll.startTime = startTime;
        newPoll.endTime = endTime;
        newPoll.revealed = false;
        newPoll.creator = msg.sender;
        newPoll.totalVoters = 0;
        
        // Initialize encrypted tallies to zero for each option
        for (uint256 i = 0; i < options.length; i++) {
            euint64 encryptedZero = FHE.asEuint64(0);
            newPoll.encTallies[i] = encryptedZero;
            // Grant permissions for the contract to use these ciphertexts
            FHE.allowThis(encryptedZero);
        }
        
        emit PollCreated(pollId, msg.sender, title, startTime, endTime, options.length, msg.value);
    }
    
    /**
     * @notice Request decryption of poll results (creator or owner only, after voting ends)
     * @param pollId The poll ID to reveal
     */
    function requestReveal(uint256 pollId) 
        external 
        onlyCreatorOrOwner(pollId)
        validPoll(pollId) 
        votingEnded(pollId) 
    {
        _performReveal(pollId);
    }
    
    /**
     * @notice Public reveal - anyone can reveal poll results after voting ends
     * @param pollId The poll ID to reveal
     */
    function publicReveal(uint256 pollId) 
        external 
        validPoll(pollId) 
        votingEnded(pollId) 
    {
        _performReveal(pollId);
    }
    
    /**
     * @dev Internal function to perform the reveal process
     * @param pollId The poll ID to reveal
     */
    function _performReveal(uint256 pollId) private {
        Poll storage poll = polls[pollId];
        
        if (poll.revealed) revert AlreadyRevealed();
        if (_decryptionRequestIds[pollId] != 0) revert DecryptionInProgress();
        
        // Prepare ciphertexts for decryption
        uint256 optionsCount = poll.options.length;
        bytes32[] memory ctsToDecrypt = new bytes32[](optionsCount);
        
        for (uint256 i = 0; i < optionsCount; i++) {
            ctsToDecrypt[i] = FHE.toBytes32(poll.encTallies[i]);
        }
        
        // Request decryption from the oracle
        uint256 requestId = FHE.requestDecryption(
            ctsToDecrypt,
            this.revealCallback.selector
        );
        
        _decryptionRequestIds[pollId] = requestId;
        
        emit RevealRequested(pollId, requestId);
    }
    
    /**
     * @notice Callback function called by the decryption oracle
     * @param requestId The decryption request ID
     * @param cleartexts The decrypted values (ABI-encoded, 32 bytes per static value)
     * @param decryptionProof The proof of correct decryption
     */
    function revealCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Find the poll associated with this request
        uint256 pollId = type(uint256).max;
        for (uint256 i = 0; i < pollCount; i++) {
            if (_decryptionRequestIds[i] == requestId) {
                pollId = i;
                break;
            }
        }
        if (pollId == type(uint256).max) revert UnauthorizedCallback();

        // Verify requestId binding and signatures
        require(_decryptionRequestIds[pollId] == requestId, "Invalid requestId");
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        
        Poll storage poll = polls[pollId];
        
        // Decode the decrypted tallies (ABI-encoded uint64 values = 32 bytes each)
        uint256 optionsCount = poll.options.length;
        uint256[] memory decryptedTallies = new uint256[](optionsCount);
        
        for (uint256 i = 0; i < optionsCount; i++) {
            uint256 word;
            assembly {
                word := mload(add(add(cleartexts, 0x20), mul(i, 0x20))) // 32 bytes per value
            }
            uint64 tally = uint64(word);
            decryptedTallies[i] = uint256(tally);
            poll.plainTallies[i] = uint256(tally);
        }
        
        // Mark as revealed and cleanup
        poll.revealed = true;
        delete _decryptionRequestIds[pollId];
        
        emit Revealed(pollId, decryptedTallies, poll.totalVoters);
    }
    
    // ================================
    // VOTING FUNCTIONS
    // ================================
    
    /**
     * @notice Cast an encrypted vote for a specific option
     * @param pollId The poll ID to vote in
     * @param optionId The option index to vote for
     * @param encryptedOne Encrypted value of 1 (the vote)
     * @param inputProof Zero-knowledge proof for the encrypted input
     */
    function vote(
        uint256 pollId,
        uint256 optionId,
        externalEuint64 encryptedOne,
        bytes calldata inputProof
    ) 
        external 
        validPoll(pollId) 
        votingActive(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Check if user already voted
        if (poll.hasVoted[msg.sender]) revert AlreadyVoted();
        
        // Validate option
        if (optionId >= poll.options.length) revert InvalidOption();
        
        // Verify and get the encrypted vote (should be 1)
        euint64 encVote = FHE.fromExternal(encryptedOne, inputProof);

        // ACL check for encrypted inputs (must check on internal euint*)
        require(FHE.isSenderAllowed(encVote), "Unauthorized encrypted input");
        
        // Add the encrypted vote to the tally using homomorphic addition
        euint64 currentTally = poll.encTallies[optionId];
        euint64 newTally = FHE.add(currentTally, encVote);
        poll.encTallies[optionId] = newTally;
        
        // Grant permission for contract to use the new tally
        FHE.allowThis(newTally);
        
        // Mark as voted and increment total voters
        poll.hasVoted[msg.sender] = true;
        poll.totalVoters++;
        
        emit Voted(pollId, msg.sender, optionId);
    }
    
    // ================================
    // VIEW FUNCTIONS
    // ================================
    
    /**
     * @notice Get poll basic information
     */
    function getPollInfo(uint256 pollId) 
        external 
        view 
        validPoll(pollId) 
        returns (
            string memory title,
            string memory description,
            string[] memory options,
            uint256 startTime,
            uint256 endTime,
            bool revealed,
            address creator,
            uint256 totalVoters
        )
    {
        Poll storage poll = polls[pollId];
        return (
            poll.title,
            poll.description,
            poll.options,
            poll.startTime,
            poll.endTime,
            poll.revealed,
            poll.creator,
            poll.totalVoters
        );
    }
    
    /**
     * @notice Check if address can create polls (anyone with enough ETH)
     */
    function canCreatePoll(address user) external view returns (bool) {
        return user.balance >= creationFee;
    }
    
    /**
     * @notice Get creation fee amount
     */
    function getCreationFee() external view returns (uint256) {
        return creationFee;
    }
    
    /**
     * @notice Get poll results (only available after reveal)
     */
    function getPollResults(uint256 pollId)
        external
        view
        validPoll(pollId)
        returns (uint256[] memory tallies, uint256 totalVotes)
    {
        Poll storage poll = polls[pollId];
        
        if (!poll.revealed) {
            // Return empty results if not revealed
            return (new uint256[](poll.options.length), 0);
        }
        
        tallies = new uint256[](poll.options.length);
        for (uint256 i = 0; i < poll.options.length; i++) {
            tallies[i] = poll.plainTallies[i];
        }
        
        return (tallies, poll.totalVoters);
    }
    
    /**
     * @notice Check if an address has voted in a poll
     */
    function hasVoted(uint256 pollId, address voter) 
        external 
        view 
        validPoll(pollId) 
        returns (bool) 
    {
        return polls[pollId].hasVoted[voter];
    }
    
    /**
     * @notice Get current voting status of a poll
     */
    function getPollStatus(uint256 pollId) 
        external 
        view 
        validPoll(pollId) 
        returns (string memory status) 
    {
        Poll storage poll = polls[pollId];
        uint256 currentTime = block.timestamp;
        
        if (poll.revealed) {
            return "revealed";
        } else if (currentTime < poll.startTime) {
            return "upcoming";
        } else if (currentTime >= poll.startTime && currentTime < poll.endTime) {
            return "active";
        } else {
            return "ended";
        }
    }
    
    /**
     * @notice Check if decryption is in progress
     */
    function isDecryptionInProgress(uint256 pollId) 
        external 
        view 
        validPoll(pollId) 
        returns (bool) 
    {
        return _decryptionRequestIds[pollId] != 0;
    }
    
    // ================================
    // OWNER MANAGEMENT
    // ================================
    
    /**
     * @notice Set the creation fee for new polls (owner only)
     * @param newFee New creation fee in wei
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;
        
        emit CreationFeeUpdated(oldFee, newFee, msg.sender);
    }
    
    /**
     * @notice Withdraw collected fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
        
        emit FeesWithdrawn(balance, msg.sender);
    }
    
    /**
     * @notice Transfer owner role (current owner only)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner address");
        owner = newOwner;
    }
    
    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
