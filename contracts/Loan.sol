pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Exponential.sol";

contract Loan is Exponential {

    using SafeMath for uint;

    /** Parameters to define
     */

    // Time interval of expiration (in seconds) : 1 day = 86400s
    uint constant loanExpirationInterval = 86400;

    /** Part of the interest rate for the investors
     * the remaining part is for the recommenders
     * (interest for recommenders = 100000000000000000000 - interestPartInvestor)
     *
     * if we wanted to store the 34.7, mantissa would store 34.7e18.
     * To have more info check Exponential.sol contract
     */
    Exp interestPartInvestor = Exp({mantissa: 34700000000000000000});

    // Loan interest
    Exp interest = Exp({mantissa: 6700000000000000000}); // 6,7%

    address borrower;

    // Requested amount for a loan
    uint requestedAmount;

    // Amount to be returned by the borrower (with an interest)
    uint repaymentsCount;

    // The money is sent to the user only when the loan is started
    bool active;

    uint returnAmount;
    uint loanCreationDate;
    uint lastRepaymentDate;
    uint remainingPayments;
    uint repaymentInstallment;
    uint repaidAmount;
    uint collateralFactor;

    mapping(address => bool) public lenders;
    mapping(address => bool) public recommenders;


    mapping(address => uint) investedAmountByAddress;

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
        require(investedAmountByAddress[msg.sender] > 0);
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

    constructor (address _borrower, uint _requestedAmount, uint _repaymentsCount, uint _interest) public {
        borrower = _borrower;
        requestedAmount = _requestedAmount;
        repaymentsCount = _repaymentsCount;

        // Calculate the amount to return by the borrower
        returnAmount = mul_ScalarTruncateAddUInt(interest, _requestedAmount, _requestedAmount);

        loanCreationDate = block.timestamp;

        // Loan can onlu start when sufficient funds are invested
        active = false;

        uint lastRepaymentDate = 0;
        uint remainingPayments = _requestedAmount;
        uint repaymentInstallment = remainingPayments.div(_repaymentsCount);
        uint repaidAmount = 0;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /** @dev Trustworthiness score calculation function
      * Calculates trustworthiness score based on
      * borrower's attributes
      */
    function requestTScore() public view returns (uint) {
        // TODO place a magic formula here...
        return 0;
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

        // lenders[msg.sender] = true;
        // investedAmountByAddress[msg.sender] = investedAmountByAddress[msg.sender].add(msg.value.sub(extraMoney));

        // // TODO event invested amount
    }

    // TODO recheck this function
    /** @dev Invest function.
      * Provides functionality for person to invest in someone's project,
      * incentivized by the return of interest.
      */
    // TODO add canInvest modifier
    function recommend() public  payable {

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

        // lenders[msg.sender] = true;
        // investedAmountByAddress[msg.sender] = investedAmountByAddress[msg.sender].add(msg.value.sub(extraMoney));

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

    /** @dev Interest calculation function for Investors and Recommenders
     * It can be executed even if the loan is not active yet, in
     * this case it will give an approximative APY.
     */
    function getInterestRate() public view returns (Exp memory, Exp memory) {

        Exp memory investorInterest;
        Exp memory recommenderInterest;
        MathError mathErr;

        (mathErr, investorInterest) = mulExp(interestPartInvestor, interest);
        investorInterest = div_(investorInterest, 100);
        (mathErr, recommenderInterest) = subExp(interest, investorInterest);

        return (investorInterest, recommenderInterest);
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
        //        uint lenderReturnAmount = investedAmountByAddress[msg.sender].mul(returnAmount.div(lendersCount).div(investedAmountByAddress[msg.sender]));
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

    /** @dev Change state function.
      * @param _state New state.
      * Only accessible to the owner of the contract.
      * Changes the state of the contract.
      */
    function changeState(State _state) external onlyBorrower {
        state = _state;

        // Log state change.
        // LogCreditStateChanged(state, block.timestamp);
    }
}
