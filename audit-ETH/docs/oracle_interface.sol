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

  function kycOracle(address _oracleAddress) internal {
    oracleAddress = _oracleAddress;
  }

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

contract myTokenContract is kycOracle {
  address owner;

  function myTokenContract() kycOracle(0x18AEf80Dc69E9dAC454E2383A10FF37F969bc945) internal {
    owner = msg.sender;
  }

  function() public onlyKycCleared payable {
    // Token distribution logic
    kycAddressDeposited(msg.sender, msg.value, block.timestamp);
  }
}
