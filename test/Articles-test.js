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

    const Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()

    const Reviews = await ethers.getContractFactory('Reviews')
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
    await articles
      .connect(owner)
      .setContracts(reviews.address, comments.address)
  })

  describe('Deployment', function () {})

  describe('setContracts', function () {
    it('should revert if you are note the owner', async function () {
      await expect(
        articles
          .connect(wallet1)
          .setContracts(reviews.address, comments.address)
      ).to.be.revertedWith('Users: caller is not the owner')
    })
    it('should revert if you call this function a second time', async function () {
      await expect(
        articles.connect(owner).setContracts(reviews.address, comments.address)
      ).to.be.revertedWith('Articles: this function is callable only one time')
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
    it('should revert is the article does not exist or already banned', async function () {
      await expect(articles.connect(owner).banArticle(1)).to.be.revertedWith(
        'Articles: This Article does not exist or is already banned'
      )
      await expect(articles.connect(owner).banArticle(5)).to.be.revertedWith(
        'Articles: This Article does not exist or is already banned'
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

  describe('voteValidity', function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await users.connect(wallet1).register(CID, CID)
      await users.connect(owner).acceptUser(2)
    })

    it('should update the struct Article validity', async function () {
      await articles.connect(wallet1).voteValidity(1, 1)
      let struct = await articles.articleInfo(1)
      expect(struct.validity, 'increment validity').to.equal(1)
      await articles.connect(article1Author).voteValidity(0, 1)
      struct = await articles.articleInfo(1)
      expect(struct.validity, 'decrement validity').to.equal(0)
    })

    it('should revert if user already voted', async function () {
      await articles.connect(wallet1).voteValidity(1, 1)
      await expect(
        articles.connect(wallet1).voteValidity(1, 1)
      ).to.be.revertedWith(
        'Articles: you already vote on validity for this article.'
      )
    })

    it('should revert if user is not approved', async function () {
      await expect(
        articles.connect(wallet2).voteValidity(1, 1)
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
    })

    it('should emit ValidityVoted', async function () {
      await expect(articles.connect(wallet1).voteValidity(1, 1))
        .to.emit(articles, 'ValidityVoted')
        .withArgs(1, 1, 2)
    })

    it('should revert if article does not exist', async function () {
      await expect(
        articles.connect(wallet1).voteValidity(1, 255)
      ).to.be.revertedWith('Articles: cannot vote on inexistant Article.')
    })
  })

  describe('voteImportance', function () {
    // describe deploy contract
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await users.connect(wallet1).register(CID, CID)
      await users.connect(owner).acceptUser(2)
    })

    it('should update the struct Article vote importance', async function () {
      await articles.connect(wallet1).voteImportance(1, 1)
      let struct = await articles.articleInfo(1)
      expect(struct.importance, 'increment importance').to.equal(1)
      await articles.connect(article1Author).voteImportance(0, 1)
      struct = await articles.articleInfo(1)
      expect(struct.importance, 'decrement importance').to.equal(0)
    })

    it('should revert if user already voted', async function () {
      await articles.connect(wallet1).voteImportance(1, 1)
      await expect(
        articles.connect(wallet1).voteImportance(1, 1)
      ).to.be.revertedWith(
        'Articles: you already vote on importance for this article.'
      )
    })

    it('should revert if user is not approved', async function () {
      await expect(
        articles.connect(wallet2).voteImportance(1, 1)
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
    })

    it('should emit ImportanceVoted', async function () {
      await expect(articles.connect(wallet1).voteImportance(1, 1))
        .to.emit(articles, 'ImportanceVoted')
        .withArgs(1, 1, 2)
    })

    it('should revert if article does not exist', async function () {
      await expect(
        articles.connect(wallet1).voteImportance(1, 255)
      ).to.be.revertedWith('Articles: cannot vote on inexistant Article.')
    })
  })
})
