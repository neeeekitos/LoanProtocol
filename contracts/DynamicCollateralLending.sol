pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Loan.sol";

contract DynamicCollateralLending {

    using Math for uint;

    struct User {
        bool fraudStatus;
        address activeLoan;
        address activeSupply;
        byte32 orbitDbIndexHash;
    }

    // Store all users with their address
    mapping(address => User) public users;
    address[] userAddr;

    uint addressRegistryCount;

    /** @dev Events
    *
    */
    event LogLoanRequestedPosted(address indexed _address, uint indexed timestamp);

    function applyForLoan(uint _requestedAmount, uint _repaymentsCount, uint _interest) public {

        // The user not fraudulent
       /* require(users[msg.sender].fraudStatus == false);

        // The user must not have any loan in progress
        assert(users[msg.sender].activeLoan == address(0));*/

        Loan loan = new Loan(_requestedAmount, _repaymentsCount, _interest);

        users[msg.sender].activeLoan = address(loan);

        emit LogLoanRequestedPosted(msg.sender, block.timestamp);
    }

    function getHashesOfLoanRequests() public view returns (byte32[] memory){
        address[] memory ret = new address[](addressRegistryCount);
        address index;
        for (uint i = 0; i < addressRegistryCount; i++) {
            ret[i] = users[userAddr[i]].orbitDbIndexHash;
        }
        return ret;
    }

    function test() public {

    }

}
