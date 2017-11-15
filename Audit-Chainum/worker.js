const btcNetwork = require('./lib/btc_network')
const db = require('./lib/database')
const fs = require('fs')

function fileName() {
  if(btcNetwork.isProduction) {
    return './data/ico_config.json'
  } else {
    return  './data/ico_config_dev.json'
  }
}

const ICOs = JSON.parse(fs.readFileSync(fileName()))

ICOs.forEach(ico => {
  db.getAddressToCheck(ico.name).then(rows => {
    return Promise.all(
      rows.map( row => { return btcNetwork.listUnspent(row.paymentaddress) } )
    )
  }).then(ico_payments => {
    const payments = ico_payments.reduce(function(a, b) { return a.concat(b) })
    return Promise.all(payments.map(payment => {
      return db.createPayment({
        txHash: payment.hash,
        txOutputN: payment.index,
        value: payment.value,
        paymentAddress: payment.address
      })
    }))
  }).then(() => {
    return db.getUnhandledPaymentsForICO(ico.name)
  }).then(payments => {
    return Promise.all(
      payments.map(payment => {db.markPaymentAsHandled(payment)})
    ).then(() => {
      return btcNetwork.createTransaction(payments, ico.btcSequestre)
    })
  }).then(tx => {
    if(btcNetwork.isProduction) {
      btcNetwork.pushTx(tx)
    } else {
      console.log(tx)
    }
  })
})
