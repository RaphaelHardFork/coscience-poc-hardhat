//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUsers.sol";
import "./Users.sol";
import "./Articles.sol";
import "./Reviews.sol";
import "./Comments.sol";

contract Governance is IUsers {
    Users private _users;
    Articles private _articles;
    Reviews private _reviews;
    Comments private _comments;

    // quorum for one item
    mapping(uint256 => uint8) private _acceptUserQuorum;
    mapping(uint256 => uint8) private _banUserQuorum;

    mapping(address => mapping(uint256 => uint8)) private _itemQuorum;

    mapping(uint256 => mapping(address => uint8)) private _recoverQuorum;

    // has voted userID => userID(pending) => bool
    mapping(uint256 => mapping(uint256 => bool)) private _acceptUserVote;
    mapping(uint256 => mapping(uint256 => bool)) private _banUserVote;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _recoverVote;

    mapping(address => mapping(uint256 => mapping(uint256 => bool))) private _itemVote;

    event Voted(address indexed contractAddress, uint256 indexed itemID, uint256 indexed userID);
    event UserVoted(uint8 indexed voteType, uint256 indexed subjectUserID, uint256 indexed userID);
    event RecoverVoted(uint256 indexed idToRecover, address indexed newAddress, uint256 indexed userID);

    constructor(
        address users,
        address articles,
        address reviews,
        address comments
    ) {
        _users = Users(users);
        _articles = Articles(articles);
        _reviews = Reviews(reviews);
        _comments = Comments(comments);
    }

    function voteToAcceptUser(uint256 pendingUserID) public returns (bool) {
        require(_users.userStatus(pendingUserID) == WhiteList.Pending, "Governance: user have not the pending status");
        uint256 userID = _users.profileID(msg.sender);
        require(_acceptUserVote[userID][pendingUserID] == false, "Governance: you already vote to approve this user.");

        if (_acceptUserQuorum[pendingUserID] < 5) {
            _acceptUserQuorum[pendingUserID] += 1;
            _acceptUserVote[userID][pendingUserID] = true;
        } else {
            _users.acceptUser(pendingUserID);
        }
        emit UserVoted(0, pendingUserID, userID);
        return true;
    }

    function voteToBanUser(uint256 userIdToBan) public returns (bool) {
        require(_users.userStatus(userIdToBan) == WhiteList.NotApproved, "Governance: user must be approved to vote");
        uint256 userID = _users.profileID(msg.sender);
        require(_banUserVote[userID][userIdToBan] == false, "Governance: you already vote to ban this user.");

        if (_banUserQuorum[userIdToBan] < 5) {
            _banUserQuorum[userIdToBan] += 1;
            _banUserVote[userID][userIdToBan] = true;
        } else {
            _users.banUser(userIdToBan);
        }
        emit UserVoted(1, userIdToBan, userID);
        return true;
    }

    function voteForRecover(uint256 idToRecover, address newAddress) public returns (bool) {
        uint256 userID = _users.profileID(msg.sender);
        require(
            _recoverVote[userID][idToRecover][newAddress] == false,
            "Governance: you already vote to recover this account"
        );
        if (_recoverQuorum[idToRecover][newAddress] < 5) {
            _recoverQuorum[idToRecover][newAddress] += 1;
            _recoverVote[userID][idToRecover][newAddress] = true;
        } else {
            _users.recoverAccount(idToRecover, newAddress);
        }
        emit RecoverVoted(idToRecover, newAddress, userID);
        return true;
    }

    function voteToBanArticle(uint256 articleID) public returns (bool) {
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_articles)][userID][articleID] == false,
            "Governance: you already vote to ban this article"
        );
        if (_itemQuorum[address(_articles)][articleID] < 5) {
            _itemQuorum[address(_articles)][articleID] += 1;
            _itemVote[address(_articles)][userID][articleID] = true;
        } else {
            _articles.banArticle(articleID);
        }
        emit Voted(address(_articles), articleID, userID);
        return true;
    }

    function voteToBanReview(uint256 reviewID) public returns (bool) {
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_reviews)][userID][reviewID] == false,
            "Governance: you already vote to ban this review"
        );
        if (_itemQuorum[address(_reviews)][reviewID] < 5) {
            _itemQuorum[address(_reviews)][reviewID] += 1;
            _itemVote[address(_reviews)][userID][reviewID] = true;
        } else {
            _reviews.banPost(reviewID);
        }
        emit Voted(address(_reviews), reviewID, userID);

        return true;
    }

    function voteToBanComment(uint256 commentID) public returns (bool) {
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_comments)][userID][commentID] == false,
            "Governance: you already vote to ban this comment"
        );
        if (_itemQuorum[address(_comments)][commentID] < 5) {
            _itemQuorum[address(_comments)][commentID] += 1;
            _itemVote[address(_comments)][userID][commentID] = true;
        } else {
            _comments.banPost(commentID);
        }
        emit Voted(address(_comments), commentID, userID);
        return true;
    }
}