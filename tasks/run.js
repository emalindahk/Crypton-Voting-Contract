const main = async () => {
    const [_, alice, bob, jon] = await hre.ethers.getSigners();
    const voteContractFactory = await hre.ethers.getContractFactory("Vote");
    const voteContract = await voteContractFactory.deploy(["0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"]);
    await voteContract.deployed();

    let allCandidatesTxn = await voteContract.getCandidates();
    console.log("Candidates:", allCandidatesTxn)

    //alice deposits
    let depositTxn = await voteContract.connect(alice).deposit({
        value: ethers.utils.parseEther("0.5"),
      });
    await depositTxn.wait();

    //jon deposits
    depositTxn = await voteContract.connect(jon).deposit({
        value: ethers.utils.parseEther("0.5"),
      });
    await depositTxn.wait();

    //bob deposits
    depositTxn = await voteContract.connect(bob).deposit({
        value: ethers.utils.parseEther("0.5"),
      });
    await depositTxn.wait();
 
    let votersTxn = await voteContract.getParticipants();
    console.log("All participants", votersTxn)

    let contractBalanceTxn = await voteContract.contractBalance();
    console.log("The contract balance is after participants deposit:", contractBalanceTxn)
    
    //Vote first time
    let voteTxn = await voteContract.connect(alice).vote(1);
    await voteTxn.wait();

    //Vote second time
    voteTxn = await voteContract.connect(jon).vote(1);
    await voteTxn.wait()

    //Vote third time
    voteTxn = await voteContract.connect(bob).vote(0);
    await voteTxn.wait()

    let winnerDetailsTxn = await voteContract.winnerAddress();
    console.log("Winner's details are:", winnerDetailsTxn)

    threeDays = 3 * 24 * 60 * 60;

    await hre.ethers.provider.send("evm_increaseTime", [threeDays]);
    await hre.ethers.provider.send("evm_mine");

    let endVoteTxn = await voteContract.endVoting()
    await endVoteTxn.wait()

    contractBalanceTxn = await voteContract.contractBalance();
    console.log("The contract balance is after voting has ended:", contractBalanceTxn)

    let withdrawTxn = await voteContract.withdraw()
    await withdrawTxn.wait()

    contractBalanceTxn = await voteContract.contractBalance();
    console.log("The contract balance is after owner withdraws:", contractBalanceTxn)    
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

runMain();