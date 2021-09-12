//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IUsers.sol";
import "./Articles.sol";
import "./Reviews.sol";

/**
 * @title Comments
 * @notice
 * @dev
 * TODO test setBaseUri (if useful)
 * https://pinata.gateway
 * CID = Qmdhcjdbsdjss
 * Base+tokenURI
 * changeBaseURI: in case gateways out of function
 * */

contract Comments is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;
    // storage & event
    Articles private _articles;
    Reviews private _reviews;
    Users private _users;

    Counters.Counter private _commentID;
    mapping(uint256 => Comment) private _comment;

    mapping(uint256 => mapping(uint256 => bool)) private _vote;

    event Posted(address indexed poster, uint256 indexed commentID, address indexed target, uint256 targetID);
    event CommentBanned(uint256 indexed commentID);
    event Voted(uint256 indexed commentID, uint256 indexed userID);

    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    modifier onlyOwner() {
        require(_users.owner() == msg.sender, "Users: caller is not the owner");
        _;
    }

    struct Comment {
        bool contentBanned;
        uint256 id;
        uint256 vote;
        uint256 targetID;
        address target;
        address author;
        string contentCID;
        uint256[] comments;
        // edition date & bool with time duration
    }

    constructor(
        address usersContract,
        address articlesContract,
        address reviewsContract
    ) ERC721("Comment", "COM") {
        _users = Users(usersContract);
        _articles = Articles(articlesContract);
        _reviews = Reviews(reviewsContract);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // post a comment
    function post(
        string memory contentCID,
        address target,
        uint256 targetID
    ) public onlyUser returns (uint256) {
        _commentID.increment();
        uint256 commentID = _commentID.current();
        _safeMint(msg.sender, commentID);
        Comment storage c = _comment[commentID];
        c.author = msg.sender;
        c.id = commentID;
        c.target = target;
        c.targetID = targetID;
        c.contentCID = contentCID;

        if (target == address(_articles)) {
            require(_articles.isArticle(targetID), "Comments: cannot comment an inexistant Article.");
            _articles.fillCommentsArray(targetID, commentID);
        } else if (target == address(_reviews)) {
            require(_reviews.isReview(targetID), "Comments: cannot comment an inexistant Review.");
            _reviews.fillCommentsArray(targetID, commentID);
        } else {
            require(_comment[targetID].author != address(0), "Comments: cannot comment an inexistant Comment.");
            _comment[targetID].comments.push(commentID);
        }

        emit Posted(msg.sender, commentID, target, targetID);
        return commentID;
    }

    function banPost(uint256 commentID) public onlyOwner returns (bool) {
        _comment[commentID].contentBanned = true;

        emit CommentBanned(commentID);
        return true;
    }

    function vote(uint256 commentID) public onlyUser returns (bool) {
        require(_comment[commentID].author != address(0), "Comments: cannot vote on inexistant Comment.");
        uint256 userID = _users.profileID(msg.sender);
        require(_vote[userID][commentID] == false, "Comments: you already vote for this comment");
        _comment[commentID].vote += 1;
        _vote[userID][commentID] = true;
        emit Voted(commentID, userID);
        return true;
    }

    function commentInfo(uint256 commentID) public view returns (Comment memory) {
        return _comment[commentID];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Comment: you cannot transfer this token"); // IMPORTANT TEST
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }
}
