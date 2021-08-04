pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DynamicCollateralLending.sol";

contract Loan {

    using SafeMath for uint;

    /** @dev Loan related infos
    *
    */
    address borrower;
    TScore tScore;
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
    uint collateral; // percentage of a requested amount
    uint constant loanExpirationInterval = 86400; // 1 DAY

    /** @dev Investors and Recommenders infos
    *
    */
    uint investorsAndRecommendersNumber;
    uint totalInvestedAmount;
    uint totalRecommendedAmount;

    mapping(address => bool) public lenders;
    mapping(address => bool) public recommenders;
    mapping(address => uint) investedOrRecommendedAmount;

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
    event LoanStateChanged(State indexed state, uint indexed timestamp);
    event LogCreditStateActiveChanged(bool indexed active, uint indexed timestamp);

    event LogBorrowerWithdrawal(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerRepaymentInstallment(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerRepaymentFinished(address indexed _address, uint indexed timestamp);
    event LogBorrowerChangeReturned(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogBorrowerIsFraud(address indexed _address, bool indexed fraudStatus, uint indexed timestamp);

    event Invested(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event Recommended(address indexed _address, uint indexed _amount, uint indexed timestamp);

    event LogLenderWithdrawal(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogRecommenderWithdrawal(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogLenderChangeReturned(address indexed _address, uint indexed _amount, uint indexed timestamp);
    event LogLenderVoteForRevoking(address indexed _address, uint indexed timestamp);
    event LogLenderVoteForFraud(address indexed _address, uint indexed timestamp);
    event ExtraAmountRefunded(address indexed _address, uint indexed _amount, uint indexed timestamp);

    /** @dev Modifiers
    *
    */

    // used for a withdraw function
    modifier isActive() {
        require(active == true);
        _;
    }

    // crowdfunding process cannot exceed an interval of expiration
    modifier notExpired() {
        require(block.timestamp - loanCreationDate < loanExpirationInterval);
        _;
    }

    // used for a withdraw function
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
        require(investedOrRecommendedAmount[msg.sender] > 0);
        _;
    }

    modifier canInvest() {
        require(state == State.investment);
        _;
    }

    modifier canRecommend() {
        require(state == State.investment && collateral > 0);
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

    constructor (
        address _borrower,
        uint _requestedAmount,
        uint _repaymentsCount,
        uint _interest,
        uint _loanCreationDate,
        TScore storage _tScore
    ) public {

        borrower = _borrower;
        requestedAmount = _requestedAmount;
        repaymentsCount = _repaymentsCount;
        interest =  _interest;
        loanCreationDate = _loanCreationDate;

        // Calculate the amount to return by the borrower
        returnAmount = requestedAmount.add(interest);

        // Loan can only start when sufficient funds are invested

        uint lastRepaymentDate = 0;
        collateral = 2;
        investorsAndRecommendersNumber = 0;
        uint remainingPayments = _requestedAmount;
        /*uint repaymentInstallment = remainingPayments.div(_repaymentsCount);*/
        uint repaidAmount = 0;
        tScore = _tScore;

        // 1 state of a loan
        state = State.investment;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getProjectInfos() public view returns (uint256, uint256) {
        return (interest, requestedAmount);
    }

    function getInfosForBorrower() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return (requestedAmount, interest, repaymentsCount, investorsAndRecommendersNumber, collateral, totalInvestedAmount);
    }

    // TODO recheck this function
    /** @dev Trustworthiness score calculation function
      * Calculates trustworthiness score based on
      * borrower's attributes
      */
    function requestTScore() public view returns (uint) {
        return tScore;
    }

    /** @dev Recommend function.
      * Provides functionality for person to recommend someone's project,
      * incentivized by the return of interest.
      */
    function recommend() public canRecommend payable {

        totalRecommendedAmount += msg.value;
        investorsAndRecommendersNumber++;
        recommenders[msg.sender] = true;
        investedOrRecommendedAmount[msg.sender] = investedOrRecommendedAmount[msg.sender];

        emit Recommended(msg.sender, msg.value.sub(extraMoney), block.timestamp);

    }

    /** @dev Invest function.
      * Provides functionality for person to invest in someone's project,
      * incentivized by the return of interest.
      */
    function lend() public canInvest payable {

        uint extraMoney = 0;

        if (address(this).balance >= requestedAmount) {
             extraMoney = address(this).balance.sub(requestedAmount);
             assert(requestedAmount == address(this).balance.sub(extraMoney));

             // Assert that there is no overflow / underflow
             assert(extraMoney <= msg.value);

             if (extraMoney > 0) {
                 // return extra money to the sender
                 payable(msg.sender).transfer(extraMoney);
                 emit ExtraAmountRefunded(msg.sender, extraMoney, block.timestamp);

                 state = State.repayment;
                 emit LoanStateChanged(state, block.timestamp);

             }
        }

        totalInvestedAmount += msg.value;
        investorsAndRecommendersNumber++;
        lenders[msg.sender] = true;
        investedOrRecommendedAmount[msg.sender] = investedOrRecommendedAmount[msg.sender].add(msg.value.sub(extraMoney));

        emit Invested(msg.sender, msg.value.sub(extraMoney), block.timestamp);

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
        emit LoanStateChanged(state, block.timestamp);

        // Log borrower withdrawal.
        emit LogBorrowerWithdrawal(msg.sender, address(this).balance, block.timestamp);

        // Transfer the gathered amount to the loan borrower.
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
            emit LoanStateChanged(state, block.timestamp);
        }
    }
}
