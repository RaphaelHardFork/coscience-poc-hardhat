//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  Users and Owners
 * @author Sarah, Henry & Raphael
 * @notice you can use this contract to define users details and approved
 * @dev This contract is used to identify user on the Dapp
 * */

contract Users is Ownable {
    using Counters for Counters.Counter;
    ///@notice enum that listing status of about a user process acceptation.
    enum WhiteList {
        NotApproved,
        Pending,
        Approved
    }

    //for owner admin, at the end of the code.
    bool public stopped = false;

    ///@notice data structure that stores a user.
    struct User {
        string username;
        bytes32 hashedPassword;
        WhiteList status;
        uint256 id;
        address[] walletList;
        string profileCID;
    }

    ///@dev Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number of elements in a mapping, issuing ERC721 ids, or counting request ids.
    Counters.Counter private _userID;

    ///@dev it maps the user's wallet address with user ID
    mapping(uint256 => User) private _user;
    mapping(address => uint256) private _userIdPointer;
    mapping(string => bool) private _usernames;

    ///@dev events first one for when an user is registered and second when approved.
    event Registered(address indexed user, uint256 userID);
    event Approved(uint256 indexed userID);
    event Banned(uint256 indexed userID);
    event ChangedPassword(uint256 indexed userID, bytes32 oldPassword, bytes32 newPassword);

    ///@dev the owner account will be the one that deploys the contract but change with {transferOwnership}.
    constructor(address owner_) Ownable() {
        transferOwnership(owner_);
    }

    //modifier
    modifier onlyUser(){
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved, "Users: you be approved to use this feature.");
        _;
    }

    modifier usernameTaken(string memory username){require(!_usernames[username],"Username already taken"); _;}

    //utils
    //external => public => private => pure function
    /**
     * @dev function to register a new user
     * @param hashedPassword_ the password entered by user and hashed
     * @param profileCID_ ?
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

    /// @notice Check username available or not
    /// @param  _username username to Check
    /// @return status true or false
    function usernameAvailable(string memory _username) public view returns(bool status){
        return !_usernames[_username];
    }

    /**
     * @dev function to accept user
     * @param userID_ verify status of the user
     * @custom:approved , emitting the event that a new user has been registered
     */
    function acceptUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status == WhiteList.Pending, "Users: User is not registered");
        _user[userID_].status = WhiteList.Approved;
        emit Approved(userID_);
        return true;
    }

    /**
    * @dev function to ban user
    * @param userID_ verify status of the user
    * @custom:banned , emitting the event that a user has been banned
    */
    function banUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status != WhiteList.NotApproved, "Users: User is not registered or already banned");
        _user[userID_].status = WhiteList.NotApproved;
        emit Banned(userID_);
        return true;
    }

    /**
     * @dev function to add a wallet
     * @param newAddress_ is push in walletList if approved
     */
    function addWallet(address newAddress_) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved, "Users: your must be approved to add wallet");
        _user[userID].walletList.push(newAddress_);
        _userIdPointer[newAddress_] = userID;
        return true;
    }

    /**
     * @dev function to change and add a new password, if user forgot
     * @param newPassword replace the previous if it's different from the first one.
     */
    function changePassword(bytes32 newPassword) public returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        require(_user[userID].status == WhiteList.Approved || _user[userID].status == WhiteList.Pending, "Users: your must be approved or pending to change password");
        require(_user[userID].hashedPassword != newPassword, "Users: Passwords must be different");
        _user[userID].hashedPassword = newPassword;
        emit ChangedPassword(userID, _user[userID].hashedPassword, newPassword);
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
/*
****************************************Owner Admin ******************************************************************************************
*/
    /// @notice Get balance of contract 
    /// @return balance of contract
    function getBalance()public view onlyOwner() returns(uint balance){
        return address(this).balance;
    }
    
    function stopDapp() public onlyOwner{
        require(!stopped,"Already stopped");
        stopped=true;
    }
    
    function startDapp() public onlyOwner{
        require(stopped,"Already started");
        stopped=false;
    }
}
