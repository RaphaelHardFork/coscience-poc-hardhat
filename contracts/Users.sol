//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Contract details
 * @author Sarah, Henry & Raphael
 * @notice contract goal
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

    struct User {
        bytes32 hashedPassword;
        WhiteList status;
        uint256 id;
        uint256 nbOfWallet;
        mapping(uint256 => address) walletList;
        string profileCID;
    }

    //storage
    Counters.Counter private _userID;

    mapping(uint256 => User) private _user;

    //events
    event Registered(address indexed user, uint256 userID);
    event Approved(address indexed user, uint256 userID);

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
        u.nbOfWallet = 1;
        u.status = WhiteList.Pending;
        u.profileCID = profileCID_;
        u.walletList[1] = msg.sender;

        _userID.increment();

        emit Registered(msg.sender, userID);
        return true;
    }

    function acceptUser(address user_, uint256 userID_) public onlyOwner returns (bool) {
        _user[userID_].status = WhiteList.Approved;
        emit Approved(user_, userID_);
        return true;
    }

    function addWallet(address newAddress_, uint256 userID_) public returns (bool) {
        uint256 listLength = _user[userID_].nbOfWallet;
        _user[userID_].walletList[listLength + 1] = newAddress_;
        return true;
    }

    function statusByUserID(uint256 userID) public view returns (WhiteList) {
        return _user[userID].status;
    }

    function profileByUserID(uint256 userID) public view returns (string memory) {
        return _user[userID].profileCID;
    }

    function nbOfWalletByUserID(uint256 userID) public view returns (uint256) {
        return _user[userID].nbOfWallet;
    }

   //recherche array pour address.
    function walletListByUserID(uint256 userID) public view returns () {
        uint256 nbOfWallet = nbOfWalletByUserID(userID);
        address[nbOfWallet]
    }
}

// TODO => mapping address => userID 
/**
contract Array {
    mapping (uint256 => address) private _list;
    uint256 _length = 0;
    
    function fillList(address uno, address dos, address tres) public returns(bool){
        _list[1] = uno;
        _list[2] = dos;
        _list[3] = tres;
        _length = 3;
        return true;
    }
    
    function seeList() public view returns(address[] memory){
        uint256 length = _length;
        uint256 i=1;
        address[] memory a = new address[](length);
        for (i ; i<=length;i++){
          a[i] = _list[i];
        }
        
        return a;
    }

}
 */