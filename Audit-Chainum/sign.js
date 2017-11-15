const CryptoJS = require("crypto-js")
var secret = "nNb6XM185tn7t8bnigwcTN6szRnboSK4jVNm2BBfkjSeeZ1fGlgjeRQdks62";

var message = [
  'payments',
  '4fd3c286-0dd6-4ae3-bd90-25a1dc39f956'
].join('|')

console.log(CryptoJS.HmacSHA512(message,secret).toString())
