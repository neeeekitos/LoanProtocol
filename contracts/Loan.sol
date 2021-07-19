pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Loan {

    using SafeMath for uint;

    address borrower;
    // Requested amount for a loan
    uint public requestedAmount;
    // Amount to be returned by the borrower (with an interest)
    uint repaymentsCount;
    // Loan interest
    uint public interest;
    // The money is sent to the user only when the loan is started
    bool active = false;

    uint returnAmount;
    uint256 loanCreationDate;
    uint lastRepaymentDate;
    uint remainingPayments;
    uint repaymentInstallment;
    uint repaidAmount;
    uint constant loanExpirationInterval = 86400; // 1 DAY
    uint investorsAndRecommendersNumber;
    uint collateral;
    uint investedAmount;

    mapping(address => bool) public lenders;

    mapping(address => uint) lendersInvestedAmount;

    /** Stages that every credit contract gets trough.
      *   investment - During this state only investments are allowed.
      *   repayment - During this stage only repayments are allowed.
      *   interestReturns - This stage gives investors opportunity to request their returns.
      *   expired - If the contract does not accumulate the necessary amount on the
      *             balance over the time interval, it expires.
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

    // crowdfunding process cannot exceed an interval of expiration
    modifier notExpired() {
        require(block.timestamp - loanCreationDate < loanExpirationInterval);
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

    constructor (address _borrower, uint _requestedAmount, uint _repaymentsCount, uint _interest, uint _loanCreationDate) public {
        borrower = _borrower;
        requestedAmount = _requestedAmount;
        repaymentsCount = _repaymentsCount;
        interest =  _interest;
        loanCreationDate = _loanCreationDate;

        // Calculate the amount to return by the borrower
        returnAmount = requestedAmount.add(interest);

        // Loan can onlu start when sufficient funds are invested

        uint lastRepaymentDate = 0;
        collateral = 2;
        investorsAndRecommendersNumber = 0;
        uint remainingPayments = _requestedAmount;
        /*uint repaymentInstallment = remainingPayments.div(_repaymentsCount);*/
        uint repaidAmount = 0;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getProjectInfos() public view returns (uint256, uint256) {
        return (interest, requestedAmount);
    }

    function getInfosForBorrower() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (requestedAmount, interest, repaymentsCount, investorsAndRecommendersNumber, collateral, investedAmount);
    }

    /** @dev Trustworthiness score calculation function
      * Calculates trustworthiness score based on
      * borrower's attributes
      */
    function requestTScore() public view returns (uint) {
        // TODO place a magic formula here...
        return 0;
    }

    /** @dev Recommend function.
      * Provides functionality for person to recommend someone's project,
      * incentivized by the return of interest.
      */
    function recommend() public  payable {
    }

        // TODO recheck this function
    /** @dev Invest function.
      * Provides functionality for person to invest in someone's project,
      * incentivized by the return of interest.
      */
    // TODO add canInvest modifier
    function lend() public  payable {

        // uint extraMoney = 0;

        // if (address(this).balance>= requestedAmount) {
        //     extraMoney = address(this).balance.sub(requestedAmount);
        //     assert(requestedAmount == address(this).balance.sub(extraMoney));

        //     // Assert that there is no overflow / underflow
        //     assert(extraMoney <= msg.value);

        //     if (extraMoney > 0) {
        //         // return extra money to the sender
        //         payable(msg.sender).transfer(extraMoney);

        //         // TODO event change returned
        //     }

        //     state = State.repayment;

        //     // TODO event changed state

        // }
        investedAmount += msg.value;
        investorsAndRecommendersNumber++;
        // lenders[msg.sender] = true;
        // lendersInvestedAmount[msg.sender] = lendersInvestedAmount[msg.sender].add(msg.value.sub(extraMoney));

        // // TODO event invested amount
    }

    // TODO recheck this function
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

            emit LogBorrowerRepaymentFinished(msg.sender, block.timestamp);

            state = State.interestReturns;

            // TODO event credit state changed
        }
    }

    // TODO recheck and rewrite this function
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
