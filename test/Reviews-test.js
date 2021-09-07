/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Reviews'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

// UTILS
// Pure function to create a JS object of the review list

const jsReviewList = async (articles, reviews, listOfId) => {
  const reviewList = []
  let tab = []

  if (listOfId === undefined) {
    const nb = await reviews.nbOfReview()
    for (let i = 1; i <= nb.toNumber(); i++) {
      console.log('push')
      tab.push(i)
    }
  } else {
    tab = listOfId
  }

  for (const i of tab) {
    const r = await reviews.reviewInfo(i)
    const a = await articles.articleInfo(r.targetID.toNumber())
    const comments = r.comments.map((id) => id.toNumber())
    const on = {
      id: a.id.toString(),
      author: a.author,
      coAuthor: a.coAuthor,
      contentBanned: a.contentBanned,
      abstractCID: a.abstractCID,
      contentCID: a.contentCID,
    }

    reviewList.push({
      id: r.id.toString(),
      author: r.author,
      targetID: r.targetID.toNumber(),
      contentBanned: r.contentBanned,
      contentCID: r.contentCID,
      comments,
      on,
    })
  }
  return reviewList
}

describe('Reviews', function () {
  let users,
    reviews,
    articles,
    dev,
    owner,
    article1Author,
    article2Author,
    review1Author,
    review2Author,
    wallet1,
    wallet2,
    wallet3

  beforeEach(async function () {
    ;[
      dev,
      owner,
      article1Author,
      article2Author,
      review1Author,
      review2Author,
      wallet1,
      wallet2,
      wallet3,
    ] = await ethers.getSigners()

    const Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    const Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()

    // get address of deployed contracts
    const Reviews = await ethers.getContractFactory(CONTRACT_NAME)
    const reviewsAddress = await articles.reviewsAddress() // function Articles.sol
    reviews = await Reviews.attach(reviewsAddress)
  })

  describe('Deployment', function () {
    //
  })

  describe('post a review', function () {
    let postCall, coAuthor
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(review1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(owner).acceptUser(2)

      coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      postCall = await reviews.connect(review1Author).post(CID, 1) // on article 1
    })

    it('should mint a NFT to the poster', async function () {
      expect(await reviews.totalSupply(), 'total supply').to.equal(1)
      expect(await reviews.ownerOf(1), 'owner of').to.equal(
        review1Author.address
      )
    })

    it('should fill the struct properly', async function () {
      const struct = await reviews.reviewInfo(1)
      expect(struct.author, 'author').to.equal(review1Author.address)
      expect(struct.id, 'id').to.equal(1)
      expect(struct.targetID, 'targetID').to.equal(1)
      expect(struct.contentCID, 'contentCID').to.equal(CID)
    })

    it('should fill the array of the corresponding article', async function () {
      const struct = await articles.articleInfo(1)
      expect(struct.reviews[0]).to.equal(1)
    })

    it('should emit when you post a review', async function () {
      await expect(reviews.connect(review1Author).post(CID, 1))
        .to.emit(reviews, 'Posted')
        .withArgs(review1Author.address, 2, 1)
    })

    it('should revert if user is not approved', async function () {
      await expect(reviews.connect(wallet3).post(CID, 1)).to.be.revertedWith(
        'Users:'
      )
    })
  })

  describe('NFT behavior', function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(review1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(owner).acceptUser(2)

      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await reviews.connect(review1Author).post(CID, 1) // on article 1
    })

    it('should prevent the token transfer', async function () {
      await expect(
        reviews
          .connect(review1Author)
          .transferFrom(review1Author.address, wallet1.address, 1)
      ).to.be.revertedWith('Reviews: reviews token are not transferable')
    })
  })

  describe('ban a review', function () {
    let banCall
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(review1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(owner).acceptUser(2)

      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await reviews.connect(review1Author).post(CID, 1) // on article 1
      banCall = await reviews.connect(owner).banPost(1)
    })

    it('should change the struct of the review', async function () {
      const struct = await reviews.reviewInfo(1)
      expect(struct.contentBanned).to.equal(true)
    })

    it('should emit a ReviewBanned event', async function () {
      expect(banCall).to.emit(reviews, 'ReviewBanned').withArgs(1)
    })
  })
})
