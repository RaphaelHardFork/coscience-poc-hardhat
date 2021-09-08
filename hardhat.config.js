require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-solhint')
require('hardhat-docgen')
require('hardhat-gas-reporter')
require('hardhat-contract-sizer')
require('dotenv').config()

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID
const PRIVATE_KEY = process.env.PRIVATE_KEY
// 0xb71b0f260De9DF30a9a185D95029fe6Ef535BA71

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.7',
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    polygonTestnet: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: false,
  },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 21,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
}
