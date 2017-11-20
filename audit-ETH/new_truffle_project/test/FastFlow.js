var kyc = artifacts.require("./new_version_kycOracle.sol");
var token = artifacts.require("./new_version_myTokenContract.sol");

contract('FastFlow', function(accounts) {

  var eth = web3.eth;
  var owner = eth.accounts[0];
  var account_2 = eth.accounts[1];


  it("Should display the oracle address", function() {
  return kyc.deployed().then(function(oracle){
    return token.deployed().then(function(coin) {
      coin.oracleAddress().then(function (adr) {
      console.log("Oracle address" + adr);
      assert.equal(adr, oracle.address, "not the same address");
    });
  });
  });
  });

  it("token deposit", function() {
  return kyc.deployed().then(function(oracle){
    return token.deployed().then(function(coins) {
       return coins.sendTransaction({from: owner, to: account_2, value: 0}).then(function(txn) {
          console.log("OK");
       });
  });
    var kycAddressDeposited = coins.kycAddressDeposited();
        kycAddressDeposited.watch(function(err, result) {
            if (err) {
                console.log("Error event ", err);
                return;
            }
            console.log("kycAddressDeposited event = ",result.args.addr,result.args.value);
        });
    });
  });

});