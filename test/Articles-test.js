/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Articles'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

/*
- token transfer (prevent transfer between users)
- PUBLISH:
   - mint token (see wallet)
   - tokenURI
   - Struct(author, id, coAuthor,abstract&contentCID)
   - prevent if not user (need to import Users?)
   - event Publish
   - counters
- BAN_ARTICLE:
    - change struct
    - onlyOwner (revert)
    - event ArticleBanned
- CONNEXION:    execpt articles
    - fill the right arrays
    - test scenario(Article published => review on it => comment on this review)
*/
describe('Articles', function () {
  let Articles,
    articles,
    dev,
    owner,
    wallet1,
    wallet2,
    wallet3,
    wallet4,
    wallet5,
    wallet6

  beforeEach(async function () {
    ;[dev, owner, wallet1, wallet2, wallet3, wallet4, wallet5, wallet6] =
      await ethers.getSigners()
    Articles = await ethers.getContractFactory(CONTRACT_NAME)
    articles = await Articles.connect(dev).deploy(owner.address)
    await articles.deployed()
  })
  // test
})
