/* eslint-disable comma-dangle */
const { ethers } = require('hardhat')
const hre = require('hardhat')
const { readFile } = require('fs/promises')

const DEPLOYED_CONTRACT_NAME = 'DeployedContract'

const main = async () => {
  const CONTRACTS_DEPLOYED = JSON.parse(
    await readFile('./scripts/deployed.json', 'utf-8')
  )
  const DEPLOYED_CONTRACT_ADDRESS =
    CONTRACTS_DEPLOYED[DEPLOYED_CONTRACT_NAME][hre.network.name].address

  const [deployer] = await ethers.getSigners()
  const Contract = await hre.ethers.getContractFactory(DEPLOYED_CONTRACT_NAME)
  const contract = await Contract.attach(DEPLOYED_CONTRACT_ADDRESS)

  // post deployment script
  try {
    const tx = await contract.connect(deployer).action()
    await tx.wait()
    console.log(`Contracts interaction (action): ${deployer.address} did...`)
  } catch (e) {
    console.log(e)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
