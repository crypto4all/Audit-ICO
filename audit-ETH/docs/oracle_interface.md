# KYC Oracle Interface
*How to bring KYC intelligence into smart contracts*

## Big picture

When a user wants to deposit Ethers to the smart contract to get involved into the ICO, it must clear its KYC status before. If he tries to deposit Ethers without being cleared, the transaction will be rejected by the smart-contract. KYC is a "real-world" problematic, but rejecting payments is a "blockchain-world" problematic. To create a bridge between the "real-world" and the "blockchain-world", we must create an oracle.

## Oracle implementation, real-world side

When the KYC is cleared by KYC3, the registering module on the website must call the oracle to inform it that this address must be cleared. The oracle is responsible for transmitting the information on the ethereum chain.

### Security

When calling the API (the root is not protected), two HTTP headers must be set :

 - `X-Identifier` : The `identifier` of the user (to search the shared secret)
 - `X-Signature` : The payload message (see blow) hashed with HMAC-SHA512

### GET `/`

Returns the current status of the API.

#### Normal case

HTTP Status Code `200`, with body:

```
{
  status: 'up',
  blockHeight: blocknumber
}
```

`blocknumber` is the current blockchain height as a proof of the synchronization.

#### API/Oracle Down case

HTTP Status Code `500`, with body: `{error: "offline"}`.

### POST `/:ico_name/clear_address/:ethereum_address`

Payload message to hash (`X-Signature`) : `clear_address|ico_name|ethereum_address`.

For instance; if we have a share secret which is `my_shared_secret` and we want to execute the method `clear_address` with the following parameters :

 - `ico_name => mySuperIco`
 - `ethereum_address => 0x61216840Ee6BC674D1f618adfE3039691A58cA81`

The signature message to hash would be :

`clear_address|mySuperIco|0x61216840Ee6BC674D1f618adfE3039691A58cA81`

PHP sample :

```
$message = "clear_address|mySuperIco|0x61216840Ee6BC674D1f618adfE3039691A58cA81";
$signature = hash_hmac("sha512", $message, "my_shared_secret");
echo $signature; // 42a497ead981075f37ff5c8409534be7595af55093fc467bf1b2843e765ed6306d715c66312bc5d0c9f201d3316beef43ae5c821c91627f2935497d2ee9374d1
```

#### Return codes

 - HTTP Status `202`, body: `{error: "none", hash: "0x01234..."}` => The transaction have been execute (hash is the transaction hash on the ethereum Blockchain).
 - HTTP Status `403`, body: `{error: "bad_auth"}` => The signature is incorrect.
 - HTTP Status `404`, body: `{error: "ico_not_found"}` => The ICO is not known by the Oracle.
 - HTTP Status `400`, body: `{error: "ethereum_address_malformed"}` => The Ethereum address is malformed.

### GET `/:ico_name/get_transactions/:ethereum_address`

Payload message to hash (`X-Signature`) : `get_transactions|ico_name|ethereum_address`.

For instance; if we have a share secret which is `my_shared_secret` and we want to execute the method `clear_address` with the following parameters :

 - `ico_name => mySuperIco`
 - `ethereum_address => 0x61216840Ee6BC674D1f618adfE3039691A58cA81`

The signature message to hash would be :

`get_transactions|mySuperIco|0x61216840Ee6BC674D1f618adfE3039691A58cA81`

PHP sample  :

```
$message = "get_transactions|mySuperIco|0x61216840Ee6BC674D1f618adfE3039691A58cA81";
$signature = hash_hmac("sha512", $message, "my_shared_secret");
echo $signature; // 68c6225394c4f64675f60a93c8d22f6ff155bb9c22a48541db63500a5c9f2a2863268cbf91d4bd0ba09829555cba953062d94fe09a092dfae2c4d42e25ad243e
```

#### Return codes

HTTP Status `200` with the following body :

```
{
  error: 'none',
  events: [
    {
      "transactionHash": "0x12345....",
      "sender": "0x61216840Ee6BC674D1f618adfE3039691A58cA81",
      "value": "1.465", // In Ether and as a string to avoid precision pitfall
      "timestamp": 1509442836
    }
  ]
}
```

##### Error return records

 - HTTP Status `403`, body: `{error: "bad_auth"}` => The signature is incorrect.
 - HTTP Status `404`, body: `{error: "ico_not_found"}` => The ICO is not known by the Oracle.
 - HTTP Status `400`, body: `{error: "ethereum_address_malformed"}` => The Ethereum address is malformed.

## Oracle implementation, contract-world side

On the smart-contract side, the contract must inherit from the following contract :

```
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

  function kycOracleInterface(address _oracleAddress) {
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
```

When a request come from the real-world (KYC Cleared Request) the function `clearKyc(address)` (function hash : `0x9cc43a7d`, estimated gas: `20825`) is called with the first parameter of the ethereum address to be cleared.

When a deposit is made on the token contract, we must add the `onlyKycCleared` function modifier on the `payable` function of the token contract. We also must set the contract constructor to pass the oracle address :

```
contract myTokenContract is kycOracle {
  function myTokenContract(address _oracleAddress) kycOracle(_oracleAddress) {
    // Token contract construction logic
  }

  function() onlyKycCleared payable {
    kycAddressDeposited(msg.sender, msg.value, block.timestamp);
    // Token distribution logic
  }
}
```
