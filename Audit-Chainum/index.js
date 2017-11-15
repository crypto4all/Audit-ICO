const bitcoin = require('bitcoinjs-lib')

const express = require('express')
const bodyParser = require('body-parser')

const btcNetwork = require('./lib/btc_network')
const db = require('./lib/database')
const checkSignature = require('./lib/check_signature')

const fs = require('fs')

function getSecrets() {
  if(btcNetwork.isProduction) {
    return JSON.parse(fs.readFileSync('./data/secrets.json'))
  } else {
    return JSON.parse(fs.readFileSync('./data/secrets_dev.json'))
  }
}
const secrets = getSecrets()

const app = express()
app.use(bodyParser.json())

app.post('/users', function (req, res) {
  const identifier = req.get('X-Identifier')
  const sentSignature = req.get('X-Signature')

  if(!(identifier && sentSignature)) {
    return res.status(400).send({error: "missing_headers"})
  }

  const secret = secrets[identifier]

  if(!secret) {
    return res.status(403).send({error: "unknown_identifier"})
  }

  const authenticatedRequest = checkSignature({
    secret,
    sentSignature,
    expectedSignature: [
      'add_user',
      req.body.user.icoName,
      req.body.user.email,
      req.body.user.tokenAddress
    ].join('|'),
  })

  if(!authenticatedRequest) {
    return res.status(401).send({error: "bad_auth"})
  }

  const keyPair = btcNetwork.generateKeyPair()
  req.body.user['paymentAddress'] = keyPair.address
  req.body.user['paymentAddressWif'] = keyPair.wif

  db.createUser(req.body.user).then(
    user  => { res.status(201).send(user) },
    error => { res.status(400).send({"error": error}) }
  )
})

app.get('/users/:id', function (req, res) {
  const identifier = req.get('X-Identifier')
  const sentSignature = req.get('X-Signature')

  if(!(identifier && sentSignature)) {
    return res.status(400).send({error: "missing_headers"})
  }

  const secret = secrets[identifier]

  if(!secret) {
    return res.status(403).send({error: "unknown_identifier"})
  }

  const authenticatedRequest = checkSignature({
    secret,
    sentSignature,
    expectedSignature: [
      'get_user',
      req.params.id
    ].join('|'),
  })

  if(!authenticatedRequest) {
    return res.status(401).send({error: "bad_auth"})
  }

  db.getUser(req.params.id).then(user => {
    if(user) {
      res.send({
        id: user.id,
        email: user.email,
        icoName: user.iconame,
        paymentAddress: user.paymentaddress,
        tokenAddress: user.tokenaddress,
        refundAddress: user.refundaddress
      })
    } else {
      res.status(404).send({"error": "not_found"})
    }
  }, error => {
    res.status(404).send({"error": "not_found"})
  })
})

app.get('/users/:id/payments', function (req, res) {
  const identifier = req.get('X-Identifier')
  const sentSignature = req.get('X-Signature')

  if(!(identifier && sentSignature)) {
    return res.status(400).send({error: "missing_headers"})
  }

  const secret = secrets[identifier]

  if(!secret) {
    return res.status(403).send({error: "unknown_identifier"})
  }

  const authenticatedRequest = checkSignature({
    secret,
    sentSignature,
    expectedSignature: [
      'get_user_payments',
      req.params.id
    ].join('|'),
  })

  if(!authenticatedRequest) {
    return res.status(401).send({error: "bad_auth"})
  }

  db.getPaymentsForUser(req.params.id).then(
    payments => {
      res.send(payments.map(payment=>{
        return {
          id: payment.id,
          paymentAddress: payment.paymentaddress,
          txHash: payment.txhash,
          txOuputN: payment.txoutputn,
          value: payment.value
        }
      }))
    },
    error    => { res.status(404).send({"error": "not_found"}) }
  )
})

app.listen(process.env.PORT || 8080, () => {
  console.log({event: "system_up"})
})
