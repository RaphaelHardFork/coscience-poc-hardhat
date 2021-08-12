//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";
import "./Articles.sol";
import "./Reviews.sol";
import "./Users.sol";

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

contract Comments is ERC721Enumerable, ERC721URIStorage, Users {
    using Counters for Counters.Counter;

    struct Comment {
        uint256 id;
        address author;
        string contentCID;
        bool contentBanned;
        address target;
        uint256 targetID;
        uint256[] comments;
        // edition date & bool with time duration
    }

    // storage & event
    Articles private _articles;
    Reviews private _reviews;
    Users private _users;

    Counters.Counter private _commentID;
    mapping(uint256 => Comment) private _comment;

    event Posted(address indexed poster, uint256 commentID, address indexed target, uint256 targetID);
    event CommentBanned(uint256 indexed commentID);

    constructor(
        address owner_,
        address articlesContract,
        address reviewsContract,
        address usersContract
    ) Users(owner_) ERC721("Comment", "COM") {
        _articles = Articles(articlesContract);
        _reviews = Reviews(reviewsContract);
        _users = Users(usersContract);
        // baseURI override and public
    }

    // overrides
    modifier onlyUser() override {
        uint256 userID = _users.profileID(msg.sender);
        require(_users.userStatus(userID) == WhiteList.Approved, "Users: you must be approved to use this feature.");
        _;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Comment: you cannot transfer this token"); // IMPORTANT TEST
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable, ERC721)
        returns (bool)
    {
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
        _setTokenURI(commentID, "https://ipfs.io/ifps/CID.json");
        Comment storage c = _comment[commentID];
        c.author = msg.sender;
        c.id = commentID;
        c.target = target;
        c.targetID = targetID;
        c.contentCID = contentCID;

        if (target == address(_articles)) {
            _articles.fillCommentsArray(targetID, commentID);
        } else if (target == address(_reviews)) {
            _reviews.fillCommentsArray(targetID, commentID);
        } else {
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

    function commentInfo(uint256 commentID) public view returns (Comment memory) {
        return _comment[commentID];
    }

    // is useful? enumerable? two way to find the list?
    function nbOfComment() public view returns (uint256) {
        return _commentID.current();
    }

    function testUser(address account) public view returns (uint256) {
        return _users.profileID(account);
    }
}
