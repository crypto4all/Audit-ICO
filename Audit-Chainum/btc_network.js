const bitcoin = require('bitcoinjs-lib')
const blocktrail = require('blocktrail-sdk')

const https = require('https')
const request = require('request')

const isProduction = (process.env.BOT_PRODUCTION === "true")
const currentNetwork = isProduction ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

const client = blocktrail.BlocktrailSDK({
  apiKey: "7c6ecb4a52b46b1be8c22340781ce6a35c3da587",
  apiSecret: "4952d7b01692892f4b0b960585f50a5d729381e8",
  network: "BTC",
  testnet: !isProduction
})

function generateKeyPair() {
  const keypair = bitcoin.ECPair.makeRandom({network: currentNetwork})
  return {
    wif: keypair.toWIF(),
    address: keypair.getAddress()
  }
}

function listUnspent(address, callback) {
  return new Promise((resolve, reject) => {
    client.addressUnspentOutputs(address, function(err, address_utxo) {
      if(!err) {
        resolve(address_utxo['data'])
      } else {
        reject(err)
      }
    })
  })
}

function getOptimalFee() {
  return new Promise((resolve, reject) => {
    client.feePerKB(function(err, result) {
      resolve(result)
    })
  })
}

function approxSize(nbIn) {
  return (nbIn * 150) + 50 + (nbIn*2)
}

function createTransaction(paymentList, sequestre) {
  return getOptimalFee().then(optimalFee => {
    const tx = new bitcoin.TransactionBuilder(currentNetwork)

    let totalValue = 0

    // Adding inputs
    paymentList.forEach(payment => {
      tx.addInput(payment.txhash, parseInt(payment.txoutputn))
      totalValue += parseInt(payment.value)
    })

    // Adding output
    const fees = Math.trunc(approxSize(paymentList.length) * (optimalFee.optimal / 1024))
    tx.addOutput(sequestre, totalValue - fees)

    // Signing inputs
    let currentIndex = 0
    paymentList.forEach(payment => {
      let keyPair = bitcoin.ECPair.fromWIF(payment.paymentaddresswif, currentNetwork)
      tx.sign(currentIndex++, keyPair)
    })

    // Return transaction
    return tx.build().toHex()
  })
}

function pushTx(rawTx) {
  if(isProduction) {
    request.post('https://blockchain.info/pushtx?cors=true').form({tx:rawTx})
  } else {
    request.post('https://testnet.blockexplorer.com/api/tx/send').form({rawTx:rawTx})
  }
}

module.exports = {
  generateKeyPair,
  listUnspent,
  createTransaction,
  isProduction,
  pushTx
}
