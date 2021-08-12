/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Reviews'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'
const HASHED_PASSWORD = ethers.utils.id('password')

describe('Reviews', function () {
  let Reviews,
    reviews,
    Articles,
    articles,
    Users,
    users,
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

    Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(owner.address, users.address)
    await articles.deployed()

    Reviews = await ethers.getContractFactory(CONTRACT_NAME)
    reviews = await Reviews.connect(dev).deploy(
      owner.address,
      articles.address,
      users.address
    )
    await reviews.deployed()

    await users.connect(wallet1).register(HASHED_PASSWORD, CID)
    await users.connect(owner).acceptUser(1)
  })

  describe('Deployment', function () {
    it('should asign owner ', async function () {
      expect(await reviews.owner()).to.equal(owner.address)
    })
    it('should asign articles address', async function () {
      expect(await reviews.articlesAddress()).to.equal(articles.address)
    })
  })

  describe('post', function () {
    it('should emit when you post a review', async function () {
      await expect(reviews.connect(wallet1).post(CID, 1))
        .to.emit(reviews, 'Posted')
        .withArgs(wallet1.address, 1, 1)
    })

    it('should increment id', async function () {})
  })
  describe('fillCommentsArray', function () {})
})
