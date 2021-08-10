/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Reviews'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Reviews', function () {
  let Reviews,
    reviews,
    Articles,
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

    Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(owner.address)
    await articles.deployed()

    Reviews = await ethers.getContractFactory(CONTRACT_NAME)
    reviews = await Reviews.connect(dev).deploy(owner.address, articles.address)
    await reviews.deployed()
  })
  // describe('post', function () {
  //   let postCall

  //   it('should emit a Posted event', async function () {
  //     expect(postCall).to.emit(reviews, 'Posted').withArgs(wallet1.address, 0)
  //   })

  //   it('should fill the struct properly for user 0', async function () {
  //     const struct = await reviews.articleInfo(0)
  //     expect(struct.id, 'id').to.equal(0)
  //     expect(struct.contentCID, 'CID').to.equal(CID)
  //   })
  // })
})
