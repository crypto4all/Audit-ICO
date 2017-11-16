const fs = require('fs')
const Web3 = require('web3')
const web3 = new Web3(network().node)
const Tx = require('ethereumjs-tx')

const kycOracleAbi = JSON.parse(fs.readFileSync("data/oracle_abi.json"))
const ICOs = JSON.parse(fs.readFileSync(network().fileName))

function network() {
  if(process.env.ORACLE_PRODUCTION === "true") {
    return {
      node: 'https://mainnet.infura.io/viGpu2dVHG4y96rGG40h',
      chainId: 1,
      fileName: 'data/ico_config.json'
    }
  } else {
    return {
      node: 'https://ropsten.infura.io/viGpu2dVHG4y96rGG40h',
      chainId: 3,
      fileName: 'data/ico_config_dev.json'
    }
  }
}

function blockNumber() {
  return web3.eth.getBlockNumber().then(blocknumber => {
    return {
      status: 'up',
      blockHeight: blocknumber
    }
  })
}

function contractFromAddress(address) {
  return new web3.eth.Contract(kycOracleAbi, address)
}

function kycClearAddress(currentIco, address, onTxHash) {
  return web3.eth.getTransactionCount(currentIco.oracleAddress).then(txCount => {
    return new Tx({
      nonce: web3.utils.toHex(txCount),
      gasPrice: web3.utils.toHex("21000000000"),
      gasLimit: web3.utils.toHex("150000"),
      to: currentIco.smartContractAddress,
      from: currentIco.oracleAddress,
      value: web3.utils.toHex("0"),
      data: contractFromAddress(currentIco.smartContractAddress).methods.clearKyc(address).encodeABI()
    })
  }).then(tx => {
    var privateKey = Buffer.from(currentIco.oraclePrivateKey, 'hex')
    tx.sign(privateKey)
    return '0x'.concat(tx.serialize().toString('hex'))
  }).then(signedTx => {
    web3.eth.sendSignedTransaction(signedTx)
      .on('transactionHash', onTxHash)
      .on('receipt', receipt => { console.log({event: "receipt_available", receipt: receipt}) } )
      .on('error', error => { console.error({event: "tx_failed", error: error}) } )
  })
}

function listPaymentForAddress(currentIco, address) {
  return contractFromAddress(currentIco.smartContractAddress)
    .getPastEvents('kycAddressDeposited', {
      filter: { "_clearedAddress": address },
      fromBlock: currentIco.contractBlockHeight,
      toBlock: 'latest'
    }).then(events => {
      return events.map(event => {
        return {
          transactionHash: event.transactionHash,
          sender: event.returnValues[0],
          value: web3.utils.fromWei(event.returnValues[1], 'ether'),
          timestamp: parseInt(event.returnValues[2])
        }
      })
    })
}

module.exports = {
  blockNumber,
  listPaymentForAddress,
  kycClearAddress,
  ICOs,
  isAddress: web3.utils.isAddress,
  nodeUrl: network().node
}
