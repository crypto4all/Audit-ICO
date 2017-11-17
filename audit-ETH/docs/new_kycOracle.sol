pragma solidity ^0.4.18;

contract kycOracle {
    address public oracleAddress;
    mapping (address => bool) public kycClearances;

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
  
    function clearKyc(address _clearedAddress) public {
        require(msg.sender == oracleAddress);
        kycCleared(_clearedAddress, block.timestamp);
        kycClearances[_clearedAddress] = true;
    }
}
