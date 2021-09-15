/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Comments'
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

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

    const Reviews = await ethers.getContractFactory('Reviews')
    reviews = await Reviews.connect(dev).deploy(users.address, articles.address)
    await reviews.deployed()

    const Comments = await ethers.getContractFactory(CONTRACT_NAME)
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

    it('should revert if trying to post a comment on inexistant article', async function () {
      await expect(
        comments.connect(article1Author).post(CID, articles.address, 45)
      ).to.be.revertedWith('Comments: cannot comment an inexistant Article')
    })

    it('should revert if trying to post a comment on inexistant review', async function () {
      await expect(
        comments.connect(article1Author).post(CID, reviews.address, 45)
      ).to.be.revertedWith('Comments: cannot comment an inexistant Review')
    })

    it('should revert if trying to post a comment on inexistant comment', async function () {
      await expect(
        comments.connect(article1Author).post(CID, comments.address, 45)
      ).to.be.revertedWith('Comments: cannot comment an inexistant Comment')
    })

    it('should revert if the target address is different from the one allowed', async function () {
      await expect(
        comments.connect(comment1Author).post(CID, users.address, 1)
      ).to.be.revertedWith('Comments: must be posted on appropriated contract')
    })
  })

  describe('ban', function () {
    let banPostCall
    beforeEach(async function () {
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(comment1Author).register(CID, CID)
      await users.connect(owner).acceptUser(2)

      await articles
        .connect(article1Author)
        .publish([wallet1.address, wallet2.address, wallet3.address], CID, CID)
      await reviews.connect(article1Author).post(CID, 1)

      await comments.connect(comment1Author).post(CID, articles.address, 1) // on ARTICLE 1
      await comments.connect(comment1Author).post(CID, reviews.address, 1) // on REVIEW 1

      banPostCall = await comments.connect(owner).banPost(1)
    })

    it('should change the struct of the article', async function () {
      const struct = await comments.commentInfo(1)
      expect(struct.contentBanned).to.equal(true)
    })

    it('should emit a CommentBanned event', async function () {
      expect(banPostCall).to.emit(comments, 'CommentBanned').withArgs(1)
    })

    it('should revert if not owner atempt to ban a post', async function () {
      await expect(comments.connect(wallet1).banPost(2)).to.be.revertedWith(
        'Users: caller is not the owner'
      )
    })

    it('should revert if you banpost a comment who does not exist or is already banned', async function () {
      await expect(comments.connect(owner).banPost(1)).to.be.revertedWith(
        'Comments: This Comment does not exist or is already banned'
      )
      await expect(comments.connect(owner).banPost(3)).to.be.revertedWith(
        'Comments: This Comment does not exist or is already banned'
      )
    })
  })

  describe('vote on a comment', async function () {
    let voteCall
    beforeEach(async function () {
      // post a comment
      await users.connect(article1Author).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      await users.connect(comment1Author).register(CID, CID)
      await users.connect(owner).acceptUser(2)

      await articles
        .connect(article1Author)
        .publish([wallet1.address, wallet2.address, wallet3.address], CID, CID)
      await comments.connect(comment1Author).post(CID, articles.address, 1) // on ARTICLE 1

      // vote
      voteCall = await comments.connect(article1Author).vote(1)
    })

    it('should revert if Comment does not exist', async function () {
      await expect(
        comments.connect(article1Author).vote(45)
      ).to.be.revertedWith('Comments: cannot vote on inexistant Comment.')
    })

    it('should revert if voter try to vote again', async function () {
      await expect(comments.connect(article1Author).vote(1)).to.be.revertedWith(
        'Comments: you already vote for this comment'
      )
    })

    it('should increment the comment vote count', async function () {
      const struct = await comments.commentInfo(1)
      expect(struct.vote).to.equal(1)
    })

    it('should emit a Voted event', async function () {
      expect(voteCall).to.emit(comments, 'Voted').withArgs(1, 1)
      // emit Voted(commentID, userID);
    })
  })
})
