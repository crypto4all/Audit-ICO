pragma solidity ^0.4.17;

import './kycOracle.sol';

contract myTokenContract is kycOracle{
    address owner;
    // kycOracle n'est pas un modifier, je suis pas sûre que ça passera lors des tests
    // Il faut prévoir de modifier kycOracle en tant que "modifier" et là un tel appel sera bon
    // Sinon, initialiser l'adresse de l'oracle directement dans le constructeur myTokenContract()
    // En ajoutant la ligne suivante : oracleAddress =  0x18AEf80Dc69E9dAC454E2383A10FF37F969bc945; après owner = msg.sender;
    // On peut virer internal à mon avis car c'est un constructeur donc il est par défaut internal !!

    function myTokenContract(address _oracleAddress){
        owner = msg.sender;
        oracleAddress = _oracleAddress;
        /*
        Je préfère la première version avec l'@ en param
        oracleAddress = 0x18AEf80Dc69E9dAC454E2383A10FF37F969bc945
        */
    }

    function() payable  onlyKycCleared{
        // Token distribution logic
        kycAddressDeposited(msg.sender, msg.value, block.timestamp);
    }
}
