//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";
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

contract Reviews is ERC721Enumerable, ERC721URIStorage, Users {
    using Counters for Counters.Counter;

    struct Review {
        uint256 id;
        address author;
        string contentCID;
        bool contentBanned;
        uint256 targetID;
        uint256[] comments;
        // edition date & bool with time duration
        // reviews only on articles
    }

    // storage & event
    Users private _users;
    Articles private _articles;
    Counters.Counter private _reviewID;
    mapping(uint256 => Review) private _review;

    event Posted(address indexed poster, uint256 reviewID, uint256 targetID);
    event ReviewBanned(uint256 indexed _reviewID);

    constructor(
        address owner_,
        address articlesContract,
        address usersContract
    ) Users(owner_) ERC721("Review", "REV") {
        _articles = Articles(articlesContract);
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
        require(from == address(0) || to == address(0), "Reviews: reviews token are not transferable"); // IMPORTANT TEST
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

    // post a review
    function post(string memory contentCID, uint256 targetID) public onlyUser returns (uint256) {
        _reviewID.increment();
        uint256 reviewID = _reviewID.current();
        _safeMint(msg.sender, reviewID);
        _setTokenURI(reviewID, "https://ipfs.io/ifps/CID.json");
        Review storage r = _review[reviewID];
        r.author = msg.sender;
        r.id = reviewID;
        r.targetID = targetID;
        r.contentCID = contentCID;

        _articles.fillReviewsArray(targetID, reviewID);

        emit Posted(msg.sender, reviewID, targetID);
        return reviewID;
    }

    function banPost(uint256 reviewID) public onlyOwner returns (bool) {
        _review[reviewID].contentBanned = true;

        emit ReviewBanned(reviewID);
        return true;
    }

    function fillCommentsArray(uint256 reviewID, uint256 commentID) public returns (bool) {
        _review[reviewID].comments.push(commentID);
        return true;
    }

    function reviewInfo(uint256 reviewID) public view returns (Review memory) {
        return _review[reviewID];
    }

    // is useful? enumerable? two way to find the list?
    function nbOfReview() public view returns (uint256) {
        return _reviewID.current();
    }

    function articlesAddress() public view returns (Articles) {
        return _articles;
    }

    function usersAddress() public view returns (Users) {
        return _users;
    }
}
