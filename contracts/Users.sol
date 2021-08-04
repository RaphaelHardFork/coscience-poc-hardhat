//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Contract details
 * @author Sarah, Henry & Raphael
 * @notice Contract goal
 * @dev This contract is used to identify user on the Dapp
 * */

contract Users is Ownable {
    //type
    using Counters for Counters.Counter;
    enum WhiteList {
        NotApproved,
        Pending,
        Approved
    }
    /**
     * @notice User struct
     * @dev The is for...
     */
    struct User {
        bytes32 hashedPassword;
        WhiteList status;
        uint256 id;
        address[] walletList;
        string profileCID;
    }

    //storage
    Counters.Counter private _userID;

    mapping(uint256 => User) private _user;
    mapping(address => uint256) private _userIdPointer;

    //events
    event Registered(address indexed user, uint256 userID);
    event Approved(uint256 indexed userID);

    //constructor
    constructor(address owner_) Ownable() {
        transferOwnership(owner_);
    }

    //modifier

    //utils
    //external => public => private => pure function
    function register(bytes32 hashedPassword_, string memory profileCID_) public returns (bool) {
        uint256 userID = _userID.current();
        User storage u = _user[userID];
        u.hashedPassword = hashedPassword_;
        u.id = userID;
        u.status = WhiteList.Pending;
        u.profileCID = profileCID_;
        u.walletList.push(msg.sender);
        _userIdPointer[msg.sender] = userID;

        _userID.increment();
        emit Registered(msg.sender, userID);
        return true;
    }

    function acceptUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status == WhiteList.Pending, "Users: User is not registered");
        _user[userID_].status = WhiteList.Approved;
        emit Approved(userID_);
        return true;
    }

    function addWallet(address newAddress_) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved, "Users: your must be approved to add wallet");
        _user[userID].walletList.push(newAddress_);
        _userIdPointer[newAddress_] = userID;
        return true;
    }

    function changePassword(bytes32 newPassword) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].hashedPassword != newPassword, "Users: Passwords must be different");
        _user[userID].hashedPassword = newPassword;
        return true;
    }

    function forgetWallet(bytes32 password, uint256 userID) public returns (bool) {
        require(password == _user[userID].hashedPassword, "Users: Incorrect password");
        _user[userID].walletList.push(msg.sender);
        _userIdPointer[msg.sender] = userID;
        return true;
    }

    function profileID(address account) public view returns (uint256) {
        return _userIdPointer[account];
    }

    function userInfo(uint256 userID) public view returns (User memory) {
        return _user[userID];
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
