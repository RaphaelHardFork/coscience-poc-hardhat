//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IUsers.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";
import "./Reviews.sol";
import "./Comments.sol";

/**
 * @title   Article NFT
 * @author  Sarah, Henry & Raphael
 *
 * @notice  Each NFT of this contract are articles.
 * @dev     Important features:
 *              - NFT are not transferable
 *              - Metadata are stored on IPFS
 *              - BaseURI (gateway) + TokenURI (CID)
 *
 */

contract Articles is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;

    //storage
    Counters.Counter private _articleID;
    Users private _users;
    mapping(uint256 => Article) private _article;

    Comments private _comments;
    Reviews private _reviews;

    /**
     * @notice              Events
     * @dev                 Emitted when an user publish an article
     * @param author        address of the publisher
     * @param articleID     article's token ID
     * @param abstractCID   ipfs CID of the abstract
     * */
    event Published(address indexed author, uint256 indexed articleID, string abstractCID);

    event ArticleBanned(uint256 indexed articleID);

    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    modifier onlyOwner() {
        require(_users.owner() == msg.sender, "Users: caller is not the owner");
        _;
    }

    /**
     * @dev Struct Article contains the following keys:
     *          - {id}: set by Counters.sol
     *          - {author}: address of the owner
     *          - {coAuthor}: array of co author's address
     *          - {contentBanned}: status of the article
     *          - {...CID}: string of ipfs CID => in bytes?
     *          - {comments}: array of linked comments' id
     *          - {reviews}: array of linked reviews' id
     * NOTE comments[] & reviews[] are filled in contracts of the same name
     * */
    struct Article {
        bool contentBanned;
        uint256 id;
        address author;
        string abstractCID;
        string contentCID;
        address[] coAuthor;
        uint256[] comments;
        uint256[] reviews;
    }

    /**
     * @notice              Constructor
     * @dev                 The parameter {owner_} is set in case the deployer is different from the owner (see Users.sol)
     * @param usersContract address of Users.sol
     * */
    constructor(address usersContract) ERC721("Article", "ART") {
        _users = Users(usersContract);
        _reviews = new Reviews(address(this), address(_users));
        _comments = new Comments(address(this), address(_reviews), address(_users));
    }

    // external
    // public

    function publish(
        address[] memory coAuthor,
        string memory abstractCID,
        string memory contentCID
    ) public onlyUser returns (uint256) {
        _articleID.increment();
        uint256 articleID = _articleID.current();
        _safeMint(msg.sender, articleID);
        Article storage a = _article[articleID];
        a.author = msg.sender;
        a.id = articleID;
        a.coAuthor = coAuthor;
        a.abstractCID = abstractCID;
        a.contentCID = contentCID;

        emit Published(msg.sender, articleID, abstractCID);
        return articleID;
    }

    function banArticle(uint256 articleID) public onlyOwner returns (bool) {
        _article[articleID].contentBanned = true;
        emit ArticleBanned(articleID);
        return true;
    }

    function fillReviewsArray(uint256 articleID, uint256 reviewID) public returns (bool) {
        require(msg.sender == address(_reviews), "Articles: this function is only callable by Reviews.sol");
        _article[articleID].reviews.push(reviewID);
        return true;
    }

    function fillCommentsArray(uint256 articleID, uint256 commentID) public returns (bool) {
        require(msg.sender == address(_comments), "Articles: this function is only callable by Comments.sol");
        _article[articleID].comments.push(commentID);
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function articleInfo(uint256 articleID) public view returns (Article memory) {
        return _article[articleID];
    }

    function commentsAddress() public view returns (address) {
        return address(_comments);
    }

    function reviewsAddress() public view returns (address) {
        return address(_reviews);
    }

    // internal
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Articles: articles tokens are not transferable."); // IMPORTANT TEST
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }

    // private
}
