var oracle = artifacts.require("./new_version_kycOracle.sol");
var token = artifacts.require("./new_version_myTokenContract.sol");

module.exports = function(deployer, network){
	var owner = web3.eth.accounts[0];

	if (network = 'development') {
		return deployer.deploy(oracle, { from: owner }).then(function(){
            console.log("oracle address: " + oracle.address);
            return deployer.deploy(token, oracle.address).then(function(){
                console.log("token address: " + token.address);
            });
        });
	}
	if (network = 'ropsten') {
    	return deployer.deploy(oracle, { from: owner }).then(function(){
            console.log("oracle address: " + oracle.address);
    		return deployer.deploy(token, oracle.address).then(function(){
    		    console.log("token address: " + token.address);
    		});
        });
    }

};