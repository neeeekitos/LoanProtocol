pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Loan {

    using SafeMath for uint;

    address borrower;

    // Requested amount for a loan
    uint requestedAmount;

    // Amount to be returned by the borrower (with an interest)
    uint repaymentsCount;

    // Loan interest
    uint interest;

    // Description of a loan
    bytes32 loanDescription;

    uint returnAmount;

    uint loanCreationDate;

    uint lastRepaymentDate;

    uint remainingPayments;

    uint repaymentInstallment;

    uint repaidAmount;

    // Active state of the credit.
    bool active = true;

    mapping(address => bool) public lenders;

    mapping(address => uint) lendersInvestedAmount;

    /** Stages that every credit contract gets trough.
      *   investment - During this state only investments are allowed.
      *   repayment - During this stage only repayments are allowed.
      *   interestReturns - This stage gives investors opportunity to request their returns.
      *   expired - This is the stage when the contract is finished its purpose.
      *   fraud - The borrower was marked as fraud.
    */
    enum State { investment, repayment, interestReturns, expired, revoked, fraud }
    State state;

    // Store the lenders count, later needed for revoke vote.
    uint lendersCount = 0;


    /** @dev Events
    *
    */
    event LogCreditInitialized(address indexed _address, uint indexed timestamp);
    event LogCreditStateChanged(State indexed state, uint indexed timestamp);
    event LogCreditStateActiveChanged(bool indexed active, uint indexed timestamp);

    event LogBorrowerWithdrawal(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerRepaymentInstallment(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerRepaymentFinished(address indexed _address, uint indexed timestamp);
    event LogBorrowerChangeReturned(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerIsFraud(address indexed _address, bool indexed fraudStatus, uint indexed timestamp);

    event LogLenderInvestment(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogLenderWithdrawal(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogLenderChangeReturned(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogLenderVoteForRevoking(address indexed _address, uint indexed timestamp);
    event LogLenderVoteForFraud(address indexed _address, uint indexed timestamp);
    event LogLenderRefunded(address indexed _address, uint indexed _amount, uint indexed timestamp);

    /** @dev Modifiers
    *
    */
    modifier isActive() {
        require(active == true);
        _;
    }

    modifier onlyBorrower() {
        require(msg.sender == borrower);
        _;
    }

    modifier onlyLender() {
        require(lenders[msg.sender] == true);
        _;
    }

    modifier canAskForInterest() {
        require(state == State.interestReturns);
        require(lendersInvestedAmount[msg.sender] > 0);
        _;
    }

    modifier canInvest() {
        require(state == State.investment);
        _;
    }

    modifier canRepay() {
        require(state == State.repayment);
        _;
    }

    modifier canWithdraw() {
        require(address(this).balance>= requestedAmount);
        _;
    }

    modifier isNotFraud() {
        require(state != State.fraud);
        _;
    }

    modifier isRevokable() {
        /*require(block.timestamp >= revokeTimeNeeded);*/
        require(state == State.investment);
        _;
    }

    modifier isRevoked() {
        require(state == State.revoked);
        _;
    }

    constructor (uint _requestedAmount, uint _repaymentsCount, uint _interest, bytes32 _loanDescription) public {


        requestedAmount = _requestedAmount;
        repaymentsCount = _repaymentsCount;
        interest =  _interest;
        loanDescription = _loanDescription;

        // Calculate the amount to return by the borrower
        returnAmount = requestedAmount.add(interest);

        loanCreationDate = block.timestamp;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /** @dev Invest function.
      * Provides functionality for person to invest in someone's credit,
      * incentivised by the return of interest.
      */
    function lend() public canInvest payable {

        uint extraMoney = 0;

        if (address(this).balance>= requestedAmount) {
            extraMoney = address(this).balance.sub(requestedAmount);
            assert(requestedAmount == address(this).balance.sub(extraMoney));

            // Assert that there is no overflow / underflow
            assert(extraMoney <= msg.value);

            if (extraMoney > 0) {
                // return extra money to the sender
                payable(msg.sender).transfer(extraMoney);

                // TODO event change returned
            }

            state = State.repayment;

            // TODO event changed state

        }

        lenders[msg.sender] = true;
        lendersInvestedAmount[msg.sender] = lendersInvestedAmount[msg.sender].add(msg.value.sub(extraMoney));

        // TODO event invested amount
    }

    /** @dev Repayment function.
     * Allows borrower to make repayment installments.
     */
    function repay() public onlyBorrower canRepay payable {
        require(remainingPayments > 0);
        require(msg.value >= repaymentInstallment);

        assert(repaidAmount < returnAmount);

        // Update last repayment date
        lastRepaymentDate = block.timestamp;

        uint extraMoney = 0;

        if (msg.value > repaymentInstallment) {

            extraMoney = msg.value.sub(repaymentInstallment);

            assert(repaymentInstallment == msg.value.sub(extraMoney));

            // Check the underflow
            assert(extraMoney < msg.value);

            payable(msg.sender).transfer(extraMoney);

            // TODO return event
        }

        // TODO event borrower installement received

        if (repaidAmount == returnAmount) {

            // TODO repayment finished event

            state = State.interestReturns;

            // TODO event credit state changed
        }
    }

    /** @dev Withdraw function.
      * It can only be executed while contract is in active state.
      * It is only accessible to the borrower.
      * It is only accessible if the needed amount is gathered in the contract.
      * It can only be executed once.
      * Transfers the gathered amount to the borrower.
      */
    function withdraw() public isActive onlyBorrower canWithdraw isNotFraud {
        // Set the state to repayment so we can avoid reentrancy.
        state = State.repayment;

        // Log state change.
        emit LogCreditStateChanged(state, block.timestamp);

        // Log borrower withdrawal.
        emit LogBorrowerWithdrawal(msg.sender, address(this).balance, block.timestamp);

        // Transfer the gathered amount to the credit borrower.
        payable(borrower).transfer(address(this).balance);
    }

    /** @dev Request interest function.
      * It can only be executed while contract is in active state.
      * It is only accessible to lenders.
      * It is only accessible if lender funded 1 or more wei.
      * It can only be executed once.
      * Transfers the lended amount + interest to the lender.
      */
    function requestInterest() public isActive onlyLender canAskForInterest {

        // Calculate the amount to be returned to lender.
        //        uint lenderReturnAmount = lendersInvestedAmount[msg.sender].mul(returnAmount.div(lendersCount).div(lendersInvestedAmount[msg.sender]));
        uint lenderReturnAmount = returnAmount / lendersCount;

        // Assert the contract has enough balance to pay the lender.
        assert(address(this).balance >= lenderReturnAmount);

        // Transfer the return amount with interest to the lender.
        payable(msg.sender).transfer(lenderReturnAmount);

        // Log the transfer to lender.
        emit LogLenderWithdrawal(msg.sender, lenderReturnAmount, block.timestamp);

        // Check if the contract balance is drawned.
        if (address(this).balance == 0) {

            // Set the active state to false.
            active = false;

            // Log active state change.
            emit LogCreditStateActiveChanged(active, block.timestamp);

            // Set the contract stage to expired e.g. its lifespan is over.
            state = State.expired;

            // Log state change.
            emit LogCreditStateChanged(state, block.timestamp);
        }
    }
}
