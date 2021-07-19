pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Loan.sol";

contract DynamicCollateralLending {

    using Math for uint;

    struct User {
        bool fraudStatus;
        address activeLoan;
        address activeSupply;
        address orbitDbIndexHash;
    }

    // Store all users with their address
    mapping(address => User) public users;
    address[] userAddr;

    uint addressRegistryCount;

    /** @dev Events
    *
    */
    event LogLoanRequestedPosted(address indexed _address, uint indexed timestamp, address indexed _loanAddress);

    function applyForLoan(uint _requestedAmount, uint _repaymentsCount, uint _interest) public {

        // The user not fraudulent
        /* require(users[msg.sender].fraudStatus == false);

         // The user must not have any loan in progress
         assert(users[msg.sender].activeLoan == address(0));*/
        uint creationTime = block.timestamp+30;


        Loan loan = new Loan(msg.sender, _requestedAmount, _repaymentsCount, _interest, creationTime);
        //        address loanAddr = address(0);

        address loanAddr = address(loan);

        users[msg.sender].activeLoan = loanAddr;
        users[msg.sender].orbitDbIndexHash = loanAddr;
        userAddr.push(msg.sender);
        addressRegistryCount++;

        emit LogLoanRequestedPosted(msg.sender, block.timestamp, loanAddr);
    }

    function getHashesOfLoanRequests() public view returns (address[] memory){
        address[] memory ret = new address[](addressRegistryCount);
        for (uint i = 0; i < addressRegistryCount; i++) {
            ret[i] = users[userAddr[i]].orbitDbIndexHash;
        }
        return ret;
    }

    function hasBorrow() public view returns (bool) {
        return users[msg.sender].activeLoan != address(0);
    }

    function getBorrowerInfos() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return Loan(users[msg.sender].activeLoan).getInfosForBorrower();
    }

    function invest(address loanContract) public payable {
       Loan(loanContract).lend{value: msg.value}();
    }

    function recommend(address loanContract) public payable {
       Loan(loanContract).recommend{value: msg.value}();
    }

    function getBalance() public view returns (uint256) {
        return Loan(users[msg.sender].activeLoan).getBalance();
    }

    function test() public {

    }

}
