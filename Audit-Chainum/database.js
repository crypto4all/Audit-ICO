const { Pool, Client } = require('pg')
const devPGUrl = 'postgresql://postgres:postgres@localhost:5432/btcpaybot'
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || devPGUrl,
})

function createUser(data) {
  return pool.query(
    `INSERT INTO users(email, icoName, paymentAddress, paymentAddressWif, tokenAddress, refundAddress)
     VALUES($1, $2, $3, $4, $5, $6)
     RETURNING id, paymentAddress`,
    [data.email, data.icoName, data.paymentAddress,
      data.paymentAddressWif, data.tokenAddress, data.refundAddress]
  ).then( res => { return res.rows[0] } )
}

function getUser(uuid) {
  return pool.query(
    'SELECT * FROM users WHERE id = $1',
    [uuid]
  ).then( res => { return res.rows[0] } )
}

function getPaymentsForUser(uuid) {
  return pool.query(
    `SELECT p.* FROM payments AS p
     JOIN users u ON u.paymentAddress = p.paymentAddress
     WHERE u.id = $1`,
    [uuid]
  ).then( res => { return res.rows } )
}

function getAddressToCheck(icoName) {
  return pool.query(
    `SELECT * FROM users WHERE icoName = $1`,
    [icoName]
  ).then( res => { return res.rows } )
}

function createPayment(data) {
  return pool.query(
    `INSERT INTO payments(txHash, txOutputN, value, paymentAddress)
     VALUES($1, $2, $3, $4)
     RETURNING *`,
    [data.txHash, data.txOutputN, data.value, data.paymentAddress]
  ).then(
    res => { return res.rows[0] },
    err => { return undefined }
  )
}

function markPaymentAsHandled(payment) {
  return pool.query(
    `UPDATE payments SET handled = 't' WHERE id = $1`,
    [payment.id]
  ).then(res => { return res.rows[0] })
}

function getUnhandledPaymentsForICO(icoName) {
  return pool.query(
    `SELECT p.*, u.paymentAddressWif FROM payments AS p
     JOIN users u ON u.paymentAddress = p.paymentAddress
     WHERE p.handled = FALSE AND u.icoName = $1`,
    [icoName]
  ).then( res => { return res.rows } )
}

module.exports = {
  createUser,
  getUser,
  getPaymentsForUser,
  getAddressToCheck,
  createPayment,
  markPaymentAsHandled,
  getUnhandledPaymentsForICO
}
