// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ExponentialNoError.sol";

contract User is ExponentialNoError {

    struct TScore {
        Exp profileScore;
        Exp activityScore;
        Exp socialRecommendationScore;
        Exp loanRiskScore;
        uint totalScore;
    }

    bool public fraudStatus;
    address public activeLoan;
    address public activeSupply;
    address public orbitDbIndexHash;

    TScore public tScore;

    function setActiveLoan(address _loanAddr) external {
        activeLoan = _loanAddr;
    }

    function setActiveSupply(address _supplyAddr) external {
        activeSupply = _supplyAddr;
    }

    function setOrbitDbIndexHash(address _orbitHash) external {
        orbitDbIndexHash = _orbitHash;
    }

    function setSocialRecommendationScore(Exp memory socialScore) external {
        tScore.socialRecommendationScore = socialScore;

        // temporary
        tScore.totalScore = truncate(socialScore);
    }

    function getTScore() public view returns (uint) {
        return tScore.totalScore;
    }
}
