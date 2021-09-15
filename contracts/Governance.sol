//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUsers.sol";
import "./Users.sol";
import "./Articles.sol";
import "./Reviews.sol";
import "./Comments.sol";

/**
 * @title   Governance
 * @author  Sarah, Henry & Raphael
 * @notice  This contract is set to give a decentralized governance to take descision on the CoScience dApp
 *          This is a restricted governance where vote are available only on few functions of Users.sol, Articles.sol,
 *          Reviews.sol and Comments.sol
 * @dev     Important features:
 *              - A quorum of 5 votes is set to trigger functions
 *              - This contract become the owner of the fourth others contracts when 5 users
 *              are accepted by the owner in Users.sol
 * */
contract Governance is IUsers {
    /**
     * @notice  State variables
     * @dev     {QUORUM} is a constant corresponding to the number of votes needed
     * */
    uint8 public constant QUORUM = 4;

    /// @dev    Users.sol, Articles.sol, Reviews.sol and Comments.sol contracts are used to do external call on these contract
    Users private _users;
    Articles private _articles;
    Reviews private _reviews;
    Comments private _comments;

    /**
     * @notice  Events
     * @dev     Emitted when an user vote to ban an item (article, comment or review)
     * @param   contractAddress address of the contract (Article.sol,Reviews.sol or Comments.sol)
     * @param   itemID          ID of the item
     * @param   userID          user ID of the voter
     * */
    event Voted(address indexed contractAddress, uint256 indexed itemID, uint256 indexed userID);

    /**
     * @dev     Emitted when an user vote for accept or ban an other user
     *
     * @param   voteType        the type of vote (0 for accept and 1 for ban)
     * @param   subjectUserID   ID of the user who is voted
     * @param   userID          user ID of the voter
     * */
    event UserVoted(uint8 indexed voteType, uint256 indexed subjectUserID, uint256 indexed userID);

    /**
     * @dev     Emitted when an user vote for recover a profile with a new address
     *
     * @param   idToRecover id of the user who want to recover his account
     * @param   newAddress  new address of the user who want to recover his account
     * @param   userID      user ID of the voter
     * */
    event RecoverVoted(uint256 indexed idToRecover, address indexed newAddress, uint256 indexed userID);

    /**
     * @dev     Emitted when an user ask for recover his profile with a new address
     *
     * @param   newAddress  new address of the user who want to recover his account
     * @param   idToRecover id of the user who want to recover his account
     * */
    event AskForRecover(address indexed newAddress, uint256 indexed idToRecover);

    /**
     * @notice  Modifiers
     * @dev     This modifier prevent a Pending or Not approved user to call a function
     *          it uses the state of Users.sol
     * */
    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    /// @dev    This modifier prevent an user to vote before the governance is set
    modifier beforeGovernance() {
        require(_users.owner() == address(this), "Governance: governance is not set");
        _;
    }

    /**
     * @notice  Structs, Enum and Arrays
     * @dev     Mappings to count the number of votes to accept or ban an user with his ID
     * */
    mapping(uint256 => uint8) private _acceptUserQuorum;
    mapping(uint256 => uint8) private _banUserQuorum;

    /**
     * @dev Mapping to count the number of votes on an item with his ID
     *      Item corresponding to either Articles.sol, Reviews.sol or Comments.sol
     */
    mapping(address => mapping(uint256 => uint8)) private _itemQuorum;

    /// @dev    Mapping to count the number of votes to recover the profile of an user with a new address
    mapping(uint256 => mapping(address => uint8)) private _recoverQuorum;

    /// @dev    Mappings to check if an user have already voted on a proposal
    mapping(uint256 => mapping(uint256 => bool)) private _acceptUserVote;
    mapping(uint256 => mapping(uint256 => bool)) private _banUserVote;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _recoverVote;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) private _itemVote;

    /**
     * @notice  Constructor
     * @dev     This contract is deployed after these four contracts are deployed
     *
     * @param   users       address of Users.sol
     * @param   articles    address of Articles.sol
     * @param   reviews     address of Reviews.sol
     * @param   comments    address of Comments.sol
     * */
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

    /**
     * @notice  Public functions
     * @dev     This function allow users to vote for accept an user
     *          After 5 vote this function call {acceptUser()} in Users.sol
     *
     *          Emit a {UserVoted} event
     *
     * @param   pendingUserID   pending user ID
     */
    function voteToAcceptUser(uint256 pendingUserID) public onlyUser beforeGovernance returns (bool) {
        require(_users.userStatus(pendingUserID) == WhiteList.Pending, "Governance: user have not the pending status");
        uint256 userID = _users.profileID(msg.sender);
        require(_acceptUserVote[userID][pendingUserID] == false, "Governance: you already vote to approve this user.");

        if (_acceptUserQuorum[pendingUserID] < QUORUM) {
            _acceptUserQuorum[pendingUserID] += 1;
            _acceptUserVote[userID][pendingUserID] = true;
        } else {
            _users.acceptUser(pendingUserID);
        }
        emit UserVoted(0, pendingUserID, userID);
        return true;
    }

    /**
     * @dev     This function allow users to vote for ban an user
     *          After 5 vote this function call {banUser()} in Users.sol
     *
     *          Emit a {UserVoted} event
     *
     * @param   userIdToBan user ID to ban
     */
    function voteToBanUser(uint256 userIdToBan) public onlyUser beforeGovernance returns (bool) {
        require(_users.userStatus(userIdToBan) == WhiteList.Approved, "Governance: user must be approved to vote");
        uint256 userID = _users.profileID(msg.sender);
        require(_banUserVote[userID][userIdToBan] == false, "Governance: you already vote to ban this user.");

        if (_banUserQuorum[userIdToBan] < QUORUM) {
            _banUserQuorum[userIdToBan] += 1;
            _banUserVote[userID][userIdToBan] = true;
        } else {
            _users.banUser(userIdToBan);
        }
        emit UserVoted(1, userIdToBan, userID);
        return true;
    }

    // no check if wallet is already registered... will be reverted at the end of the vote in that case
    /**
     * @dev     This function allow an user to ask for recover his account with a new address
     *          This function only emit an event to inform the community for this demand
     *          There is no check to see if the new wallet is already registered,
     *          the transaction will be reverted when the vote will be ended
     *
     *          Emit a {AskForRecover} event
     *
     * @param   idToRecover user ID of the profile wanted to be recovered
     */
    function askToRecoverAccount(uint256 idToRecover) public beforeGovernance returns (bool) {
        require(_users.userStatus(idToRecover) == WhiteList.Approved, "Governance: user must be approved to vote");
        emit AskForRecover(msg.sender, idToRecover);
        return true;
    }

    /**
     * @dev     This function allow users to vote to recover a profile with a new address
     *          After 5 vote this function call {recoverAccount()} in Users.sol
     *          The voter need to know the new address of the user who want to recover his account
     *
     *          Emit a {RecoverVoted} event
     *
     * @param   idToRecover  the account ID to recover
     * @param   newAddress   the new address
     */
    function voteToRecover(uint256 idToRecover, address newAddress) public onlyUser beforeGovernance returns (bool) {
        require(_users.userStatus(idToRecover) == WhiteList.Approved, "Governance: user must be approved to vote");
        uint256 userID = _users.profileID(msg.sender);
        require(
            _recoverVote[userID][idToRecover][newAddress] == false,
            "Governance: you already vote to recover this account"
        );
        if (_recoverQuorum[idToRecover][newAddress] < QUORUM) {
            _recoverQuorum[idToRecover][newAddress] += 1;
            _recoverVote[userID][idToRecover][newAddress] = true;
        } else {
            _users.recoverAccount(idToRecover, newAddress);
        }
        emit RecoverVoted(idToRecover, newAddress, userID);
        return true;
    }

    /**
     * @dev     This function allow users to vote to ban an article
     *          After 5 vote this function call {banArticle()} in Articles.sol
     *
     *          Emit a {Voted} event
     *
     * @param   articleID   id of the article
     */
    function voteToBanArticle(uint256 articleID) public onlyUser beforeGovernance returns (bool) {
        require(_articles.isArticle(articleID), "Goverance: cannot vote on inexistant article");
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_articles)][userID][articleID] == false,
            "Governance: you already vote to ban this article"
        );
        if (_itemQuorum[address(_articles)][articleID] < QUORUM) {
            _itemQuorum[address(_articles)][articleID] += 1;
            _itemVote[address(_articles)][userID][articleID] = true;
        } else {
            _articles.banArticle(articleID);
        }
        emit Voted(address(_articles), articleID, userID);
        return true;
    }

    /**
     * @dev     This function allow users to vote to ban a review
     *          After 5 vote this function call {banPost()} in Reviews.sol
     *
     *          Emit a {Voted} event
     *
     * @param   reviewID   id of the review
     */
    function voteToBanReview(uint256 reviewID) public onlyUser beforeGovernance returns (bool) {
        require(_reviews.isReview(reviewID), "Goverance: cannot vote on inexistant review");
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_reviews)][userID][reviewID] == false,
            "Governance: you already vote to ban this review"
        );
        if (_itemQuorum[address(_reviews)][reviewID] < QUORUM) {
            _itemQuorum[address(_reviews)][reviewID] += 1;
            _itemVote[address(_reviews)][userID][reviewID] = true;
        } else {
            _reviews.banPost(reviewID);
        }
        emit Voted(address(_reviews), reviewID, userID);

        return true;
    }

    /**
     * @dev     This function allow users to vote to ban a comment
     *          After 5 vote this function call {banPost()} in Comments.sol
     *
     *          Emit a {Voted} event
     *
     * @param   commentID   id of the comment
     */
    function voteToBanComment(uint256 commentID) public onlyUser beforeGovernance returns (bool) {
        require(_comments.isComment(commentID), "Governance: cannot vote on inexistant comment");
        uint256 userID = _users.profileID(msg.sender);
        require(
            _itemVote[address(_comments)][userID][commentID] == false,
            "Governance: you already vote to ban this comment"
        );
        if (_itemQuorum[address(_comments)][commentID] < QUORUM) {
            _itemQuorum[address(_comments)][commentID] += 1;
            _itemVote[address(_comments)][userID][commentID] = true;
        } else {
            _comments.banPost(commentID);
        }
        emit Voted(address(_comments), commentID, userID);
        return true;
    }

    /**
     * @notice  Getter functions
     * @dev     Return the number of vote for accept an user
     *
     * @param   pendingUserID id of the pending user
     * @return  uint8
     */
    function quorumAccept(uint256 pendingUserID) public view returns (uint8) {
        return _acceptUserQuorum[pendingUserID];
    }

    /**
     * @dev     Return the number of vote for ban an user
     *
     * @param   userIdToBan id of the user to ban
     * @return  uint8
     */
    function quorumBan(uint256 userIdToBan) public view returns (uint8) {
        return _banUserQuorum[userIdToBan];
    }

    /**
     * @dev     Return the number of vote to recover a profile with a new address
     *
     * @param   userIdToRecover id of the user who want to recover his profile
     * @param   newAddress      new address provided by the user who want to recover his profile
     * @return  uint8
     */
    function quorumRecover(uint256 userIdToRecover, address newAddress) public view returns (uint8) {
        return _recoverQuorum[userIdToRecover][newAddress];
    }

    /**
     * @dev     Return the number of vote to ban an item
     *
     * @param   itemAddress address of the item (Articles, Reviews or Comments)
     * @param   itemIdToBan id of the item to ban
     * @return  uint8
     */
    function quorumItemBan(address itemAddress, uint256 itemIdToBan) public view returns (uint8) {
        return _itemQuorum[itemAddress][itemIdToBan];
    }
}
