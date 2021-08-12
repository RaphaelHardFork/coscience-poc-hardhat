/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Articles'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'
const HASHED_PASSWORD = ethers.utils.id('password')

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
  let Users,
    users,
    Articles,
    articles,
    dev,
    owner,
    article1Author,
    article2Author,
    comment1Author,
    comment2Author,
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
      comment1Author,
      comment2Author,
      review1Author,
      review2Author,
      wallet1,
      wallet2,
      wallet3,
    ] = await ethers.getSigners()

    Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    Articles = await ethers.getContractFactory(CONTRACT_NAME)
    articles = await Articles.connect(dev).deploy(owner.address, users.address)
    await articles.deployed()

    // register + accept
    await users.connect(article1Author).register(HASHED_PASSWORD, CID)
    await users.connect(owner).acceptUser(1)
  })

  describe('Deployment', function () {
    it('should asign owner as the owner', async function () {
      expect(await articles.owner()).to.be.equal(owner.address)
    })

    it('should approve article1Author', async function () {
      expect(await users.userStatus(1), 'status').to.equal(2)
      const wallets = await users.userWalletList(1)
      expect(wallets[0], 'address').to.equal(article1Author.address)
    })

    it('should return right value', async function () {
      expect(await articles.userStatusX(article1Author.address)).to.equal(2)
    })
  })

  describe('publish an article', function () {
    let publishCall, coAuthor

    beforeEach(async function () {
      coAuthor = [wallet1.address, wallet2.address, wallet3.address]
      publishCall = await articles
        .connect(article1Author)
        .publish(coAuthor, CID, CID)
      await articles.connect(article2Author).publish(coAuthor, CID, CID)
    })

    it('should mint a NFT to the publisher', async function () {
      expect(await articles.totalSupply(), 'total supply').to.equal(2)
      expect(await articles.ownerOf(1), 'owner of').to.equal(
        article1Author.address
      )
      expect(await articles.tokenURI(1), 'token uri').to.equal(
        'https://ipfs.io/ifps/CID.json'
      )
    })
    it('should fill the struct properly', async function () {
      const struct = await articles.articleInfo(1)
      expect(struct.author, 'author').to.equal(article1Author.address)
      expect(struct.id, 'id').to.equal(1)
      expect(struct.abstractCID, 'contentCID').to.equal(CID)
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

  // describe('_beforeTokenTransfer', function () {
  //   it('should not allow transfer between users', async function () {
  //     await expect(articles.transfer(wallet2.address)).to.reject(
  //       'Transfer between users is not allowed.'
  //     )
  //   })
  // })

  describe('publish', function () {
    let publishCall
    beforeEach(async function () {
      // publishCall = await articles.connect(wallet1).publish()
    })
  })

  //   describe('banArticle', function () {
  //     let banArticleCall
  //     beforeEach(async function () {

  //     })
  //     it('should not allow to ban an article if not the owner', async function () {
  //       await expect(articles.banArticle(CID)).to.reject(
  //         'Only the owner can ban an article.'
  //       )
  //     })
  //   })
})
