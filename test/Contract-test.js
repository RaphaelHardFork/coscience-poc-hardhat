/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

// some tests: https://github.com/RaphaelHardFork/ico-hardhat

const CONTRACT_NAME = 'Contract'

describe('Contract', function () {
  let Contract, contract, dev, owner

  const SUPPLY = ethers.utils.parseEther('100000')
  const ADDRESS_ZERO = ethers.constants.AddressZero

  beforeEach(async function () {
    ;[dev, owner] = await ethers.getSigners()
    Contract = await ethers.getContractFactory(CONTRACT_NAME)
    contract = await Contract.connect(dev).deploy()
    await contract.deployed()
  })
})
