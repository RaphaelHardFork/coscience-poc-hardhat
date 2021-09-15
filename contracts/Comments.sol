//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IUsers.sol";
import "./Articles.sol";
import "./Reviews.sol";

/**
 * @title   Comment NFT
 * @author  Sarah, Henry & Raphael
 *
 * @notice  Each NFT of this contract are comments.
 * @dev     Important features:
 *              - NFT are not transferable
 *              - Metadata are stored on IPFS
 *              - NFT of this contract can be linked to other NFT (Reviews.sol & Articles.sol)
 *              - Use ERC721Enumerable to create a list of NFT of an user
 */
contract Comments is ERC721Enumerable, IUsers {
    using Counters for Counters.Counter;

    /**
     * @notice  State variables
     * @dev     {_commentID} use Counters to create unique ids
     * */
    Counters.Counter private _commentID;

    /// @dev    Users.sol, Articles.sol and Reviews.sol contracts are used to do external call on these contract
    Users private _users;
    Articles private _articles;
    Reviews private _reviews;

    /**
     * @notice              Events
     * @dev                 Emitted when an user post an comment
     * @param poster        address of the poster, author of the comment
     * @param commentID     comment's token ID
     * @param target        contract target address on which the comment is posted
     * @param targetID      targetID of the item (Articles or Reviews)
     * */
    event Posted(address indexed poster, uint256 indexed commentID, address indexed target, uint256 targetID);

    /**
     * @notice              Events
     * @dev                 Emitted when a comment is banned
     * @param commentID     banned comment's ID
     * */
    event CommentBanned(uint256 indexed commentID);

    /**
     * @notice              Events
     * @dev                 Emitted when an user vote on a comment
     * @param commentID     comment's ID
     * @param userID        user ID who voted
     * */
    event Voted(uint256 indexed commentID, uint256 indexed userID);

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
     * @dev Struct Comment contains the following keys:
     *          - {contentBanned}: status of the comment
     *          - {id}: set by Counters.sol
     *          - {vote}: number of vote
     *          - {targetID}: ID of an item
     *          - {target}: address of an item
     *          - {author}: address of the author
     *          - {contentCID}: string of ipfs CID
     *          - {comments}: array of linked comments id
     */
    struct Comment {
        bool contentBanned;
        uint256 id;
        uint256 vote;
        uint256 targetID;
        address target;
        address author;
        string contentCID;
        uint256[] comments;
    }

    ///@dev Mapping to get the comment's Struct with the CommentID
    mapping(uint256 => Comment) private _comment;

    /// @dev    Mapping to check if an user have already vote on an comment
    mapping(uint256 => mapping(uint256 => bool)) private _vote;

    /**
     * @notice  Constructor
     * @dev     The contract is deployed with the address of Users.sol, Reviews.sol and Articles.sol
     *
     * @param usersContract     address of Users.sol
     * @param articlesContract  address of Articles.sol
     * @param reviewsContract   address of Reviews.sol
     * */
    constructor(
        address usersContract,
        address articlesContract,
        address reviewsContract
    ) ERC721("Comment", "COM") {
        _users = Users(usersContract);
        _articles = Articles(articlesContract);
        _reviews = Reviews(reviewsContract);
    }

    /**
     * @notice  Public functions
     * @dev     This function allow a user to post a comment
     *          Comment must be posted only on either Comments.sol, Articles.sol or Reviews.sol
     *
     *          Emit a {Posted} event
     *
     * @param contentCID      the CID hash allowing to get the content's informations
     * @param target          the address of either Comments.sol, Articles.sol or Reviews.sol
     * @param targetID        the ID of the NFT
     */
    function post(
        string memory contentCID,
        address target,
        uint256 targetID
    ) public onlyUser returns (uint256) {
        require(
            target == address(this) || target == address(_reviews) || target == address(_articles),
            "Comments: must be posted on appropriated contract"
        );
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

    /**
     * @dev     This function allow owner to ban a comment
     *
     *          Emit a {CommentBanned} event
     *
     * @param   commentID  the comment ID to ban
     */
    function banPost(uint256 commentID) public onlyOwner returns (bool) {
        require(
            _comment[commentID].id == commentID && _comment[commentID].contentBanned == false,
            "Comments: This Comment does not exist or is already banned"
        );
        _comment[commentID].contentBanned = true;

        emit CommentBanned(commentID);
        return true;
    }

    /**
     * @dev     This function allow a user to vote a comment
     *
     *          Emit a {Voted} event
     *
     * @param   commentID   voted comment id
     */
    function vote(uint256 commentID) public onlyUser returns (bool) {
        require(_comment[commentID].author != address(0), "Comments: cannot vote on inexistant Comment.");
        uint256 userID = _users.profileID(msg.sender);
        require(_vote[userID][commentID] == false, "Comments: you already vote for this comment");
        _comment[commentID].vote += 1;
        _vote[userID][commentID] = true;
        emit Voted(commentID, userID);
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
     * @dev     Return the struct of a comment
     * @param   commentID   comment id
     */
    function commentInfo(uint256 commentID) public view returns (Comment memory) {
        return _comment[commentID];
    }

    /**
     * @dev Check if a comment ID match an existing one
     * @param commentID  comment id
     * @return boolean
     */

    function isComment(uint256 commentID) public view returns (bool) {
        if (_comment[commentID].author == address(0)) {
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
        require(from == address(0) || to == address(0), "Comment: you cannot transfer this token"); // IMPORTANT TEST
    }

    /**
     * @dev     This fonction is override to use ERC721.sol
     * @param   tokenId token ID
     */
    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }
}
