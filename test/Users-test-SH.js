/* eslint-disable comma-dangle */
/* eslint-disable no-unused-vars */
const { expect } = require('chai')
const { ethers } = require('hardhat')

const CONTRACT_NAME = 'Users'
const ADDRESS_ZERO = ethers.constants.AddressZero
const HASHED_PASSWORD = ethers.utils.id('password')
const NEW_HASHED_PASSWORD = ethers.utils.id('password2')

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
      registerCall1 = await users
        .connect(wallet1)
        .register(HASHED_PASSWORD, CID, CID)
    })

    it('should emit a Registered event', async function () {
      expect(registerCall1)
        .to.emit(users, 'Registered')
        .withArgs(wallet1.address, 1)
    })

    it('should fill the struct properly', async function () {
      expect(await users.userStatus(1), 'status').to.equal(1) // 1 = Pending
      expect(await users.userProfile(1), 'profileCID').to.equal(CID)
      expect(await users.userNbOfWallet(1), 'nbOfWallet').to.equal(1)
      const walletTab = await users.userWalletList(1)
      expect(walletTab[0], 'walletList').to.equal(wallet1.address)
    })

    it('should fill the pointer mapping', async function () {
      expect(await users.profileID(wallet1.address)).to.equal(1)
    })

    it('should increment the number of ID', async function () {
      expect(await users.nbOfUsers()).to.equal(1)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
      expect(await users.nbOfUsers()).to.equal(2)
    })

    it('should revert if wallet is already registered', async function () {
      await expect(
        users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      ).to.be.revertedWith('Users: this wallet is already registered')
    })
  })

  describe('acceptUser', function () {
    let acceptUserCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      acceptUserCall = await users.connect(owner).acceptUser(1)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
    })

    it('should change the status', async function () {
      expect(await users.userStatus(1)).to.equal(2) // 2 = Approved
    })

    it('should change isUser boolean return when user is approved by owner', async function () {
      expect(await users.connect(wallet1).isUser(wallet2.address)).to.equal(
        false
      )
      await users.connect(wallet3).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(3)
      expect(await users.connect(wallet1).isUser(wallet3.address)).to.equal(
        true
      )
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
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)
      banUserCall = await users.connect(owner).banUser(1)
    })

    it('should change the status', async function () {
      expect(await users.userStatus(1)).to.equal(0) // 0 = Not Approved
    })

    it('should change isUser boolean return when user is banned by owner', async function () {
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(2)
      expect(await users.connect(wallet1).isUser(wallet2.address)).to.equal(
        true
      )
      await users.connect(owner).banUser(2)
      expect(await users.connect(wallet1).isUser(wallet2.address)).to.equal(
        false
      )
    })

    it('should emit banned user by ID', async function () {
      expect(banUserCall).to.emit(users, 'Banned').withArgs(1)
    })

    it('should revert if it not the owner', async function () {
      await expect(users.connect(wallet2).banUser(2)).to.be.revertedWith(
        'Ownable:'
      )
    })

    it('should revert if user is not registered or already banned', async function () {
      await expect(users.connect(owner).banUser(3)).to.be.revertedWith(
        'Users: user is not registered or already banned'
      )
      await expect(users.connect(owner).banUser(1)).to.be.revertedWith(
        'Users: user is not registered or already banned'
      )
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
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)
      addWalletCall = await users.connect(wallet1).addWallet(wallet3.address)
      await users.connect(wallet1).addWallet(wallet4.address)
      await users.connect(wallet1).addWallet(wallet5.address)
      await users.connect(wallet1).addWallet(wallet6.address)
    })

    it('should add the wallet in the array', async function () {
      const walletArray = await users.userWalletList(0)
      walletArray.forEach((elem, index) => {
        expect(elem, index).to.equal(walletOfUser1[index])
      })
    })

    it('should add the pointer', async function () {
      const walletArray = await users.userWalletList(0)
      walletArray.forEach(async (address, index) => {
        expect(await users.profileID(address), index).to.equal(1)
      })
    })

    it('should revert if not approved', async function () {
      await expect(
        users.connect(wallet2).addWallet(wallet3.address)
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
    })

    it('should revert if the added address already exist in the walletlist', async function () {
      await expect(
        users.connect(wallet1).addWallet(wallet3.address)
      ).to.be.revertedWith('Users: this wallet is already registered')
    })
  })

  describe('changePassword', function () {
    let changePasswordCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)

      changePasswordCall = await users
        .connect(wallet1)
        .changePassword(NEW_HASHED_PASSWORD)
    })

    it('should revert if not registered or not approved', async function () {
      await expect(
        users.connect(wallet2).changePassword(NEW_HASHED_PASSWORD),
        'not approved'
      ).to.be.revertedWith('Users:')
      await expect(
        users.connect(wallet3).changePassword(NEW_HASHED_PASSWORD),
        'not registered'
      ).to.be.revertedWith('Users:')
    })

    it('should revert if same new password', async function () {
      await expect(
        users.connect(wallet1).changePassword(NEW_HASHED_PASSWORD)
      ).to.be.revertedWith('Users: Passwords must be different')
    })
  })

  describe('forgotWallet', function () {
    let forgotWalletCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID) // [wallet1.address]
      await users.connect(owner).acceptUser(1)
      forgotWalletCall = await users
        .connect(wallet3)
        .forgotWallet(HASHED_PASSWORD, 1) // [wallet1.address, wallet3.address]
    })

    it('should add the wallet in the list of user 1', async function () {
      const walletList = await users.userWalletList(1)
      expect(walletList[1]).to.equal(wallet3.address)
    })

    it('should add the pointer', async function () {
      expect(await users.profileID(wallet3.address)).to.equal(1)
    })

    it('should revert if wrong password', async function () {
      await expect(
        users.connect(wallet4).forgotWallet(NEW_HASHED_PASSWORD, 1),
        'wrong password'
      ).to.be.revertedWith('Users: incorrect password')
    })

    it('should emit a ProfileRecovered event', async function () {
      expect(forgotWalletCall)
        .to.emit(users, 'ProfileRecovered')
        .withArgs(wallet3.address, 1)
      // await expect(contract.function()) => TX test (revert or event emit)
      // expect(await contract.function()) => function (result) test
    })
  })

  describe('editProfile', function () {
    let editProfileCall
    beforeEach(async function () {
      await users.connect(wallet1).register(HASHED_PASSWORD, CID, CID)
      await users.connect(owner).acceptUser(1)
      editProfileCall = await users.connect(wallet1).editProfile('newCID')
    })

    it('should change the struct', async function () {
      expect(await users.userProfile(1)).to.equal('newCID')
    })

    it('should emit an Edited event', async function () {
      expect(editProfileCall)
        .to.emit(users, 'Edited')
        .withArgs(wallet1.address, 1, 'newCID')
    })

    it('should revert if not registered or pending', async function () {
      await expect(
        users.connect(wallet2).editProfile('newCID')
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
      await users.connect(wallet2).register(HASHED_PASSWORD, CID, CID)
      await expect(
        users.connect(wallet2).editProfile('newCID')
      ).to.be.revertedWith('Users: you must be approved to use this feature.')
    })
  })
})
