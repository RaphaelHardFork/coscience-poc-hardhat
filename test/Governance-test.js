/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Governance'
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Governance', function () {
  let governance,
    users,
    articles,
    reviews,
    comments,
    dev,
    owner,
    voter1,
    voter2,
    voter3,
    voter4,
    voter5,
    voter6,
    newComer1,
    newComer2,
    newWallet1,
    newWallet2
  beforeEach(async function () {
    ;[
      dev,
      owner,
      voter1,
      voter2,
      voter3,
      voter4,
      voter5,
      voter6,
      newComer1,
      newComer2,
      newWallet1,
      newWallet2,
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

    const Comments = await ethers.getContractFactory('Comments')
    comments = await Comments.connect(dev).deploy(
      users.address,
      articles.address,
      reviews.address
    )
    await comments.deployed()

    // Set contracts address
    await articles.setContracts(reviews.address, comments.address)

    const Governance = await ethers.getContractFactory(CONTRACT_NAME)
    governance = await Governance.connect(dev).deploy(
      users.address,
      articles.address,
      reviews.address,
      comments.address
    )

    // Set Contracts
    await users.setContracts(governance.address)
    // END OF DEPLOYMENT

    // Initiate the governance
    await users.connect(voter1).register(CID, CID)
    await users.connect(voter2).register(CID, CID)
    await users.connect(voter3).register(CID, CID)
    await users.connect(voter4).register(CID, CID)
    await users.connect(voter5).register(CID, CID)
    await users.connect(owner).acceptUser(1)
    await users.connect(owner).acceptUser(2)
    await users.connect(owner).acceptUser(3)
    await users.connect(owner).acceptUser(4)
    await users.connect(owner).acceptUser(5) // transfer ownership
  })

  describe('Deployment', function () {
    it('should transfer ownership to governance', async function () {
      expect(await users.owner()).to.equal(governance.address)
    })
  })

  describe('vote to accept user', function () {
    let acceptUserCall
    beforeEach(async function () {
      await users.connect(newComer1).register(CID, CID)
      // vote for accept
      acceptUserCall = await governance.connect(voter1).voteToAcceptUser(6)
      await governance.connect(voter2).voteToAcceptUser(6)
      await governance.connect(voter3).voteToAcceptUser(6)
      await governance.connect(voter4).voteToAcceptUser(6)
      // await governance.connect(voter5).voteToAcceptUser(6) // should trigger acceptUser
    })

    it('should increment the quorum counter', async function () {
      expect(await governance.quorumAccept(6)).to.equal(4) // count start at 0
    })

    it('should revert if an user try to vote two time', async function () {
      await expect(
        governance.connect(voter2).voteToAcceptUser(6)
      ).to.be.revertedWith('Governance: you already vote to approve this user')
    })

    it('should emit a UserVoted event', async function () {
      expect(acceptUserCall).to.emit(governance, 'UserVoted').withArgs(0, 6, 1)
    })

    it('should trigger function in Users.sol', async function () {
      await expect(
        governance.connect(voter5).voteToAcceptUser(6),
        'emit Approved'
      )
        .to.emit(users, 'Approved')
        .withArgs(6) // EMIT USER ACCEPTED
      const struct = await users.userInfo(6)
      expect(struct.status, 'change struct').to.equal(2) // 2 = Approved
    })

    it('should revert if user is not in Pending status', async function () {
      await expect(
        governance.connect(voter1).voteToAcceptUser(3),
        'already approved'
      ).to.be.revertedWith('Governance: user have not the pending status')
      await expect(
        governance.connect(voter1).voteToAcceptUser(9),
        'not approved'
      ).to.be.revertedWith('Governance: user have not the pending status')
    })

    it('should revert if a non approved try to vote', async function () {
      await expect(
        governance.connect(newComer1).voteToAcceptUser(6)
      ).to.be.revertedWith('Users: you must be approved to use this feature')
    })
  })

  describe('vote to ban a users', function () {
    let banUserCall
    beforeEach(async function () {
      await users.connect(newComer1).register(CID, CID)
      await users.connect(newComer2).register(CID, CID)
      // vote for accept
      await governance.connect(voter1).voteToAcceptUser(6)
      await governance.connect(voter2).voteToAcceptUser(6)
      await governance.connect(voter3).voteToAcceptUser(6)
      await governance.connect(voter4).voteToAcceptUser(6)
      await governance.connect(voter5).voteToAcceptUser(6) // should trigger acceptUser

      // vote to ban
      banUserCall = await governance.connect(voter1).voteToBanUser(6)
      await governance.connect(voter2).voteToBanUser(6)
      await governance.connect(voter3).voteToBanUser(6)
      await governance.connect(voter4).voteToBanUser(6)
    })

    it('should increment the quorum counter', async function () {
      expect(await governance.quorumBan(6)).to.equal(4) // count start at 0
    })

    it('should revert if an user try to vote two time', async function () {
      await expect(
        governance.connect(voter2).voteToBanUser(6)
      ).to.be.revertedWith('Governance: you already vote to ban this user')
    })

    it('should emit a UserVoted event', async function () {
      expect(banUserCall).to.emit(governance, 'UserVoted').withArgs(1, 6, 1)
    })

    it('should trigger function in Users.sol', async function () {
      await expect(governance.connect(voter5).voteToBanUser(6), 'emit Banned')
        .to.emit(users, 'Banned')
        .withArgs(6) // EMIT USER ACCEPTED
      const struct = await users.userInfo(6)
      expect(struct.status, 'change struct').to.equal(0) // 2 = Approved
    })

    it('should revert if user is not in Approved status', async function () {
      await expect(
        governance.connect(voter1).voteToBanUser(7),
        'pending'
      ).to.be.revertedWith('Governance: user must be approved to vote')
      await expect(
        governance.connect(voter1).voteToBanUser(9),
        'not approved'
      ).to.be.revertedWith('Governance: user must be approved to vote')
    })

    it('should revert if a non approved try to vote', async function () {
      await expect(
        governance.connect(newComer2).voteToBanUser(6)
      ).to.be.revertedWith('Users: you must be approved to use this feature')
    })
  })

  describe('vote to recover an account', function () {
    let recoverAccount
    beforeEach(async function () {
      await users.connect(newComer1).register(CID, CID)
      await users.connect(newComer2).register(CID, CID)
      // vote for accept newComer1
      await governance.connect(voter1).voteToAcceptUser(6)
      await governance.connect(voter2).voteToAcceptUser(6)
      await governance.connect(voter3).voteToAcceptUser(6)
      await governance.connect(voter4).voteToAcceptUser(6)
      await governance.connect(voter5).voteToAcceptUser(6) // should trigger acceptUser

      // voter3 lost his wallet => ask off chain to recover wallet with {newWallet1}
      recoverAccount = await governance
        .connect(voter1)
        .voteToRecover(3, newWallet1.address)
      await governance.connect(voter2).voteToRecover(3, newWallet1.address)
      await governance.connect(voter3).voteToRecover(3, newWallet1.address)
      await governance.connect(voter4).voteToRecover(3, newWallet1.address)
    })

    it('should increment the quorum counter', async function () {
      expect(await governance.quorumRecover(3, newWallet1.address)).to.equal(4) // count start at 0
    })

    it('should revert if an user try to vote two time', async function () {
      await expect(
        governance.connect(voter2).voteToRecover(3, newWallet1.address)
      ).to.be.revertedWith(
        'Governance: you already vote to recover this account'
      )
    })

    it('should emit a UserVoted event', async function () {
      expect(recoverAccount)
        .to.emit(governance, 'RecoverVoted')
        .withArgs(3, newWallet1.address, 1)
    })

    it('should trigger function in Users.sol', async function () {
      await expect(
        governance.connect(voter5).voteToRecover(3, newWallet1.address),
        'emit ProfileRecovered'
      )
        .to.emit(users, 'ProfileRecovered')
        .withArgs(newWallet1.address, 3) // EMIT USER ACCEPTED
      const struct = await users.userInfo(3)
      expect(struct.walletList.length, 'add wallet').to.equal(2) // 2 = Approved
    })

    it('should revert if a non approved try to vote', async function () {
      await expect(
        governance.connect(newComer2).voteToRecover(3, newWallet1.address)
      ).to.be.revertedWith('Users: you must be approved to use this feature')
    })
  })

  describe('Vote to ban item', function () {
    // publish article / review / comment with an accepted users (voter1)
    beforeEach(async function () {
      await articles.connect(voter1).publish([], CID, CID)
      await reviews.connect(voter1).post(CID, 1)
      await comments.connect(voter1).post(CID, articles.address, 1)

      // accept a 6th voter
      await users.connect(voter6).register(CID, CID)
      await governance.connect(voter1).voteToAcceptUser(6)
      await governance.connect(voter2).voteToAcceptUser(6)
      await governance.connect(voter3).voteToAcceptUser(6)
      await governance.connect(voter4).voteToAcceptUser(6)
      await governance.connect(voter5).voteToAcceptUser(6)
    })

    describe('vote to ban article', function () {
      let banArticle
      beforeEach(async function () {
        banArticle = await governance.connect(voter2).voteToBanArticle(1)
        await governance.connect(voter3).voteToBanArticle(1)
        await governance.connect(voter4).voteToBanArticle(1)
        await governance.connect(voter5).voteToBanArticle(1)
      })

      it('should revert if voter have already vote to ban the article', async function () {
        await expect(
          governance.connect(voter2).voteToBanArticle(1)
        ).to.be.revertedWith('Governance: you already vote to ban this article')
      })

      it('should increment the quorum counter', async function () {
        expect(await governance.quorumItemBan(articles.address, 1)).to.equal(4)
      })

      it('should emit a Voted event', async function () {
        expect(banArticle)
          .to.emit(governance, 'Voted')
          .withArgs(articles.address, 1, 2)
      })

      it('should revert if a non approved try to vote', async function () {
        await users.connect(newComer1).register(CID, CID)
        await expect(
          governance.connect(newComer1).voteToBanArticle(1)
        ).to.be.revertedWith('Users: you must be approved to use this feature')
      })

      it('should ban the content of the item', async function () {
        await expect(governance.connect(voter6).voteToBanArticle(1))
          .to.emit(articles, 'ArticleBanned')
          .withArgs(1)

        const struct = await articles.articleInfo(1)
        expect(struct.contentBanned, 'content banned').to.equal(true)
      })
    })

    describe('vote to ban review', function () {
      let banReview
      beforeEach(async function () {
        banReview = await governance.connect(voter2).voteToBanReview(1)
        await governance.connect(voter3).voteToBanReview(1)
        await governance.connect(voter4).voteToBanReview(1)
        await governance.connect(voter5).voteToBanReview(1)
      })

      it('should revert if voter have already vote to ban the article', async function () {
        await expect(
          governance.connect(voter2).voteToBanReview(1)
        ).to.be.revertedWith('Governance: you already vote to ban this review')
      })

      it('should increment the quorum counter', async function () {
        expect(await governance.quorumItemBan(reviews.address, 1)).to.equal(4)
      })

      it('should emit a Voted event', async function () {
        expect(banReview)
          .to.emit(governance, 'Voted')
          .withArgs(reviews.address, 1, 2)
      })

      it('should revert if a non approved try to vote', async function () {
        await users.connect(newComer1).register(CID, CID)
        await expect(
          governance.connect(newComer1).voteToBanReview(1)
        ).to.be.revertedWith('Users: you must be approved to use this feature')
      })

      it('should ban the content of the item', async function () {
        await expect(governance.connect(voter6).voteToBanReview(1))
          .to.emit(reviews, 'ReviewBanned')
          .withArgs(1)

        const struct = await reviews.reviewInfo(1)
        expect(struct.contentBanned, 'content banned').to.equal(true)
      })
    })

    describe('vote to ban comment', function () {
      let banComment
      beforeEach(async function () {
        banComment = await governance.connect(voter2).voteToBanComment(1)
        await governance.connect(voter3).voteToBanComment(1)
        await governance.connect(voter4).voteToBanComment(1)
        await governance.connect(voter5).voteToBanComment(1)
      })

      it('should revert if voter have already vote to ban the comment', async function () {
        await expect(
          governance.connect(voter2).voteToBanComment(1)
        ).to.be.revertedWith('Governance: you already vote to ban this comment')
      })

      it('should increment the quorum counter', async function () {
        expect(await governance.quorumItemBan(comments.address, 1)).to.equal(4)
      })

      it('should emit a Voted event', async function () {
        expect(banComment)
          .to.emit(governance, 'Voted')
          .withArgs(comments.address, 1, 2)
      })

      it('should revert if a non approved try to vote', async function () {
        await users.connect(newComer1).register(CID, CID)
        await expect(
          governance.connect(newComer1).voteToBanComment(1)
        ).to.be.revertedWith('Users: you must be approved to use this feature')
      })

      it('should ban the content of the item', async function () {
        await expect(governance.connect(voter6).voteToBanComment(1))
          .to.emit(comments, 'CommentBanned')
          .withArgs(1)

        const struct = await comments.commentInfo(1)
        expect(struct.contentBanned, 'content banned').to.equal(true)
      })
    })
  })
})
