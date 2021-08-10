pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Loan.sol";
import "./User.sol";
import "./TScoreController.sol";

contract DynamicCollateralLending {

    using Math for uint;

    // Store all users with their address
    mapping(address => User) public users;
    address[] userAddr;

    uint addressRegistryCount;
    address tScoreController;

    constructor() {
        tScoreController = address(new TScoreController());
    }

    /** @dev Events
    *
    */
    event LoanRequestedPosted(address indexed _address, uint indexed timestamp, address indexed _loanAddress, address _userAddress);
    event TScoreInitialized(address indexed _address, uint indexed timestamp);

    function applyForLoan(uint _requestedAmount, uint _repaymentsCount, uint _interest) public {

        if (users[msg.sender] != User(address(0))) {
            // The user not fraudulent
            /* require(users[msg.sender ].fraudStatus == false);

             // The user must not have any loan in progress
             assert(users[msg.sender].activeLoan == address(0));*/
        } else {
            users[msg.sender] = new User();
        }

        uint creationTime = block.timestamp+30;
/*
        TScore storage tScore;
        if (users[msg.sender] == address(0x0)) {
            initTScore();
        } else {
            tScore = users[msg.sender];
        }*/

        Loan loan = new Loan(address(users[msg.sender]), _requestedAmount, _repaymentsCount, _interest, creationTime, tScoreController);

        address loanAddr = address(loan);

        users[msg.sender].setActiveLoan(loanAddr);
        users[msg.sender].setOrbitDbIndexHash(loanAddr);
        userAddr.push(msg.sender);
        addressRegistryCount++;

        emit LoanRequestedPosted(msg.sender, block.timestamp, loanAddr, address(users[msg.sender]));
    }

    function getHashesOfLoanRequests() public view returns (address[] memory){
        address[] memory ret = new address[](addressRegistryCount);
        for (uint i = 0; i < addressRegistryCount; i++) {
            ret[i] = users[userAddr[i]].orbitDbIndexHash();
        }
        return ret;
    }

    function hasBorrow() public view returns (bool) {
        return users[msg.sender].activeLoan() != address(0);
    }

    function getBorrowerInfos() public view returns (
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256)
    {
        return Loan(users[msg.sender].activeLoan()).getInfosForBorrower();
    }

    function invest(address loanContract) public payable {
       Loan(loanContract).lend{value: msg.value}(msg.sender);
    }

    function recommend(address loanContract, uint8 score) public payable {
       Loan(loanContract).recommend{value: msg.value}(score, msg.sender);
    }

    function getBalance() public view returns (uint256) {
        return Loan(users[msg.sender].activeLoan()).getBalance();
    }

    function initTScore() internal {
        emit TScoreInitialized(msg.sender, block.timestamp);
    }

}
