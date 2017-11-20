pragma solidity ^0.4.17;

import './new_version_kycOracle.sol';

contract new_version_myTokenContract is new_version_kycOracle{
    address owner;

    function new_version_myTokenContract(address _oracleAddress){
        owner = msg.sender;
        oracleAddress = _oracleAddress;
    }

    function() payable  onlyKycCleared{
        // Token distribution logic
        kycAddressDeposited(msg.sender, msg.value, block.timestamp);
    }
}
