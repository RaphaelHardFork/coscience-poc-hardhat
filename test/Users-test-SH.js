/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Users'
const ADDRESS_ZERO = ethers.constants.AddressZero

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
    let registerCall1
    beforeEach(async function () {
      registerCall1 = await users.connect(wallet1).register(CID, CID)
    })

    it('should emit a Registered event', async function () {
      expect(registerCall1)
        .to.emit(users, 'Registered')
        .withArgs(wallet1.address, 1)
    })

    it('should fill the struct properly', async function () {
      const struct = await users.userInfo(1)

      expect(struct.status, 'status').to.equal(1) // 1 = Pending
      expect(struct.profileCID, 'profileCID').to.equal(CID)
      expect(struct.nameCID, 'nameCID').to.equal(CID)
      expect(struct.walletList.length, 'nbOfWallet').to.equal(1)
      expect(struct.walletList[0], 'walletList').to.equal(wallet1.address)
    })

    it('should fill the pointer mapping', async function () {
      expect(await users.profileID(wallet1.address)).to.equal(1)
    })

    it('should revert if wallet is already registered', async function () {
      await expect(
        users.connect(wallet1).register(CID, CID)
      ).to.be.revertedWith('Users: this wallet is already registered')
    })
  })

  describe('acceptUser', function () {
    let acceptUserCall
    beforeEach(async function () {
      await users.connect(wallet1).register(CID, CID)
      acceptUserCall = await users.connect(owner).acceptUser(1)
      await users.connect(wallet2).register(CID, CID)
    })

    it('should change the status', async function () {
      const struct = await users.userInfo(1)
      expect(struct.status).to.equal(2) // 2 = Approved
    })

    it('should emit an Approved event', async function () {
      expect(acceptUserCall).to.emit(users, 'Approved').withArgs(1)
    })

    it('should revert if it not the owner', async function () {
      await expect(users.connect(wallet2).acceptUser(2)).to.be.revertedWith(
        'Ownable:'
      )
    })

    it('should revert if user is not registered', async function () {
      await expect(
        users.connect(owner).acceptUser(3),
        'not registered'
      ).to.be.revertedWith('Users: user is not registered or already approved')
      await expect(
        users.connect(owner).acceptUser(1),
        'already approved'
      ).to.be.revertedWith('Users: user is not registered or already approved')
    })
  })

  describe('banUser', function () {
    let banUserCall
    beforeEach(async function () {
      await users.connect(wallet1).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      banUserCall = await users.connect(owner).banUser(1)
    })

    it('should change the status', async function () {
      const struct = await users.userInfo(1)
      expect(struct.status).to.equal(0) // 0 = Not Approved
    })

    it('should emit banned user by ID', async function () {
      expect(banUserCall).to.emit(users, 'Banned').withArgs(1)
    })

    it('should revert if it not the owner', async function () {
      await expect(users.connect(wallet2).banUser(2)).to.be.revertedWith(
        'Ownable:'
      )
    })

    it('should revert if user is not registered', async function () {
      await expect(users.connect(owner).banUser(3)).to.be.revertedWith('Users:')
    })
  })

  describe('addWallet', function () {
    let addWalletCall, walletOfUser1
    beforeEach(async function () {
      walletOfUser1 = [
        wallet1.address,
        wallet3.address,
        wallet4.address,
        wallet5.address,
        wallet6.address,
      ]
      await users.connect(wallet1).register(CID, CID)
      await users.connect(wallet2).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      addWalletCall = await users.connect(wallet1).addWallet(wallet3.address)
      await users.connect(wallet1).addWallet(wallet4.address)
      await users.connect(wallet1).addWallet(wallet5.address)
      await users.connect(wallet1).addWallet(wallet6.address)
    })

    it('should add the wallet in the array', async function () {
      const struct = await users.userInfo(1)
      struct.walletList.forEach((elem, index) => {
        expect(elem, index).to.equal(walletOfUser1[index])
      })
    })

    it('should add the pointer', async function () {
      const struct = await users.userInfo(1)
      struct.walletList.forEach(async (address, index) => {
        expect(await users.profileID(address), index).to.equal(1)
      })
    })

    it('should revert if not approved', async function () {
      await expect(
        users.connect(wallet2).addWallet(wallet3.address)
      ).to.be.revertedWith('Users:')
    })
  })

  describe('recoverAccount', function () {
    let recoverAccountCall
    beforeEach(async function () {
      await users.connect(wallet1).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      recoverAccountCall = await users
        .connect(owner)
        .recoverAccount(1, wallet5.address)
    })

    it('should add the wallet in the list of user 1', async function () {
      const struct = await users.userInfo(1)
      expect(struct.walletList[1]).to.equal(wallet5.address)
    })

    it('should add the pointer', async function () {
      expect(await users.profileID(wallet5.address)).to.equal(1)
    })

    it('should emit a ProfileRecovered event', async function () {
      expect(recoverAccountCall)
        .to.emit(users, 'ProfileRecovered')
        .withArgs(wallet5.address, 1)
    })

    it('should revert if its not the owner', async function () {
      await expect(
        users.connect(wallet3).recoverAccount(1, wallet4.address)
      ).to.be.revertedWith('Ownable:')
    })

    it('should revert if wallet is already registered', async function () {
      await expect(
        users.connect(owner).recoverAccount(1, wallet1.address)
      ).to.be.revertedWith('Users: this wallet is already registered')
    })

    it('should revert if user is not approved', async function () {
      await expect(
        users.connect(owner).recoverAccount(3, wallet6.address)
      ).to.be.revertedWith('Users: user must be approved')
    })
  })

  describe('editProfile', function () {
    let editProfileCall
    beforeEach(async function () {
      await users.connect(wallet1).register(CID, CID)
      await users.connect(owner).acceptUser(1)
      editProfileCall = await users.connect(wallet1).editProfile('newCID')
    })

    it('should change the struct', async function () {
      const struct = await users.userInfo(1)
      expect(struct.profileCID).to.equal('newCID')
    })

    it('should emit an Edited event', async function () {
      expect(editProfileCall)
        .to.emit(users, 'Edited')
        .withArgs(wallet1.address, 1, 'newCID')
    })
  })
})
