//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";

contract Articles is ERC721Enumerable, ERC721URIStorage, Users {
    using Counters for Counters.Counter;

    // enum?

    struct Article {
        uint256 id;
        address author;
        address[] coAuthor;
        bool contentBanned;
        string abstractCID;
        string contentCID;
        uint256[] comments;
        uint256[] reviews;
        uint likeCount;
        //metrics
    }

    //storage
    Counters.Counter private _articleID;
    mapping(uint256 => Article) private _article;

    //event
    event Published(address indexed author, uint256 articleID, string abstractCID);
    event ArticleBanned(uint256 indexed articleID);

    constructor(address owner_) Users(owner_) ERC721("Article", "ART") {}

    // overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Article: you cannot transfer this token"); // IMPORTANT TEST
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
        string memory abstractCID,
        string memory contentCID
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
        _article[articleID].reviews.push(commentID);
        return true;
    }

    function articleInfo(uint256 articleID) public view returns (Article memory) {
        return _article[articleID];
    }

    function nbOfArticles() public view returns (uint256) {
        return _articleID.current();
    }
}
