pragma solidity ^0.4.18;

contract kycOracle {
    address oracleAddress;
    mapping (address => bool) kycClearances;
    event kycCleared(
    address indexed _clearedAddress,
    uint clearanceTimestamp
    );
    event kycAddressDeposited(
    address indexed _clearedAddress,
    uint depositValue,
    uint depositTimestamp
    );

    modifier onlyKycCleared {
        require(kycClearances[msg.sender]);
        _;
    }

    function kycOracle(address _oracleAddress) internal{
        oracleAddress = _oracleAddress;
    }
    /*
     Remix warning msg
     browser/oracle_interface.sol:26:33: use of "block.timestamp": "block.timestamp"
     can be influenced by miners to a certain degree.
     That means that a miner can "choose" the block.timestamp, to a certain degree,
     to change the outcome of a transaction in the mined block.
    */
    function clearKyc(address _clearedAddress) public {
        require(msg.sender == oracleAddress);
        kycCleared(_clearedAddress, block.timestamp);
        kycClearances[_clearedAddress] = true;
    }
}
