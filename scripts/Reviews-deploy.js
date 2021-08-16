/* eslint-disable comma-dangle */
const { ethers } = require('hardhat')
const hre = require('hardhat')
const { deployed } = require('./deployed')
const { readFile } = require('fs/promises')

const CONTRACT_NAME = 'Reviews'

const main = async () => {
  const [deployer] = await ethers.getSigners()

  const CONTRACTS_DEPLOYED = JSON.parse(
    await readFile('./scripts/deployed.json', 'utf-8')
  )
  const USERS_CONTRACT = CONTRACTS_DEPLOYED.Users[hre.network.name].address
  const ARTICLES_CONTRACT =
    CONTRACTS_DEPLOYED.Articles[hre.network.name].address

  console.log('Deploying contracts with the account:', deployer.address)
  const Reviews = await hre.ethers.getContractFactory(CONTRACT_NAME)
  const reviews = await Reviews.deploy(
    deployer.address,
    ARTICLES_CONTRACT,
    USERS_CONTRACT
  )
  await reviews.deployed()

  await deployed(CONTRACT_NAME, hre.network.name, reviews.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
