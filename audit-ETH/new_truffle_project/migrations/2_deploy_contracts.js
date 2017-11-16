var oracle = artifacts.require("./kycOracle.sol");
var token = artifacts.require("./myTokenContract.sol");

module.exports = function(deployer, network){

	if (network = 'development') {
		deployer.deploy(oracle);
		deployer.deploy(token);
	}
	if (network = 'ropsten') {
    		deployer.deploy(oracle);
    		deployer.deploy(token);
    }

};