/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')
const UtilsCID = require('cids')
const { BigNumber } = require('ethers')
// const { jsArticleList, userArticlesIds } = require('../utils.js')

const CONTRACT_NAME = 'Articles'
const ADDRESS_ZERO = ethers.constants.AddressZero
const HASHED_PASSWORD = ethers.utils.id('password')
const ABSTRACT_ARRAY = [1, 1]
const ABSTRACT_ARRAY_OUTPUT = ABSTRACT_ARRAY.map((nb) => {
  return BigNumber.from('1')
})
// create the CID
const firstCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
const cid = new UtilsCID(
  'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
)
const cidToHexString = cid.toString('base16')
const CIDFAKE = BigInt('0x' + cidToHexString, 16) // big Number
const CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'

describe('Articles', function () {
  let Users,
    users,
    Articles,
    articles,
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

    Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    Articles = await ethers.getContractFactory(CONTRACT_NAME)
    articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()
  })

  describe('Deployment', function () {
    it('should return the user contract address', async function () {
      expect(await articles.usersContractAddress()).to.be.equal(users.address)
    })
  })

  describe('publish an article', function () {
    let publishCall, coAuthor

    beforeEach(async function () {
      // register + accept
      await users.connect(article1Author).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)
      coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      publishCall = await articles
        .connect(article1Author)
        .publish(coAuthor, CID, CID)
    })

    it('should get the current number of Article published', async function () {
      expect(await articles.nbOfArticles()).to.equal(1)
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      expect(await articles.nbOfArticles()).to.equal(2)
    })

    it('should give back the CID', async function () {
      /*
      const struct = await articles.articleInfo(1)
      const hexString = struct.abstractCID.toHexString()
      const bigInt = struct.abstractCID.toBigInt()
      console.log(bigInt)
      console.log(hexString)
      const cid = new UtilsCID(hexString).toString('base32')
      */
      // expect(cid).to.equal(firstCid)
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

    it('should revert if user is not registered or approved', async function () {
      await expect(
        articles.connect(wallet3).publish(coAuthor, CID, CID)
      ).to.be.revertedWith('Users:')
      await users.connect(article2Author).register(HASHED_PASSWORD, CID, CID)
      await expect(
        articles.connect(article2Author).publish(coAuthor, CID, CID)
      ).to.be.revertedWith('Users:')
    })
  })

  describe('non-transferable NFT behavior', async function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(HASHED_PASSWORD, CID, CID)
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

  describe('ban an article', async function () {
    let banCall
    beforeEach(async function () {
      await users.connect(article1Author).register(HASHED_PASSWORD, CID, CID)
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
        'Users:'
      )
    })

    it('should revert if owner ban an article who does not exist or already banned', async function () {
      await expect(articles.connect(owner).banArticle(3)).to.be.revertedWith(
        'Articles: This Article does not exist or is already banned'
      )
      await expect(articles.connect(owner).banArticle(1)).to.be.revertedWith(
        'Articles: This Article does not exist or is already banned'
      )
    })
  })

  describe('display articles', function () {
    beforeEach(async function () {
      await users.connect(article1Author).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(article2Author).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(2)

      const coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      await articles.connect(article1Author).publish(coAuthor, CID, CID)
      await articles.connect(article2Author).publish(coAuthor, CID, CID)
      await articles
        .connect(article2Author)
        .publish(coAuthor.slice(0, 1), CID, CID)
      await articles
        .connect(article1Author)
        .publish(coAuthor.slice(0, 2), CID, CID)
      await articles
        .connect(article1Author)
        .publish(coAuthor.slice(1, 2), CID, CID)
    })

    it('display article list', async function () {
      // const obj = await jsArticleList(articles)
      // console.log(obj)
    })
    it('display an user article list', async function () {
      // const listOfId = await userArticlesIds(articles, article1Author.address)
      // const obj = await jsArticleList(articles, listOfId)
      // console.log(obj)
    })
  })
})
