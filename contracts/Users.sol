//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  Users and Owners
 * @author Sarah, Henry & Raphael
 *
 * @notice This contract is set to create blockchain identity of users of the CoScience App.
 * @dev Important features:
 *          - Allow users to register more than one wallet
 *          - Recovery user account through a password
 *          - Users have to be validated by a centralized agent (owner)
 *          - Informations of the user are stored on IPFS
 * */

contract Users is Ownable {
    using Counters for Counters.Counter;
    /** @notice Types & storages
     *  @dev enum {WhiteList} is used to set the status of the user
     * */
    enum WhiteList {
        NotApproved,
        Pending,
        Approved
    }

    /**
     * @dev struct User contains the following keys:
     *          - {hashedPassword}: keccak256 hash of the password defined by users
     *          - {status}: user approval status
     *          - {id}: set by Counters.sol
     *          - {walletList}: list of wallets owned by the user
     *          - {profileCID}: CID pointer to user's profile information
     * */
    struct User {
        bytes32 hashedPassword;
        WhiteList status;
        uint256 id;
        address[] walletList;
        string profileCID;
    }

    Counters.Counter private _userID;

    ///@dev A mapping to find user's Struct with the {id}
    mapping(uint256 => User) private _user;

    /// @dev A mapping to get the user ID with the user wallet address
    mapping(address => uint256) private _userIdPointer;

    /**
     * @notice Events
     * @dev Emitted when an user is succesfully registered.
     *
     * At this moment the user still have the Pending status in his account
     * */
    event Registered(address indexed user, uint256 userID);

    /**
     * @dev Emitted when an user is approved by the owner of the contract
     * */
    event Approved(uint256 indexed userID);

    /**
     * @dev Emitted when an user disapproved by the owner.
     * This can happen after this latter was approved
     * */
    event Banned(uint256 indexed userID);

    /**
     * @notice Constructor
     * @dev The parameter {owner_} is set in case the deployer is different from the owner (see Ownable.sol)
     * */
    constructor(address owner_) Ownable() {
        transferOwnership(owner_);
    }

    /**
     * @notice Modifiers
     * @dev This prevent a Pending or Not Approved user to use a function
     *
     * This modifier is set here to be used in other contracts
     * */
    modifier onlyUser() {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved, "Users: you be approved to use this feature.");
        _;
    }

    /**
     * @notice Public functions
     * @dev This function allow a wallet to register as a user
     *
     * Emit a {Registered} event
     *
     * @param hashedPassword_ the hash of the user's password (done in the front-end part)
     * @param profileCID_ the CID hash allowing to get the user's profile informations
     */
    function register(bytes32 hashedPassword_, string memory profileCID_) public returns (bool) {
        _userID.increment();
        uint256 userID = _userID.current();
        User storage u = _user[userID];
        u.hashedPassword = hashedPassword_;
        u.id = userID;
        u.status = WhiteList.Pending;
        u.profileCID = profileCID_;
        u.walletList.push(msg.sender);
        _userIdPointer[msg.sender] = userID;

        emit Registered(msg.sender, userID);
        return true;
    }

    /**
     * @dev This function allows the owner to accept an user which is in Pending status
     *
     * Emit an {Approved} event.
     *
     * @param userID_ user ID is specify to get access to the corresponding Struct User
     */
    function acceptUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status == WhiteList.Pending, "Users: User is not registered");
        _user[userID_].status = WhiteList.Approved;
        emit Approved(userID_);
        return true;
    }

    /**
     * @dev Allows the owner to ban an user (with Pending or Approved status)
     *
     * Emit a {Banned} event
     *
     * @param userID_ user ID is specify to get access to the corresponding Struct User
     */
    function banUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status != WhiteList.NotApproved, "Users: User is not registered or already banned");
        _user[userID_].status = WhiteList.NotApproved;
        emit Banned(userID_);
        return true;
    }

    /**
     * @dev This function allow an user to add another wallet to be linked with his profile
     *
     * This function is set a security feature for unexperienced user which could lost his access to his wallet.
     * The list of wallet is stored in the User Struct
     *
     * @param newAddress the new wallet address specified by the user
     */
    function addWallet(address newAddress) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved, "Users: your must be approved to add wallet");
        _user[userID].walletList.push(newAddress);
        _userIdPointer[newAddress] = userID;
        return true;
    }

    /** NATSPEC RAPH STOP HERE
     * @dev function to change and add a new password, if user forgot
     * @param newPassword replace the previous if it's different from the first one.
     */
    function changePassword(bytes32 newPassword) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].hashedPassword != newPassword, "Users: Passwords must be different");
        _user[userID].hashedPassword = newPassword;
        return true;
    }

    /**
     * @dev function to permit a user to recover a forgotten wallet.
     * @param password verify the password
     * @param userID verify the ID
     */
    function forgetWallet(bytes32 password, uint256 userID) public returns (bool) {
        require(password == _user[userID].hashedPassword, "Users: Incorrect password");
        _user[userID].walletList.push(msg.sender);
        _userIdPointer[msg.sender] = userID;
        return true;
    }

    ///@dev functions to get details and public info about the user
    function profileID(address account) public view returns (uint256) {
        return _userIdPointer[account];
    }

    function statusByUserID(uint256 userID) public view returns (WhiteList) {
        return _user[userID].status;
    }

    function profileByUserID(uint256 userID) public view returns (string memory) {
        return _user[userID].profileCID;
    }

    function nbOfWalletByUserID(uint256 userID) public view returns (uint256) {
        return _user[userID].walletList.length;
    }

    function walletListByUserID(uint256 userID) public view returns (address[] memory) {
        return _user[userID].walletList;
    }
}
