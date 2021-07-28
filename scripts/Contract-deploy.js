const { ethers } = require('hardhat')
const hre = require('hardhat')
const { deployed } = require('./deployed')

const CONTRACT_NAME = 'Contract'

const main = async () => {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  const Contract = await hre.ethers.getContractFactory(CONTRACT_NAME)
  const contract = await Contract.deploy()
  await contract.deployed()
  await deployed(CONTRACT_NAME, hre.network.name, contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
