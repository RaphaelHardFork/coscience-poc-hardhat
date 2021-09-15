//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";
import "./IUsers.sol";
import "./Articles.sol";

/**
 * @title   Review NFT
 * @author  Sarah, Henry & Raphael
 *
 * @notice  Each NFT of this contract are reviews.
 * @dev     Important features:
 *              - NFT are not transferable
 *              - Metadata are stored on IPFS
 *              - NFT of this contract can be linked to other NFT (Articles.sol & Comments.sol)
 *              - Use ERC721Enumerable to create a list of NFT of an user
 */

contract Reviews is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;

    /**
     * @notice  State variables
     * @dev     {_reviewID} use Counters to create unique ids
     * */
    Counters.Counter private _reviewID;

    /// @dev    Users.sol and Articles.sol contracts are used to do external call on this contract
    Users private _users;
    Articles private _articles;

   /**
     * @notice              Events
     * @dev                 Emitted when an user post a reviews
     * @param poster        address of the poster
     * @param reviewID      reviews token ID
     * @param targetID      targetID, corresponding to the articleID
     * */
    event Posted(address indexed poster, uint256 indexed reviewID, uint256 targetID);

     /**
     * @notice              Events
     * @dev                 Emitted when a reviews is banned
     * @param _reviewID     banned reviews ID
     * */
    event ReviewBanned(uint256 indexed _reviewID);

    /**
     * @dev                 Emitted when an user vote a reviews
     * @param choice        Vote choice of the user (see IUsers.sol)
     * @param reviewID      voted reviews ID
     * @param userID        user ID of the voter
     * */
    event Voted(Vote indexed choice, uint256 indexed reviewID, uint256 indexed userID);

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
     * @dev Struct Reviews contains the following keys:
     *          - {contentBanned}: status of the reviews
     *          - {author}: address of the author
     *          - {id}: set by Counters.sol
     *          - {vote}: number of vote 
     *          - {targetID}: ID of the corresponding article
     *          - {contentCID}: string of ipfs CID
     *          - {comments}: array of linked comments id
     * */
    struct Review {
        bool contentBanned;
        address author;
        uint256 id;
        int256 vote;
        uint256 targetID;
        string contentCID;
        uint256[] comments;
    }

    /// @dev    Mapping to get Reviews Struct of an ReviewID
    mapping(uint256 => Review) private _review;

    /// @dev    Mapping to check if an user have already vote on an article
    mapping(uint256 => mapping(uint256 => bool)) private _vote;

    /**
     * @notice  Constructor
     * @dev     The contract is deployed with the address of Users.sol and Articles.sol
     *
     * @param usersContract     address of Users.sol
     * @param articlesContract  address of Articles.sol
     * */
    constructor(address usersContract, address articlesContract) ERC721("Review", "REV") {
        _users = Users(usersContract);
        _articles = Articles(articlesContract);
    }

    /**
     * @notice  Public functions
     * @dev     This function allow a user to post a reviews
     *
     *          Emit a {Posted} event
     *
     * @param contentCID      the CID hash allowing to get the content's informations
     * @param targetID        the ID of the article
     */
    function post(string memory contentCID, uint256 targetID) public onlyUser returns (uint256) {
        require(_articles.isArticle(targetID), "Reviews: article ID does not exist");
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

    /**
     * @dev     This function allow owner to ban a reviews
     *
     *          Emit a {ReviewBanned} event
     *
     * @param reviewID  the reviews ID to ban
     */
    function banPost(uint256 reviewID) public onlyOwner returns (bool) {
        _review[reviewID].contentBanned = true;

        emit ReviewBanned(reviewID);
        return true;
    }

    /**
     * @dev     Fill the comments array of the reviews with the commentID
     *          This function is only callable by Reviews.sol and only when a comment is posted
     * @param   reviewID   id of the article on which the comment is posted
     * @param   commentID   the comment ID to push
     */
    function fillCommentsArray(uint256 reviewID, uint256 commentID) public returns (bool) {
        require(msg.sender == _articles.commentsAddress(), "Reviews: this function is only callable by Comments.sol");
        _review[reviewID].comments.push(commentID);
        return true;
    }

    /**
     * @dev     This function allow a user to vote a reviews
     *
     *          Emit a {Voted} event
     *
     * @param choice        Vote choice of the user (see IUsers.sol)
     * @param reviewID     voted article id
     */
    function vote(Vote choice, uint256 reviewID) public onlyUser returns (bool) {
        require(isReview(reviewID), "Reviews: cannot vote on inexistant review");
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

    /**
     * @notice  Getter functions
     * @dev     This function must be overrided to use ERC721Enumerable
     * @param   interfaceId interface in bytes4
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

     /**
     * @dev     Return the struct of an article
     * @param reviewID   reviews id
     * @return  Reviews struct
     */
    function reviewInfo(uint256 reviewID) public view returns (Review memory) {
        return _review[reviewID];
    }

    /**
     * @dev     Check if an reviews ID correspond to an existing reviews
     * @param   reviewID   reviews id
     * @return  boolean 
     */
    function isReview(uint256 reviewID) public view returns (bool) {
        if (_review[reviewID].author == address(0)) {
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
        require(from == address(0) || to == address(0), "Reviews: reviews token are not transferable"); // IMPORTANT TEST
    }

    /**
     * @dev     This fonction is override to use ERC721.sol
     * @param   tokenId token ID
     */    
    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }
}
