pragma solidity ^0.8.0;

import "./TScoreControllerInterface.sol";
import "./User.sol";
import "./Loan.sol";

contract TScoreController is TScoreControllerInterface, ExponentialNoError {

    // only admin contract can call controller's functions
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function updateSocialRecommendationScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external override returns (uint) {

        User user = User(_userAddr);
        Loan loan = Loan(_loanAddr);

        Exp memory weightedScore = Exp({mantissa: 0});

        Exp[] memory weights;
        uint8[] memory scores;

        (weights, scores) = loan.getRecommendersWeightsAndValues();
        for (uint i = 0; i < weights.length; i++) {
            weightedScore = add_(mul_(weights[i], scores[i]), weightedScore);
        }

        user.setSocialRecommendationScore(weightedScore);

        return user.getTScore();
    }

    function updateActivityScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external override returns (uint) {
        User user = User(_userAddr);

        return user.getTScore();
    }

    function updateProfileScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore)  external override returns (uint) {
        User user = User(_userAddr);

        return user.getTScore();
    }

    function updateLoanRiskScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external override returns (uint) {
        User user = User(_userAddr);

        return user.getTScore();
    }

    function updateTScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external override returns (uint) {
        User user = User(_userAddr);

        return user.getTScore();
    }

    function getTScore(address _userAddr) external view override returns (uint) {
        User user = User(_userAddr);

        return user.getTScore();
    }
}
