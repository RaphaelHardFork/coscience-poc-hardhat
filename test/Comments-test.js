/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Comments'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'
const HASHED_PASSWORD = ethers.utils.id('password')

describe('Comments', function () {
  let Users,
    users,
    Comments,
    comments,
    Reviews,
    reviews,
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
      wallet1,
      wallet2,
      wallet3,
      article1Author,
      article2Author,
      comment1Author,
      comment2Author,
      review1Author,
      review2Author,
    ] = await ethers.getSigners()

    Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(owner.address, users.address)
    await articles.deployed()

    Reviews = await ethers.getContractFactory('Reviews')
    reviews = await Reviews.connect(dev).deploy(
      owner.address,
      articles.address,
      users.address
    )
    await reviews.deployed()

    Comments = await ethers.getContractFactory(CONTRACT_NAME)
    comments = await Comments.connect(dev).deploy(
      owner.address,
      articles.address,
      reviews.address,
      users.address
    )
    await comments.deployed()

    // use contracts to create a context
    // users registration
    const userPending = [
      article1Author,
      article2Author,
      comment1Author,
      comment2Author,
      review1Author,
      review2Author,
    ]
    userPending.forEach(async (user, index) => {
      await users.connect(user).register(HASHED_PASSWORD, CID)
      await users.connect(owner).acceptUser(index + 1)
    })
    // article post
    await articles
      .connect(article1Author)
      .publish([wallet1.address, wallet2.address, wallet3.address], CID, CID)
    await articles
      .connect(article2Author)
      .publish(
        [wallet3.address, review1Author.address, comment1Author.address],
        CID,
        CID
      )
    // review post
    await reviews.connect(review2Author).post(CID, 1) // on article 1
    await reviews.connect(review1Author).post(CID, 2) // on article 2
  })

  describe('Post a comment on article', function () {
    let postCall
    beforeEach(async function () {
      postCall = await comments
        .connect(comment1Author)
        .post(CID, articles.address, 1) // on ARTICLE 1
    })

    it('should mint a NFT to the publisher', async function () {
      expect(await comments.totalSupply(), 'total supply').to.equal(1)
      expect(await comments.ownerOf(1), 'owner of').to.equal(
        comment1Author.address
      )
      expect(await comments.tokenURI(1), 'token uri').to.equal(
        'https://ipfs.io/ifps/CID.json'
      )
    })

    it('should fill the struct properly', async function () {
      const struct = await comments.commentInfo(1)
      expect(struct.author, 'author').to.equal(comment1Author.address)
      expect(struct.id, 'id').to.equal(1)
      expect(struct.target, 'target').to.equal(articles.address)
      expect(struct.targetID, 'targetID').to.equal(1)
      expect(struct.contentCID, 'contentCID').to.equal(CID)
    })

    it('should fill the array of the corresponding article', async function () {
      const struct = await articles.articleInfo(1)
      expect(struct.comments[0]).to.equal(1)
    })

    it('should emit a Posted event', async function () {
      expect(postCall)
        .to.emit(comments, 'Posted')
        .withArgs(comment1Author.address, 1, articles.address, 1)
    })

    it('should revert if user is not registered', async function () {
      await expect(
        comments.connect(wallet3).post(CID, articles.address, 1)
      ).to.be.revertedWith('Users:')
    })
  })

  describe('display comments', function () {
    beforeEach(async function () {
      await comments.connect(comment1Author).post(CID, articles.address, 1) // on ARTICLE 1
      await comments.connect(comment2Author).post(CID, articles.address, 1) // on ARTICLE 1
      await comments.connect(comment1Author).post(CID, articles.address, 2) // on ARTICLE 2
      await comments.connect(comment1Author).post(CID, reviews.address, 1) // on REVIEW 1
      await comments.connect(comment2Author).post(CID, articles.address, 1) // on REVIEW 1
      await comments.connect(comment1Author).post(CID, articles.address, 2) // on REVIEW 2
    })
    it('should display through Enumerable')
    it('display trougth comments contract')
    it('display through articles NFT')
    it('display through article contract')
    it('display through review NFT')
    it('display through review contract')
  })
})

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
