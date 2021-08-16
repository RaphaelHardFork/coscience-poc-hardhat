const { ethers } = require('hardhat')
const hre = require('hardhat')
const { deployed } = require('./deployed')

const CONTRACT_NAME = 'Users'

const main = async () => {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  const Users = await hre.ethers.getContractFactory(CONTRACT_NAME)
  const users = await Users.deploy(deployer.address)
  await users.deployed()

  await deployed(CONTRACT_NAME, hre.network.name, users.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
