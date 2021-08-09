/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Comments'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Comments', function () {
  let Comments,
    comments,
    Reviews,
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

    Reviews = await ethers.getContractFactory('Reviews')
    reviews = await Reviews.connect(dev).deploy(owner.address, articles.address)
    await reviews.deployed()

    Comments = await ethers.getContractFactory(CONTRACT_NAME)
    comments = await Comments.connect(dev).deploy(
      owner.address,
      articles.address,
      reviews.address
    )
    await comments.deployed()
  })
})
