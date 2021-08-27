/* eslint-disable comma-dangle */
const CID = require('cids')
const { ethers } = require('ethers')

const cid = new CID(
  'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
)
console.log(cid)

const cidToHexString = cid.toString('base16')
console.log(cidToHexString)

// goes in Solidity
const hexStringToBigInt = BigInt('0x' + cidToHexString, 16)
console.log(hexStringToBigInt)
// ----------------

const bigIntToHexString = hexStringToBigInt.toString(16)
console.log(bigIntToHexString)

const hexStringToCid = new CID(bigIntToHexString).toString('base32')
console.log(hexStringToCid)

const partitionning = (hexCID) => {
  const demiLength = Math.floor(hexCID.length / 2)
  const partinionnedCID = [
    hexCID.slice(0, demiLength + 1),
    hexCID.slice(-demiLength),
  ]
  console.log(partinionnedCID)
  const tab1 = partinionnedCID.map((demi) => {
    return '0x' + demi
  })
  console.log(tab1)

  const tab2 = tab1.map((demi) => {
    return BigInt(demi, 16)
  })
  console.log(tab2)
}

partitionning(
  'f01701220c3c4733ec8affd06cf9e9ff50ffc6bcd2ec85a6170004bb709669c31de94391a'
)

// string to bytes
const str = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
console.log(str.length)
const nb = Math.floor(str.length / 2)
const tab1 = [str.slice(0, nb + 1), str.slice(-nb)]
console.log(tab1)
const tab2 = tab1.map((demi) => {
  console.log(demi)
  console.log(demi.length)
  return ethers.utils.formatBytes32String(demi)
})
console.log(tab2)

const tab3 = tab2.map((demi) => {
  return ethers.utils.parseBytes32String(demi)
})

console.log(tab3)
