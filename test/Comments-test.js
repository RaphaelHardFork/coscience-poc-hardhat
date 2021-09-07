/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Comments'
const ADDRESS_ZERO = ethers.constants.AddressZero
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

// UTILS
// function to get a JS comment list with the contract
// contracts (comments, articles, reviews) are passed in parameter to create a pure function (see line)
const jsCommentList = async (comments, articles, reviews, listOfId) => {
  const commentList = []
  let tab = []

  if (listOfId === undefined) {
    const nb = await comments.nbOfComment()
    for (let i = 1; i <= nb; i++) {
      tab.push(i)
    }
  } else {
    tab = listOfId
  }
  // loop
  for (const i of tab) {
    const c = await comments.commentInfo(i)
    let on
    if (c.target === articles.address) {
      // ARTICLE
      const a = await articles.articleInfo(c.targetID.toNumber())
      on = {
        id: a.id.toString(),
        author: a.author,
        coAuthor: a.coAuthor,
        contentBanned: a.contentBanned,
        abstractCID: a.abstractCID,
        contentCID: a.contentCID,
      }
    } else {
      // REVIEW
      const r = await reviews.reviewInfo(c.targetID.toNumber())
      const a = await articles.articleInfo(r.targetID.toNumber())
      const comments = r.comments.map((id) => id.toNumber())
      console.log(r)
      on = {
        id: r.id.toString(),
        author: r.author,
        targetID: r.targetID.toNumber(),
        contentBanned: r.contentBanned,
        contentCID: r.contentCID,
        comments,
        onArticle: {
          id: a.id.toString(),
          author: a.author,
          coAuthor: a.coAuthor,
          contentBanned: a.contentBanned,
          abstractCID: a.abstractCID,
          contentCID: a.contentCID,
        },
      }
    }
    // COMMENT
    commentList.push({
      id: c.id.toString(),
      author: c.author,
      target: c.target,
      targetID: c.targetID.toNumber(),
      contentBanned: c.contentBanned,
      contentCID: c.contentCID,
      on,
    })
  }
  return commentList
}

const userCommentsIds = async (comments, userAddress) => {
  // user comments list with ENUMERATION

  // balance of user
  const userCommentBalance = await comments.balanceOf(userAddress)
  // tab of id
  const userCommentList = []
  for (let i = 0; i < userCommentBalance.toNumber(); i++) {
    const id = await comments.tokenOfOwnerByIndex(userAddress, i)
    // ID is defined by me with the Counters.sol
    userCommentList.push(id.toNumber())
  }
  return userCommentList
}

// TEST
describe('Comments', function () {
  let users,
    comments,
    reviews,
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

    const Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    const Articles = await ethers.getContractFactory('Articles')
    articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()

    // get address of deployed contracts
    const Reviews = await ethers.getContractFactory('Reviews')
    const reviewsAddress = await articles.reviewsAddress() // function Articles.sol
    reviews = await Reviews.attach(reviewsAddress)

    const Comments = await ethers.getContractFactory(CONTRACT_NAME)
    const commentsAddress = await articles.commentsAddress()
    comments = await Comments.attach(commentsAddress)
  })

  describe('Deployment', function () {
    //
  })

  describe('Post a comment on article', function () {
    let postCall
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(comment1Author).register(CID, CID)
      await users.connect(owner).acceptUser(2)

      await articles
        .connect(article1Author)
        .publish([wallet1.address, wallet2.address, wallet3.address], CID, CID)
      await reviews.connect(article1Author).post(CID, 1)

      postCall = await comments
        .connect(comment1Author)
        .post(CID, articles.address, 1) // on ARTICLE 1

      await comments.connect(comment1Author).post(CID, reviews.address, 1)
    })

    it('should mint a NFT to the publisher', async function () {
      expect(await comments.totalSupply(), 'total supply').to.equal(2)
      expect(await comments.ownerOf(1), 'owner of').to.equal(
        comment1Author.address
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

    it('should fill the array of the corresponding review', async function () {
      const struct = await reviews.reviewInfo(1)
      expect(struct.comments[0]).to.equal(2)
    })

    it('should emit a Posted event', async function () {
      expect(postCall)
        .to.emit(comments, 'Posted')
        .withArgs(comment1Author.address, 1, articles.address, 1)
    })

    it('should revert if user is not registered', async function () {
      await expect(
        comments.connect(wallet3).post(CID, articles.address, 1)
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
    })
  })

  describe('ban')
})
