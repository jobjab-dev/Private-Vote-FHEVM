import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { PrivateVote } from "../types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateVote", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  // Contract instance
  let privateVote: PrivateVote;

  // Test data
  const pollTitle = "Test Poll";
  const pollDescription = "This is a test poll for the FHEVM voting system";
  const pollOptions = ["Option A", "Option B", "Option C"];

  async function deployPrivateVoteFixture() {
    // Get signers (first signer will be owner)
    [owner, user1, user2, user3, nonOwner] = await ethers.getSigners();

    // Deploy PrivateVote contract with owner
    const PrivateVoteFactory = await ethers.getContractFactory("PrivateVote");
    const privateVoteContract = await PrivateVoteFactory.deploy(owner.address);
    await privateVoteContract.waitForDeployment();

    return {
      privateVote: privateVoteContract as PrivateVote,
      owner,
      user1,
      user2,
      user3,
      nonOwner,
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployPrivateVoteFixture);
    privateVote = fixture.privateVote;
    owner = fixture.owner;
    user1 = fixture.user1;
    user2 = fixture.user2;
    user3 = fixture.user3;
    nonOwner = fixture.nonOwner;
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await privateVote.owner()).to.equal(owner.address);
    });

    it("Should initialize poll count to 0", async function () {
      expect(await privateVote.pollCount()).to.equal(0);
    });

    it("Should set creation fee to 0.001 ETH", async function () {
      expect(await privateVote.creationFee()).to.equal(ethers.parseEther("0.001"));
    });
  });

  describe("Poll Creation", function () {
    it("Should allow anyone to create a poll with correct fee", async function () {
      const startTime = (await time.latest()) + 60; // Start in 1 minute
      const endTime = startTime + 3600; // Run for 1 hour
      const creationFee = ethers.parseEther("0.001");

      await expect(
        privateVote.connect(user1).createPoll(
          pollTitle,
          pollDescription,
          pollOptions,
          startTime,
          endTime,
          { value: creationFee }
        )
      )
        .to.emit(privateVote, "PollCreated")
        .withArgs(0, user1.address, pollTitle, startTime, endTime, pollOptions.length, creationFee);

      expect(await privateVote.pollCount()).to.equal(1);
    });

    it("Should prevent creating polls without sufficient fee", async function () {
      const startTime = (await time.latest()) + 60;
      const endTime = startTime + 3600;
      const insufficientFee = ethers.parseEther("0.0005"); // Less than 0.001 ETH

      await expect(
        privateVote.connect(user1).createPoll(
          pollTitle,
          pollDescription,
          pollOptions,
          startTime,
          endTime,
          { value: insufficientFee }
        )
      ).to.be.revertedWithCustomError(privateVote, "InsufficientCreationFee");
    });

    it("Should allow owner to set creation fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        privateVote.connect(owner).setCreationFee(newFee)
      )
        .to.emit(privateVote, "CreationFeeUpdated")
        .withArgs(ethers.parseEther("0.001"), newFee, owner.address);

      expect(await privateVote.creationFee()).to.equal(newFee);
    });

    it("Should prevent non-owner from setting creation fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        privateVote.connect(user1).setCreationFee(newFee)
      ).to.be.revertedWithCustomError(privateVote, "OnlyOwner");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to withdraw fees", async function () {
      const creationFee = ethers.parseEther("0.001");
      const startTime = (await time.latest()) + 60;
      const endTime = startTime + 3600;

      // Create a poll to generate fees
      await privateVote.connect(user1).createPoll(
        pollTitle,
        pollDescription,
        pollOptions,
        startTime,
        endTime,
        { value: creationFee }
      );

      const contractBalance = await ethers.provider.getBalance(privateVote.getAddress());
      expect(contractBalance).to.equal(creationFee);

      // Owner withdraws fees
      await expect(
        privateVote.connect(owner).withdrawFees()
      )
        .to.emit(privateVote, "FeesWithdrawn")
        .withArgs(creationFee, owner.address);

      const newBalance = await ethers.provider.getBalance(privateVote.getAddress());
      expect(newBalance).to.equal(0);
    });

    it("Should prevent non-owner from withdrawing fees", async function () {
      await expect(
        privateVote.connect(user1).withdrawFees()
      ).to.be.revertedWithCustomError(privateVote, "OnlyOwner");
    });
  });

  describe("Reveal Functions", function () {
    let pollId: number;

    beforeEach(async function () {
      const creationFee = await privateVote.getCreationFee();
      const currentTime = await time.latest();
      const startTime = currentTime + 60;
      const endTime = startTime + 3600;

      // Create a poll for testing
      const tx = await privateVote.connect(user1).createPoll(
        pollTitle,
        pollDescription,
        pollOptions,
        startTime,
        endTime,
        { value: creationFee }
      );
      const receipt = await tx.wait();
      pollId = 0; // First poll
    });

    it("Should allow creator to request reveal after voting ends", async function () {
      // Move time to after voting ends
      const pollInfo = await privateVote.getPollInfo(pollId);
      await time.increaseTo(Number(pollInfo.endTime) + 1);

      // Creator can request reveal
      await expect(
        privateVote.connect(user1).requestReveal(pollId)
      ).to.emit(privateVote, "RevealRequested");
    });

    it("Should allow anyone to use publicReveal after voting ends", async function () {
      // Move time to after voting ends
      const pollInfo = await privateVote.getPollInfo(pollId);
      await time.increaseTo(Number(pollInfo.endTime) + 1);

      // Any user can reveal publicly
      await expect(
        privateVote.connect(user2).publicReveal(pollId)
      ).to.emit(privateVote, "RevealRequested");
    });

    it("Should prevent publicReveal before voting ends", async function () {
      // Voting is still active
      await expect(
        privateVote.connect(user2).publicReveal(pollId)
      ).to.be.revertedWithCustomError(privateVote, "VotingStillActive");
    });

    it("Should prevent double reveal", async function () {
      // Move time to after voting ends
      const pollInfo = await privateVote.getPollInfo(pollId);
      await time.increaseTo(Number(pollInfo.endTime) + 1);

      // First reveal request
      await privateVote.connect(user1).requestReveal(pollId);
      
      // Second reveal should fail
      await expect(
        privateVote.connect(user2).publicReveal(pollId)
      ).to.be.revertedWithCustomError(privateVote, "DecryptionInProgress");
    });
  });

  // Note: Additional tests would be added for voting with FHEVM encryption
  // For full FHEVM testing, would need FHEVM test environment
});
