/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

// some tests: https://github.com/RaphaelHardFork/ico-hardhat
// await contract.connect(signer).function()

const CONTRACT_NAME = 'Users'
const ADDRESS_ZERO = ethers.constants.AddressZero
const HASHED_PASSWORD = ethers.utils.id('password')
const CID = 'Qmfdfxchesocnfdfrfdf54SDDFsDS'

describe('Users', function () {
  let Users,
    users,
    dev,
    owner,
    wallet1,
    wallet2,
    wallet3,
    wallet4,
    wallet5,
    wallet6

  beforeEach(async function () {
    ;[dev, owner, wallet1, wallet2, wallet3, wallet4, wallet5, wallet6] =
      await ethers.getSigners()
    Users = await ethers.getContractFactory(CONTRACT_NAME)
    users = await Users.connect(dev).deploy(owner.address)
    await users.deployed()
  })

  describe('Deployment', function () {
    it('should asign owner as the owner', async function () {
      expect(await users.owner()).to.equal(owner.address)
    })
  })

  describe('Register', function () {
    let registerCall
    beforeEach(async function () {
      registerCall = await users.connect(wallet1).register(HASHED_PASSWORD, CID)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID)
    })

    it('should emit a Registered event', async function () {
      expect(registerCall)
        .to.emit(users, 'Registered')
        .withArgs(wallet1.address, 0)
    })

    it('should fill the struct properly for user 0', async function () {
      const struct = await users.userInfo(0)
      expect(struct.hashedPassword, 'password').to.equal(HASHED_PASSWORD)
      expect(struct.id, 'id').to.equal(0)
      expect(struct.status, 'status').to.equal(1)
      expect(struct.walletList[0], 'wallets').to.equal(wallet1.address)
      expect(struct.profileCID, 'CID').to.equal(CID)
    })

    it('should fill the struct properly for user 1', async function () {
      const struct = await users.userInfo(1)
      expect(struct.hashedPassword, 'password').to.equal(HASHED_PASSWORD)
      expect(struct.id, 'id').to.equal(1)
      expect(struct.status, 'status').to.equal(1)
      expect(struct.walletList[0], 'wallets').to.equal(wallet2.address)
      expect(struct.profileCID, 'CID').to.equal(CID)
    })

    it('should fill the pointer mapping', async function () {
      expect(await users.profileID(wallet1.address)).to.equal(0)
    })
  })

  describe('acceptUser', function () {
    let acceptUserCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID)
      acceptUserCall = await users.connect(owner).acceptUser(0)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID)
    })

    it('should change the status', async function () {
      const struct = await users.userInfo(0)
      expect(struct.status).to.equal(2)
    })

    it('should emit an Approved event', async function () {
      expect(acceptUserCall).to.emit(users, 'Approved').withArgs(0)
    })

    it('should revert if it not the owner', async function () {
      await expect(users.connect(wallet2).acceptUser(1)).to.be.revertedWith(
        'Ownable:'
      )
    })
  })
  describe('addWallet', function () {
    let addWalletCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID)
      await users.connect(owner).acceptUser(0)
      addWalletCall = await users.connect(wallet1).addWallet(wallet3.address)
      await users.connect(wallet1).addWallet(wallet4.address)
      await users.connect(wallet1).addWallet(wallet5.address)
      await users.connect(wallet1).addWallet(wallet6.address)
    })

    it('should add the wallet in the array', async function () {
      const walletOfUser = [
        wallet1.address,
        wallet3.address,
        wallet4.address,
        wallet5.address,
        wallet6.address,
      ]
      const walletArray = await users.walletListByUserID(0)
      walletArray.forEach((elem, index) => {
        expect(elem, index).to.equal(walletOfUser[index])
      })
    })

    it('should assign to the write userID', async function () {
      expect(await users.profileID(wallet3.address)).to.equal(0)
    })

    it('should add the pointer')
    it('should revert if not approved', async function () {
      await expect()
    })
    // TODO
    // Change struct to one getter
    // ban user function
    // forgotWallet function
    // changePassword
  })
})
