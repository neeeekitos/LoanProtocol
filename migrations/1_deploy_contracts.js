var DynamicCollateralLending = artifacts.require("./LoanController.sol");

module.exports = function(deployer) {
  deployer.deploy(DynamicCollateralLending);
};
