/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Reviews'
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Reviews', function () {
  let users,
    reviews,
    articles,
    comments,
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

    const Reviews = await ethers.getContractFactory(CONTRACT_NAME)
    reviews = await Reviews.connect(dev).deploy(users.address, articles.address)
    await reviews.deployed()

    const Comments = await ethers.getContractFactory('Comments')
    comments = await Comments.connect(dev).deploy(
      users.address,
      articles.address,
      reviews.address
    )
    await comments.deployed()

    // Set contracts address
    await articles.setContracts(reviews.address, comments.address)
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

    it('should revert if article does not exist', async function () {
      await expect(
        reviews.connect(review1Author).post(CID, 45)
      ).to.be.revertedWith('Reviews: article ID does not exist')
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

  describe('vote on a review', function () {
    let voteCall
    beforeEach(async function () {
      // post a review
      await users.connect(article1Author).register(CID, CID)
      await users.connect(review1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(owner).acceptUser(2)

      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await reviews.connect(review1Author).post(CID, 1)

      // vote on a review
      voteCall = await reviews.connect(article1Author).vote(1, 1)
    })

    it('should increment the review vote count', async function () {
      const struct = await reviews.reviewInfo(1)
      expect(struct.vote).to.equal(1)
    })

    it('should revert if review does not exist', async function () {
      await expect(
        reviews.connect(article1Author).vote(0, 34)
      ).to.be.revertedWith('Reviews: cannot vote on inexistant review')
    })

    it('should decrement the vote count', async function () {
      await reviews.connect(review1Author).vote(0, 1)
      const struct = await reviews.reviewInfo(1)
      expect(struct.vote).to.equal(0) // +1 -1
    })

    it('should revert if voter try to vote again', async function () {
      await expect(
        reviews.connect(article1Author).vote(0, 1)
      ).to.be.revertedWith('Review: you already vote for this review')
    })

    it('should emit a Voted event', async function () {
      expect(voteCall).to.emit(reviews, 'Voted').withArgs(1, 1, 1)
      // emit Voted(choice, reviewID, userID);
    })
  })
})
