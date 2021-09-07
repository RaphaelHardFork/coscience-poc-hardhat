// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";

contract DAO is IUsers {
    using Counters for Counters.Counter;

    Users private _users;

    struct Voter {
        address voterAddress;
        bool voted;
        uint256 userID;
        uint256 proposalID;
    }

    struct Proposal {
        uint256 proposalID;
        uint256 newUserID;
        uint256 voteCount;
    }

    //store voter struct for each address
    mapping(address => Voter) private _voter;

    //store proposal struct for each ID
    mapping(uint256 => Proposal) private _proposals;

    constructor(address usersContract) {
        _users = Users(usersContract);
    }

    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    modifier onlyOwner() {
        require(_users.owner() == msg.sender, "Users: caller is not the owner");
        _;
    }

    /// Users
    //acceptUser
    //banUser
    // changePassword ?

    ///Articles
    //banArticle

    ///Reviews
    //banPost

    //Comments
    //banPost
}
