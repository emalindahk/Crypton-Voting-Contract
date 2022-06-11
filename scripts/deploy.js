const main = async () => {
    const voteContractFactory = await hre.ethers.getContractFactory("Vote");
    const voteContract = await voteContractFactory.deploy(["0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"]);
    await voteContract.deployed();
    console.log("contract deployed to:" , voteContract.address);
    // Rinkeby contract address: 0xE9e1782961a435a15609647f3639212962731721
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