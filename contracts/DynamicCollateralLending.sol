pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Loan.sol";

contract DynamicCollateralLending {

    using Math for uint;

    struct User {
        bool fraudStatus;
        address activeLoan;
        address activeSupply;
    }

    // Store all users with their address
    mapping(address => User) public users;

    function applyForLoan(uint _requestedAmount, uint _repaymentsCount, uint _interest, bytes32 _loanDescription) public returns(address) {

        // The user not fraudulent
        require(users[msg.sender].fraudStatus == false);

        // The user must not have any loan in progress
        assert(users[msg.sender].activeLoan == address(0));

        Loan loan = new Loan(_requestedAmount, _repaymentsCount, _interest, _loanDescription);

        users[msg.sender].activeLoan = address(loan);

        return address(loan);
    }

}
