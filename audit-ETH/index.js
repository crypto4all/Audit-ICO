// ExpressJS Init
const express = require('express')
const app = express()
// Custom libs
const checkSignature = require('./lib/check_signature')
const ethNetwork = require('./lib/eth_network')
// ICO Configurations loading init
const ICOs = ethNetwork.ICOs

// Status page (checks ethereum connectivity)
app.get('/', (req, res) => {
  ethNetwork.blockNumber().then(
    (message) => { res.send(message) },
    (error) => { res.status(500).send({error: "offline"}) }
  )
})

// Clearing an address (kyc's good)
app.post('/:ico_name/clear_address/:ethereum_address', (req, res) => {
  const currentIco = ICOs[req.params.ico_name]
  const clearedAddress = req.params.ethereum_address

  if(!currentIco) {
    return res.status(404).send({error: "ico_not_found"})
  }

  if(!ethNetwork.isAddress(clearedAddress)) {
      return res.status(400).send({error: "ethereum_address_malformed"})
  }

  const identifier = req.get('X-Identifier')
  const sentSignature = req.get('X-Signature')

  if(!(identifier && sentSignature)) {
    return res.status(400).send({error: "missing_headers"})
  }

  const secret = currentIco.secrets[identifier]

  if(!secret) {
    return res.status(403).send({error: "unknown_identifier"})
  }

  const authenticatedRequest = checkSignature({
    secret,
    sentSignature,
    expectedSignature: 'clear_address|' + req.params.ico_name + '|' + clearedAddress,
  })

  if(!authenticatedRequest) {
    return res.status(401).send({error: "bad_auth"})
  }

  ethNetwork.kycClearAddress(currentIco, clearedAddress, txHash => {
    console.log({event: "transaction_submitted", txHash: txHash})

    res.status(202).send({
      error: 'none',
      hash: txHash
    })
  })
})

// Listing transaction made by an address
app.get('/:ico_name/get_transactions/:ethereum_address', (req, res) => {
  const currentIco = ICOs[req.params.ico_name]
  const clearedAddress = req.params.ethereum_address

  if(!currentIco) {
    return res.status(404).send({error: "ico_not_found"})
  }

  if(!ethNetwork.isAddress(clearedAddress)) {
      return res.status(400).send({error: "ethereum_address_malformed"})
  }

  const identifier = req.get('X-Identifier')
  const sentSignature = req.get('X-Signature')

  if(!(identifier && sentSignature)) {
    return res.status(400).send({error: "missing_headers"})
  }

  const secret = currentIco.secrets[identifier]

  if(!secret) {
    return res.status(403).send({error: "unknown_identifier"})
  }

  const authenticatedRequest = checkSignature({
    secret,
    sentSignature,
    expectedSignature: 'get_transactions|' + req.params.ico_name + '|' + clearedAddress,
  })

  if(!authenticatedRequest) {
    return res.status(401).send({error: "bad_auth"})
  }

  ethNetwork.listPaymentForAddress(currentIco, clearedAddress).then(
    events => { res.send({error: 'none', events: events}) },
    error => {
      console.error({event: "listing_failed", error: error})
      res.status(500).send({error: "unknown_error"})
    }
  )
})

app.listen(process.env.PORT || 8080, () => {
  console.log({event: "system_up", nodeUrl: ethNetwork.nodeUrl})
})
