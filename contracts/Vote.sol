// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract Vote {
    struct Voter {
        bool voted;
        address address_;
        uint256 ethBalance;
    }

    struct Candidate {
        address address_;
        uint voteCount;
    }

    mapping(address => Voter) public voters;

    Candidate[] public candidates;
    Voter[] public arrVoters;

    uint256 startTime;
    address payable public owner;

    uint256 constant PARTICIPATION_FEE = 500000000000000000;

    bool public commissionWithdrawn;
    bool public donationsWithdrawn;

    mapping(address => uint256) public addressToAmountFunded;

    uint256 public winningPrice;

    // ["0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db"]

    constructor(address[] memory candidateNames) {
        owner = payable(msg.sender);
        startTime = block.timestamp;
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(
                Candidate({address_: candidateNames[i], voteCount: 0})
            );
        }
    }

    modifier hasDeposited() {
        require(
            addressToAmountFunded[msg.sender] >= PARTICIPATION_FEE,
            "You haven't paid your participation fee!"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Access denied");
        _;
    }

    modifier votingPeriodEnded() {
        require(
            startTime + 3 days <= block.timestamp,
            "Voting Period has not ended"
        );
        _;
    }

    function deposit() public payable {
        require(
            addressToAmountFunded[msg.sender] < PARTICIPATION_FEE,
            "You have already deposited"
        );
        require(
            msg.value == PARTICIPATION_FEE,
            "You need to deposit atleast 0.5 ether"
        );
        arrVoters.push(Voter({
            address_ : msg.sender,
            voted : false,
            ethBalance: msg.value
        }));
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function vote(uint candidate) public hasDeposited {
        Voter storage sender = voters[msg.sender];
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        candidates[candidate].voteCount += 1;
    }

    function winningCandidate() public view returns (uint winningCandidate_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < candidates.length; p++) {
            if (candidates[p].voteCount > winningVoteCount) {
                winningVoteCount = candidates[p].voteCount;
                winningCandidate_ = p;
            }
        }
    }

    function winnerAddress()
        public
        view
        returns (address winnerAddress_, uint256 balance_)
    {
        winnerAddress_ = candidates[winningCandidate()].address_;
        balance_ = address(candidates[winningCandidate()].address_).balance;
    }

    function withdraw() public payable votingPeriodEnded onlyOwner  {
        require(!commissionWithdrawn, "Commission has already been withdrawn");
        uint256 commission = address(this).balance / 10;

        if (donationsWithdrawn == true) {
            (bool callSuccess, ) = payable(msg.sender).call{
                value: address(this).balance
            }("");
            require(callSuccess, "Withdraw failed");
        } else {
            (bool callSuccess, ) = payable(msg.sender).call{value: commission}(
                ""
            );
            require(callSuccess, "Withdraw failed");
        }
        commissionWithdrawn = true;
    }

    function endVoting() public payable votingPeriodEnded {
        require(!donationsWithdrawn, "Donations have been withdrawn");
        uint256 commission = address(this).balance / 10;
        winningPrice = address(this).balance - commission;
        if (commissionWithdrawn == true) {
            (bool callSuccess, ) = payable(
                candidates[winningCandidate()].address_
            ).call{value: address(this).balance}("");
            require(callSuccess, "Withdraw failed");
        } else {
            (bool callSuccess, ) = payable(
                candidates[winningCandidate()].address_
            ).call{value: winningPrice}("");
            require(callSuccess, "Withdraw failed");
        }
        donationsWithdrawn = true;
    }
    
    function getCandidates() public view returns (Candidate[] memory candidates_) {
        candidates_ = candidates;
    }

    function getParticipants() public view returns (Voter[] memory voters_) {
         voters_ = arrVoters;
    }

    function getVoterBalance() public view returns (uint bal) {
        bal = addressToAmountFunded[msg.sender];
    }

    function contractBalance() external view returns (uint balanceEth) {
        balanceEth = address(this).balance;
    }

    fallback() external payable {
        deposit();
    }

    receive() external payable {
        deposit();
    }
}
