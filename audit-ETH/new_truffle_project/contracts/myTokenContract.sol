pragma solidity ^0.4.18;

import './kycOracle.sol';

contract myTokenContract is kycOracle {
    address owner;

    // kycOracle n'est pas un modifier, c'est une fonction
    // Il initialiser l'adresse de l'oracle directement dans le constructeur myTokenContract()
    // ma proposition
    /*
    function myTokenContract() internal {
        owner = msg.sender;
        kycOracle(0x18AEf80Dc69E9dAC454E2383A10FF37F969bc945);
    }
    */

    function myTokenContract() kycOracle(0x18AEf80Dc69E9dAC454E2383A10FF37F969bc945) internal {
        owner = msg.sender;
    }

    function() public onlyKycCleared payable {
        // Token distribution logic
        kycAddressDeposited(msg.sender, msg.value, block.timestamp);
    }
}
