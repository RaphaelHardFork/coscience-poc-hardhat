//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";
import "./IUsers.sol";
import "./Articles.sol";

/**
 * @title Reviews
 * @notice TODO
 * @dev test setBaseUri (if useful)
 *  https://pinata.gateway
 * CID = Qmdhcjdbsdjss
 * Base+tokenURI
 * changeBaseURI: in case gateways out of function
 * */

contract Reviews is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;

    // storage & event
    Users private _users;
    Articles private _articles;
    Counters.Counter private _reviewID;
    mapping(uint256 => Review) private _review;

    mapping(uint256 => mapping(uint256 => bool)) private _vote;

    event Posted(address indexed poster, uint256 indexed reviewID, uint256 targetID);
    event ReviewBanned(uint256 indexed _reviewID);
    event Voted(Vote indexed choice, uint256 indexed reviewID, uint256 indexed userID);

    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    modifier onlyOwner() {
        require(_users.owner() == msg.sender, "Users: caller is not the owner");
        _;
    }

    struct Review {
        bool contentBanned;
        address author;
        uint256 id;
        int256 vote;
        uint256 targetID;
        string contentCID;
        uint256[] comments;
        // edition date & bool with time duration
        // reviews only on articles
    }

    constructor(address articlesContract, address usersContract) ERC721("Review", "REV") {
        _articles = Articles(articlesContract);
        _users = Users(usersContract);

        // baseURI override and public
    }

    // post a review
    function post(string memory contentCID, uint256 targetID) public onlyUser returns (uint256) {
        _reviewID.increment();
        uint256 reviewID = _reviewID.current();
        _safeMint(msg.sender, reviewID);
        Review storage r = _review[reviewID];
        r.author = msg.sender;
        r.id = reviewID;
        r.targetID = targetID;
        r.contentCID = contentCID;

        _articles.fillReviewsArray(targetID, reviewID);

        emit Posted(msg.sender, reviewID, targetID);
        return reviewID;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function banPost(uint256 reviewID) public onlyOwner returns (bool) {
        _review[reviewID].contentBanned = true;

        emit ReviewBanned(reviewID);
        return true;
    }

    function fillCommentsArray(uint256 reviewID, uint256 commentID) public returns (bool) {
        require(msg.sender == _users.commentAddress(), "Reviews: this function is only callable by Comments.sol");
        _review[reviewID].comments.push(commentID);
        return true;
    }

    function vote(Vote choice, uint256 reviewID) public returns (bool) {
        uint256 userID = _users.profileID(msg.sender);
        require(_vote[userID][reviewID] == false, "Review: you already vote for this review.");
        if (choice == Vote.Yes) {
            _review[reviewID].vote += 1;
        } else {
            _review[reviewID].vote -= 1;
        }
        _vote[userID][reviewID] = true;
        emit Voted(choice, reviewID, userID);
        return true;
    }

    function reviewInfo(uint256 reviewID) public view returns (Review memory) {
        return _review[reviewID];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Reviews: reviews token are not transferable"); // IMPORTANT TEST
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }
}
