pragma solidity ^0.4.18;
import './kycOracle.sol'

contract myTokenContract is kycOracle{
    address owner;
    function myTokenContract(address _oracleAddress){
        owner = msg.sender;
        oracleAddress = _oracleAddress;
    }

    function() payable  onlyKycCleared{
        // Token distribution logic
        kycAddressDeposited(msg.sender, msg.value, block.timestamp);
    }
}
