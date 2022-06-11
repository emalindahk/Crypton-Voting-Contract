const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert, time } = require("@openzeppelin/test-helpers");
const web3 = require("web3");

describe("Vote", function () {
  let VoteContractFactory;
  let voteContract;
  let owner;
  let alice;
  let bob;
  let max;
  let jon;
  let candidatesList;
  let threeDays;

  beforeEach(async function () {
    VoteContractFactory = await ethers.getContractFactory("Vote");
    [owner, alice, bob, max, jon, ...accounts] = await ethers.getSigners();
    candidateOne = await accounts[5].getAddress();
    candidateTwo = await accounts[6].getAddress();
    voteContract = await VoteContractFactory.deploy([
      candidateOne,
      candidateTwo,
    ]);
    candidatesList = await voteContract.getCandidates();
    threeDays = 3 * 24 * 60 * 60;
  });

  describe("Deployment", async () => {
    it("Deploys successfully", async () => {
      const address = voteContract.address;
      assert.notEqual(address, "");
      assert.notEqual(address, 0x0);
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });
    it("Should have candidates list", async () => {
      expect(candidateOne, candidateTwo).to.equal(
        candidatesList[0][0],
        candidatesList[1][0]
      );
    });
  });

  describe("Deposit to participate.", async () => {
    it("With Invalid Price. Expect to throw error", async () => {
      await expectRevert(
        voteContract.connect(alice).deposit({ value: 100000000000000000n }),
        "You need to deposit atleast 0.5 ether"
      );
    });

    it("Successful deposit participation fee", async () => {
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
    });

    it("Participant/Voter should have 0.5 ether", async () => {
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });

      let balance = await voteContract.connect(alice).getVoterBalance();
      expect(balance).to.equal(500000000000000000n);
    });
  });

  describe("Voting", async () => {
    it("Without participation fee. Expext to throw error", async () => {
      await expectRevert(
        voteContract.connect(bob).vote(1),
        "You haven't paid your participation fee!"
      );
    });

    it("Vote twice. Expect to throw error", async () => {
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
      await voteContract.connect(alice).vote(1);
      await expectRevert(voteContract.connect(alice).vote(1), "Already voted.");
    });

    it("Vote successfully", async () => {
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
      await voteContract.connect(alice).vote(1);
    });
  });

  describe("Winning candidate", async () => {
    it("Show wiining candidates details", async () => {
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
      await voteContract.connect(bob).deposit({ value: 500000000000000000n });
      await voteContract.connect(max).deposit({ value: 500000000000000000n });

      await voteContract.connect(alice).vote(1);
      await voteContract.connect(bob).vote(1);
      await voteContract.connect(max).vote(0);

      let winner = await voteContract.winnerAddress();
      expect(winner[0]).to.equal(candidatesList[1][0]);
    });
  });

  describe("Withdraw Commission", async () => {
    it("If voting period has not ended. Expect to throw error", async () => {
      await expectRevert(
        voteContract.withdraw(),
        "Voting Period has not ended"
      );
    });

    it("If not owner withdrawing. Expect to throw error", async () => {
      await hre.ethers.provider.send("evm_increaseTime", [threeDays]);
      await hre.ethers.provider.send("evm_mine");
      await expectRevert(
        voteContract.connect(alice).withdraw(),
        "Access denied"
      );
    });

    it("Only owner can withdraw", async () => {
      await hre.ethers.provider.send("evm_increaseTime", [threeDays]);
      await hre.ethers.provider.send("evm_mine");
      await voteContract.withdraw();
    });

    it("Owner can withdraw 10% of total funds(commission)", async () => {
      // 1350000000000000000
      // 1500000000000000000
      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
      await voteContract.connect(bob).deposit({ value: 500000000000000000n });
      await voteContract.connect(max).deposit({ value: 500000000000000000n });

      await hre.ethers.provider.send("evm_increaseTime", [threeDays]);
      await hre.ethers.provider.send("evm_mine");
      await voteContract.withdraw();

      const contractBalance = await voteContract.contractBalance();

      expect(contractBalance).to.equal("1350000000000000000");
    });
  });

  describe("End Voting", async () => {
    it("If voting period has not ended. Expect to throw error", async () => {
      await expectRevert(
        voteContract.withdraw(),
        "Voting Period has not ended"
      );
    });

    it("End voting and send winnings to winner", async () => {
      await hre.ethers.provider.send("evm_increaseTime", [threeDays]);
      await hre.ethers.provider.send("evm_mine");

      await voteContract.connect(alice).deposit({ value: 500000000000000000n });
      await voteContract.connect(bob).deposit({ value: 500000000000000000n });
      await voteContract.connect(max).deposit({ value: 500000000000000000n });

      await voteContract.connect(alice).vote(1);
      await voteContract.connect(bob).vote(1);
      await voteContract.connect(max).vote(0);

      await voteContract.connect(alice).endVoting();

      const contractBalance = await voteContract.contractBalance();
      expect(contractBalance).to.equal("150000000000000000")
    });
  });
});
