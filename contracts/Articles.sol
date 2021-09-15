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
 *              - NFT of this contract can be linked to other NFT (Reviews.sol & Comments.sol)
 *              - Use ERC721Enumerable to create a list of NFT of an user
 */
contract Articles is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;

    /**
     * @notice  State variables
     * @dev     {_articleID} use Counters to create unique ids
     * */
    Counters.Counter private _articleID;

    /// @dev    Users.sol contract is used to do external call on this contract
    Users private _users;

    /// @dev    Reviews.sol address is stored to do some verification (require)
    address private _reviews;

    /// @dev    Comments.sol address is also stored to be used in require
    address private _comments;

    /**
     * @notice              Events
     * @dev                 Emitted when an user publish an article
     * @param author        address of the publisher
     * @param articleID     article's token ID
     * @param abstractCID   ipfs CID of the abstract
     * */
    event Published(address indexed author, uint256 indexed articleID, string abstractCID);

    /**
     * @dev                 Emitted when an user vote about the validity of an article
     * @param choice        vote choice of the user
     * @param articleID     voted article ID
     * @param userID        user ID of the voter
     * */
    event ValidityVoted(Vote indexed choice, uint256 indexed articleID, uint256 indexed userID);

    /**
     * @dev                 Emitted when an user vote about the importance of an article
     * @param choice        vote choice of the user
     * @param articleID     voted article ID
     * @param userID        user ID of the voter
     * */
    event ImportanceVoted(Vote indexed choice, uint256 indexed articleID, uint256 indexed userID);

    /**
     * @dev                 Emitted when an article is banned
     * @param articleID     banned article ID
     * */
    event ArticleBanned(uint256 indexed articleID);

    /**
     * @notice  Modifiers
     * @dev     This modifier prevent a Pending or Not approved user to call a function
     *          it uses the state of Users.sol
     * */
    modifier onlyUser() {
        require(_users.isUser(msg.sender) == true, "Users: you must be approved to use this feature.");
        _;
    }

    /// @dev    This modifier prevent an user to call a funcion reserved to the owner
    modifier onlyOwner() {
        require(_users.owner() == msg.sender, "Users: caller is not the owner");
        _;
    }

    /**
     * @notice  Structs, Enum and Arrays
     * @dev     Struct Article contains the following keys:
     *           - {id}: set by Counters.sol
     *           - {author}: address of the owner
     *           - {coAuthor}: array of co author's address
     *           - {contentBanned}: status of the article
     *           - {...CID}: string of ipfs CID
     *           - {comments}: array of linked comments' id
     *           - {reviews}: array of linked reviews' id
     *          NOTE comments[] & reviews[] are filled in contracts of the same name
     * */
    struct Article {
        bool contentBanned;
        uint256 id;
        int256 validity;
        int256 importance;
        address author;
        string abstractCID;
        string contentCID;
        address[] coAuthor;
        uint256[] comments;
        uint256[] reviews;
    }

    /// @dev    Mapping to get Article Struct with the articleID
    mapping(uint256 => Article) private _article;

    /// @dev    Mappings to check if an user have already vote on an article
    mapping(uint256 => mapping(uint256 => bool)) private _validityVote;
    mapping(uint256 => mapping(uint256 => bool)) private _importanceVote;

    /**
     * @notice  Constructor
     * @dev     The contract is deployed with the address of Users.sol
     * @param   usersContract address of Users.sol
     * */
    constructor(address usersContract) ERC721("Article", "ART") {
        _users = Users(usersContract);
    }

    /**
     * @notice  Public functions
     * @dev     Address in parameters are stored to be used in require (see fillCommentArray())
     *          This function can be called only one time and by the owner
     *          This function must be called just after deployment of Comments.sol
     *
     * @param reviews_ address of Reviews.sol
     * @param comments_ address of Comments.sol
     */
    function setContracts(address reviews_, address comments_) public onlyOwner returns (bool) {
        require(_reviews == address(0), "Articles: this function is callable only one time");
        _reviews = reviews_;
        _comments = comments_;
        return true;
    }

    /**
     * @dev     This function allow a user to publish an article
     *
     *          Emit a {Published} event
     *
     * @param coAuthor      an address array that contains co-authors of the articles
     * @param abstractCID   the CID hash allowing to get the abstract's informations
     * @param contentCID    the CID hash allowing to get the content's informations
     */
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

    /**
     * @dev     This function allow owner to ban an article
     *
     *          Emit a {ArticleBanned} event
     *
     * @param articleID  the article ID to ban
     */
    function banArticle(uint256 articleID) public onlyOwner returns (bool) {
        require(
            _article[articleID].id == articleID && _article[articleID].contentBanned == false,
            "Articles: This Article does not exist or is already banned"
        );
        _article[articleID].contentBanned = true;
        emit ArticleBanned(articleID);
        return true;
    }

    /**
     * @dev     Fill the reviews array of the article with the reviewID
     *          This function is only callable by Reviews.sol and only when a review is posted
     * @param   articleID   id of the article on which the review is posted
     * @param   reviewID    the reviews ID to push
     */
    function fillReviewsArray(uint256 articleID, uint256 reviewID) public returns (bool) {
        require(msg.sender == _reviews, "Articles: this function is only callable by Reviews.sol");
        _article[articleID].reviews.push(reviewID);
        return true;
    }

    /**
     * @dev     Fill the comments array of the article with the commentID
     *          This function is only callable by Comments.sol and only when a comment is posted
     * @param   articleID   id of the article on which the comment is posted
     * @param   commentID   the comment ID to push
     */
    function fillCommentsArray(uint256 articleID, uint256 commentID) public returns (bool) {
        require(msg.sender == _comments, "Articles: this function is only callable by Comments.sol");
        _article[articleID].comments.push(commentID);
        return true;
    }

    /**
     * @dev     This function allow a user to vote on validity of an article
     *
     *          Emit a {ValidityVoted} event
     *
     * @param choice        Vote choice of the user (see IUsers.sol)
     * @param articleID     voted article id
     */
    function voteValidity(Vote choice, uint256 articleID) public onlyUser returns (bool) {
        require(isArticle(articleID), "Articles: cannot vote on inexistant Article.");
        uint256 userID = _users.profileID(msg.sender);
        require(_validityVote[userID][articleID] == false, "Articles: you already vote on validity for this article.");
        if (choice == Vote.Yes) {
            _article[articleID].validity += 1;
        } else {
            _article[articleID].validity -= 1;
        }
        _validityVote[userID][articleID] = true;
        emit ValidityVoted(choice, articleID, userID);
        return true;
    }

    /**
     * @dev     This function allow a user to vote on importance of an article
     *
     *          Emit a {ImportanceVoted} event
     *
     * @param choice        Vote choice of the user (see IUsers.sol)
     * @param articleID     voted article id
     */
    function voteImportance(Vote choice, uint256 articleID) public onlyUser returns (bool) {
        require(isArticle(articleID), "Articles: cannot vote on inexistant Article.");
        uint256 userID = _users.profileID(msg.sender);
        require(
            _importanceVote[userID][articleID] == false,
            "Articles: you already vote on importance for this article."
        );
        if (choice == Vote.Yes) {
            _article[articleID].importance += 1;
        } else {
            _article[articleID].importance -= 1;
        }
        _importanceVote[userID][articleID] = true;
        emit ImportanceVoted(choice, articleID, userID);
        return true;
    }

    /**
     * @notice  Getter functions
     * @dev     This function must be overrided to use ERC721Enumerable
     * @param   interfaceId interface in bytes4
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev     Return the address of Comments.sol
     * @return  address
     */
    function commentsAddress() public view returns (address) {
        return _comments;
    }

    /**
     * @dev     Return the struct of an article
     * @param   articleID   article id
     * @return  Article (struct)
     */
    function articleInfo(uint256 articleID) public view returns (Article memory) {
        return _article[articleID];
    }

    /**
     * @dev     Check if an article ID correspond to an existing article
     * @param   articleID   article id
     * @return  boolean
     */
    function isArticle(uint256 articleID) public view returns (bool) {
        if (_article[articleID].author == address(0)) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * @notice  Internals functions
     * @dev     This hook from ERC721Enumerable is overrided to use the contract
     *          But this hook is also modified to prevent a token to be transfered
     *
     * @param   from    address of the sender
     * @param   to      address of the recipient
     * @param   tokenId token ID
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
        require(from == address(0) || to == address(0), "Articles: articles tokens are not transferable."); // IMPORTANT TEST
    }

    /**
     * @dev     This fonction is override to use ERC721.sol
     * @param   tokenId token ID
     */
    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }
}
