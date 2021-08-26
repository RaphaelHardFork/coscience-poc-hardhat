//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";

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

contract Articles is ERC721Enumerable, ERC721URIStorage, Users {
    using Counters for Counters.Counter;

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
        uint256 id;
        address author;
        address[] coAuthor;
        bool contentBanned;
        uint256 abstractCID;
        uint256 contentCID;
        uint256[] comments;
        uint256[] reviews;
        //metrics
    }

    //storage
    Counters.Counter private _articleID;
    Users private _users;

    mapping(uint256 => Article) private _article;

    /**
     * @notice              Events
     * @dev                 Emitted when an user publish an article
     * @param author        address of the publisher
     * @param articleID     article's token ID
     * @param abstractCID   ipfs CID of the abstract
     * */
    event Published(address indexed author, uint256 articleID, uint256 abstractCID);
    event ArticleBanned(uint256 indexed articleID);

    /**
     * @notice              Constructor
     * @dev                 The parameter {owner_} is set in case the deployer is different from the owner (see Users.sol)
     * @param owner_        address of the owner (see Users.sol)
     * @param usersContract address of Users.sol
     * */
    constructor(address owner_, address usersContract) Users(owner_) ERC721("Article", "ART") {
        _users = Users(usersContract);
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
        require(from == address(0) || to == address(0), "Articles: articles tokens are not transferable."); // IMPORTANT TEST
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

    function publish(
        address[] memory coAuthor,
        uint256 abstractCID,
        uint256 contentCID
    ) public onlyUser returns (uint256) {
        _articleID.increment();
        uint256 articleID = _articleID.current();
        _safeMint(msg.sender, articleID);
        _setTokenURI(articleID, "https://ipfs.io/ifps/CID.json");
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
        // check needed
        _article[articleID].reviews.push(reviewID);
        return true;
    }

    function fillCommentsArray(uint256 articleID, uint256 commentID) public returns (bool) {
        // check needed
        _article[articleID].comments.push(commentID);
        return true;
    }

    function articleInfo(uint256 articleID) public view returns (Article memory) {
        return _article[articleID];
    }

    function nbOfArticles() public view returns (uint256) {
        return _articleID.current();
    }
}
