var DynamicCollateralLending = artifacts.require("./DynamicCollateralLending.sol");

module.exports = function(deployer) {
  deployer.deploy(DynamicCollateralLending);
};
