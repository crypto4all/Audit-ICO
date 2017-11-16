const CryptoJS = require("crypto-js")

module.exports = function(params) {
  const expectedHash = CryptoJS.HmacSHA512(
    params.expectedSignature,
    params.secret
  ).toString()

  return params.sentSignature === expectedHash
}
