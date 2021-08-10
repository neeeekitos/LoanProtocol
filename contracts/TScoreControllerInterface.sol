pragma solidity ^0.8.0;

import "./User.sol";

interface TScoreControllerInterface {

    function updateSocialRecommendationScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external returns (uint);
    function updateProfileScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external returns (uint);
    function updateActivityScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external returns (uint);
    function updateLoanRiskScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external returns (uint);

    function updateTScore(address _loanAddr, address _userAddr, uint _recommenderWeight, uint _givenScore) external returns (uint);
    function getTScore(address _userAddr) external returns (uint);
}
