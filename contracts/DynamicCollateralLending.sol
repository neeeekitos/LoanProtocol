pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";

import "./Loan.sol";

contract DynamicCollateralLending {

    using Math for uint;

    struct User {
        uint8 tscore;
        bool isFraud;
        address activeLoan;
        address[] activeSupplies;
        address[] activeRecommendations;
        address orbitDbIndexHash;
    }

    // Store all users with their address
    mapping(address => User) public users;
    address[] userAddr;

    uint addressRegistryCount;

    /** @dev Modifiers
    *
    */

    // Can be mofified only by the

    // Can invest only if a user doesn't have any loan in progress
    modifier canInvest(address user) {
        require(users[user].activeLoan == address(0));
        _;
    }

    // Can recommend only if a user doesn't have any loan in progress
    modifier canRecommend(address user) {
        require(users[user].activeLoan == address(0));
        _;
    }


    // Can borrow only if a user doens't have any loan in progress and doesn't recommend or invest in any project
    modifier canBorrow(address user) {
        require(users[user].activeLoan == address(0) &&
        (users[user].activeRecommendations.length == 0) &&
            (users[user].activeSupplies.length == 0));
        _;
    }


    /** @dev Events
    *
    */
    event LogLoanRequestedPosted(address indexed _address, uint indexed timestamp);

    function applyForLoan(uint _requestedAmount, uint _repaymentsCount, uint _interest) public canBorrow(msg.sender) {

        // The user not fraudulent
        /* require(users[msg.sender].isFraud == false);

         // The user must not have any loan in progress
         assert(users[msg.sender].activeLoan == address(0));*/

        address loanAddr = address(new Loan(msg.sender, _requestedAmount, _repaymentsCount, _interest));
        //        address loanAddr = address(0);

        users[msg.sender].activeLoan = loanAddr;
        users[msg.sender].orbitDbIndexHash = loanAddr;
        userAddr.push(msg.sender);
        addressRegistryCount++;

        emit LogLoanRequestedPosted(msg.sender, block.timestamp);
    }

    function getHashesOfLoanRequests() public view returns (address[] memory){
        address[] memory ret = new address[](addressRegistryCount);
        for (uint i = 0; i < addressRegistryCount; i++) {
            ret[i] = users[userAddr[i]].orbitDbIndexHash;
        }
        return ret;
    }

    function invest(address _loanContract) public canInvest(msg.sender) payable {
        Loan(_loanContract).lend{value: msg.value}();
    }

    function recommend(address _loanContract) public canRecommend(msg.sender) payable {
        Loan(_loanContract).recommend{value: msg.value}();
    }

    function getBalance() public view returns (uint256) {
        return Loan(users[msg.sender].activeLoan).getBalance();
    }

    /** @dev Sets user fraudlent status true.
     * @param _borrower The user's address.
     * @return users[_borrower].isFraud Boolean of the new fraud status.
     */
    function setFraudStatus(address _borrower) external returns (bool) {
        // Update user fraud status.
        users[_borrower].isFraud = true;

        // Log fraud status.
        //LogUserSetFraud(_borrower, users[_borrower].isFraud, block.timestamp);

        return users[_borrower].isFraud;
    }

    /** @dev Function to switch active state of a credit.
      * @param _loanContract The credit's address.
      * @param state New state.
      */
    function changeCreditState (Loan _loanContract, Loan.State state) public{
        // Call credit contract changeStage.
        Loan loan = Loan(_loanContract);
        loan.changeState(state);

        // Log state change.
        //LogCreditStateChanged(credit, state, block.timestamp);
    }

}
