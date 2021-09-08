const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Governance'
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Governance', function () {
  let governance,
    users,
    dev,
    owner,
    voter1,
    voter2,
    voter3,
    voter4,
    voter5,
    newComer1,
    newComer2
  beforeEach(async function () {
    ;[
      dev,
      owner,
      voter1,
      voter2,
      voter3,
      voter4,
      voter5,
      newComer1,
      newComer2,
    ] = await ethers.getSigners()

    const Users = await ethers.getContractFactory('Users')
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()

    const Articles = await ethers.getContractFactory('Articles')
    const articles = await Articles.connect(dev).deploy(users.address)
    await articles.deployed()

    // get address of deployed contracts
    const Reviews = await ethers.getContractFactory('Reviews')
    const reviewsAddress = await articles.reviewsAddress() // function Articles.sol
    const reviews = await Reviews.attach(reviewsAddress)

    const Comments = await ethers.getContractFactory('Comments')
    const commentsAddress = await articles.commentsAddress()
    const comments = await Comments.attach(commentsAddress)

    await users.setContracts(
      articles.address,
      reviews.address,
      comments.address
    )

    const Governance = await ethers.getContractFactory(CONTRACT_NAME)
    const governanceAddress = await users.governanceAddress()
    governance = await Governance.attach(governanceAddress)

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
      expect(await governance.quorumAccept(6)).to.equal(3) // count start at 0
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
      await governance.connect(voter5).voteToAcceptUser(6) // EMIT USER ACCEPTED
      const struct = await users.userInfo(6)
      expect(struct.status).to.equal(2) // 2 = Approved
    })
  })
})
