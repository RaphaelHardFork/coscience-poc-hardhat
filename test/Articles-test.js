/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')
// const { jsArticleList, userArticlesIds } = require('../utils.js')

const CONTRACT_NAME = 'Articles'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'

describe('Articles', function () {
  let users,
    articles,
    reviews,
    comments,
    dev,
    owner,
    article1Author,
    article2Author,
    wallet1,
    wallet2,
    wallet3

  beforeEach(async function () {
    ;[dev, owner, article1Author, article2Author, wallet1, wallet2, wallet3] =
      await ethers.getSigners()

    const Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    const Articles = await ethers.getContractFactory(CONTRACT_NAME)
    articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()

    // get address of deployed contracts
    const Reviews = await ethers.getContractFactory('Reviews')
    const reviewsAddress = await articles.reviewsAddress() // function Articles.sol
    reviews = await Reviews.attach(reviewsAddress)

    const Comments = await ethers.getContractFactory('Comments')
    const commentsAddress = await articles.commentsAddress()
    comments = await Comments.attach(commentsAddress)
  })

  describe('Deployment', function () {
    it('should deploy Reviews.sol', async function () {
      expect(await articles.reviewsAddress()).to.equal(reviews.address)
    })

    it('should deploy Comments.sol', async function () {
      expect(await articles.commentsAddress()).to.equal(comments.address)
    })
  })

  describe('publish an article', function () {
    let publishCall, coAuthor

    beforeEach(async function () {
      // register + accept
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      publishCall = await articles
        .connect(article1Author)
        .publish(coAuthor, CID, CID)
    })

    it('should mint a NFT to the publisher', async function () {
      expect(await articles.totalSupply(), 'total supply').to.equal(1)
      expect(await articles.ownerOf(1), 'owner of').to.equal(
        article1Author.address
      )
    })

    it('should fill the struct properly', async function () {
      const struct = await articles.articleInfo(1)
      expect(struct.author, 'author').to.equal(article1Author.address)
      expect(struct.id, 'id').to.equal(1)
      expect(struct.abstractCID, 'abstractCID').to.equal(CID)
      expect(struct.contentCID, 'contentCID').to.equal(CID)
      struct.coAuthor.forEach(async (author, index) => {
        expect(author, `coAuthor ${index}`).to.equal(coAuthor[index])
      })
    })

    it('should emit a Published event', async function () {
      expect(publishCall)
        .to.emit(articles, 'Published')
        .withArgs(article1Author.address, 1, CID)
    })

    it('should revert if user is not registered', async function () {
      await expect(
        articles.connect(wallet3).publish(coAuthor, CID, CID)
      ).to.be.revertedWith('Users:')
    })
  })

  describe('NFT behavior', function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
    })

    it('should prevent the token transfert', async function () {
      await expect(
        articles
          .connect(article1Author)
          .transferFrom(article1Author.address, wallet1.address, 1)
      ).to.be.revertedWith('Articles: articles tokens are not transferable.')
    })
  })

  describe('ban an article', function () {
    let banCall
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      banCall = await articles.connect(owner).banArticle(1)
    })

    it('should change the struct of the article', async function () {
      const struct = await articles.articleInfo(1)
      expect(struct.contentBanned).to.equal(true)
    })

    it('should emit an ArticleBanned event', async function () {
      expect(banCall).to.emit(articles, 'ArticleBanned').withArgs(1)
    })

    it('should revert if not owner attempt to ban article', async function () {
      await expect(articles.connect(wallet2).banArticle(1)).to.be.revertedWith(
        'Users: caller is not the owner'
      )
    })
  })

  describe('Fill comments/reviews array', function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
    })

    // function tested in Reviews & Comments tests

    it('should revert if wallet atempt to fill comment array', async function () {
      await expect(
        articles.connect(owner).fillCommentsArray(1, 1)
      ).to.be.revertedWith(
        'Articles: this function is only callable by Comments.sol'
      )
    })

    it('should revert if wallet atempt to fill review array', async function () {
      await expect(
        articles.connect(owner).fillReviewsArray(1, 1)
      ).to.be.revertedWith(
        'Articles: this function is only callable by Reviews.sol'
      )
    })
  })
})
