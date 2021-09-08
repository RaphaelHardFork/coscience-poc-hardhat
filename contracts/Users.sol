//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUsers.sol";
import "./Articles.sol";
import "./Reviews.sol";
import "./Comments.sol";
import "./Governance.sol";

/**
 * @title   Users and Owners
 * @author  Sarah, Henry & Raphael
 *
 * @notice  This contract is set to create blockchain identity of users of the CoScience App.
 * @dev     Important features:
 *              - Allow users to register more than one wallet
 *              - Recovery user account through a password
 *              - Users have to be validated by a centralized agent (owner)
 *              - Informations of the user are stored on IPFS
 * */

contract Users is Ownable, IUsers {
    using Counters for Counters.Counter;
    /**
     * @notice State variables
     * @dev {_userID} use Counters to create unique ids
     * */
    Counters.Counter private _userID;
    Counters.Counter private _acceptedUser;

    /// @dev    A mapping to find user's Struct with the {id}
    mapping(uint256 => User) private _user;

    /// @dev    A mapping to get the user ID with the user wallet address
    mapping(address => uint256) private _userIdPointer;

    // governance address
    address private _articles; // default address(0)?
    address private _reviews;
    address private _comments;
    Governance private _governance;

    /**
     * @notice  Events
     * @dev     Emitted when an user is succesfully registered.
     *
     *          At this moment the user still have the Pending status in his account
     * */
    event Registered(address indexed user, uint256 userID);

    /**
     * @dev    Emitted when an user change his profile informations (bio, avatar, ...)
     * */
    event Edited(address indexed user, uint256 indexed userID, string profileCID);

    /**
     * @dev    Emitted when an user is approved by the owner of the contract
     * */
    event Approved(uint256 indexed userID);

    /**
     * @dev    Emitted when an user disapproved by the owner.
     *         This can happen after this latter was approved
     * */
    event Banned(uint256 indexed userID);

    /**
     * @dev     Emitted when an user use this function to recover his user profile
     * */
    event ProfileRecovered(address indexed account, uint256 indexed userID);

    /**
     * @notice  Modifiers
     * @dev     This prevent a Pending or Not Approved user to use a function
     *
     *          A new modifier is set in others contracts for this purpose
     * */
    modifier onlyUser(address account) {
        require(isUser(account) == true, "Users: you must be approved to use this feature.");
        _;
    }
    /**
     * @dev     This prevent a wallet to be registered on several user ids
     * */
    modifier alreadyRegistered(address account) {
        require(_userIdPointer[account] == 0, "Users: this wallet is already registered");
        _;
    }

    /**
     * @notice Structs, Enum and Arrays
     * @dev Struct User contains the following keys:
     *          - {id}: set by Counters.sol
     *          - {status}: user approval status
     *          - {profileCID}: CID pointer to user's profile information (bio, avatar, laboratory, ...)
     *          - {nameCID}: CID pointer to user's permanent information, this one is not editable
     *          - {walletList}: list of wallets owned by the user
     * */
    struct User {
        uint256 id;
        WhiteList status;
        string nameCID;
        string profileCID;
        address[] walletList;
    }

    /**
     * @notice  Constructor
     * @dev     The parameter {owner_} is set in case the deployer is different from the owner (see Ownable.sol)
     * */
    constructor(address owner_) Ownable() {
        transferOwnership(owner_);
    }

    function setContracts(
        address articles_,
        address reviews_,
        address comments_
    ) public returns (bool) {
        require(_articles == address(0), "Users: this function is callable only one time");
        _articles = articles_;
        _reviews = reviews_;
        _comments = comments_;

        _governance = new Governance(address(this), articles_, reviews_, comments_);

        return true;
    }

    /**
     * @notice  Public functions
     * @dev     This function allow a wallet to register as a user
     *
     *          Emit a {Registered} event
     *
     * @param profileCID_       the CID hash allowing to get the user's profile informations
     * @param nameCID_          the CID hash allowing to get the user's informations (not editable)

     */
    function register(string memory profileCID_, string memory nameCID_)
        public
        alreadyRegistered(msg.sender)
        returns (bool)
    {
        _userID.increment();
        uint256 userID = _userID.current();
        User storage u = _user[userID];
        u.id = userID;
        u.status = WhiteList.Pending;
        u.nameCID = nameCID_;
        u.profileCID = profileCID_;
        u.walletList.push(msg.sender);
        _userIdPointer[msg.sender] = userID;

        emit Registered(msg.sender, userID);
        return true;
    }

    /**
     * @dev     This function allow an user to change his profile information, it changes the CID pointer
     *          NOTE it doesn't change the crucials informations like name, ...
     *
     *          Emit an {Edited} event.
     *
     * @param profileCID_   user ID is specify to get access to the corresponding Struct User
     */
    function editProfile(string memory profileCID_) public onlyUser(msg.sender) returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        _user[userID].profileCID = profileCID_;

        emit Edited(msg.sender, userID, profileCID_);
        return true;
    }

    /**
     * @dev This function allows the owner to accept an user which is in Pending status
     *
     *      Emit an {Approved} event.
     *
     * @param userID_   user ID is specify to get access to the corresponding Struct User
     */
    function acceptUser(uint256 userID_) public onlyOwner returns (bool) {
        if (nbOfAcceptedUsers() == 4) {
            transferOwnership(address(_governance));
        }
        require(_user[userID_].status == WhiteList.Pending, "Users: user is not registered or already approved");
        _user[userID_].status = WhiteList.Approved;
        _acceptedUser.increment();
        emit Approved(userID_);

        return true;
    }

    /**
     * @dev Allows the owner to ban an user (with Pending or Approved status)
     *
     *      Emit a {Banned} event
     *
     * @param userID_   user ID is specify to get access to the corresponding Struct User
     */
    function banUser(uint256 userID_) public onlyOwner returns (bool) {
        require(_user[userID_].status != WhiteList.NotApproved, "Users: user is not registered or already banned");
        _user[userID_].status = WhiteList.NotApproved;
        emit Banned(userID_);
        return true;
    }

    /**
     * @dev This function allow an user to add another wallet to be linked with his profile
     *
     *      This function is set a security feature for unexperienced user which could lost his access to his wallet.
     *      The list of wallet is stored in the User Struct
     *
     * @param newAddress    the new wallet address specified by the user
     */
    function addWallet(address newAddress) public alreadyRegistered(newAddress) onlyUser(msg.sender) returns (bool) {
        uint256 userID = _userIdPointer[msg.sender];
        _user[userID].walletList.push(newAddress);
        _userIdPointer[newAddress] = userID;
        return true;
    }

    /**
     * @dev     This function is called by the Owner to recover the lost account of an user.
     *
     *          Emit a {ProfileRecovered} event.
     *
     * @param newAddress    the new address of the user
     * @param userID        ID of the user's profile
     **/
    function recoverAccount(uint256 userID, address newAddress)
        public
        alreadyRegistered(newAddress)
        onlyOwner
        returns (bool)
    {
        require(_user[userID].status == WhiteList.Approved, "Users: user must be approved");
        _user[userID].walletList.push(newAddress);
        _userIdPointer[newAddress] = userID;
        emit ProfileRecovered(newAddress, userID);
        return true;
    }

    /**
     * @notice Getter functions
     * @dev    Return the ID of the corresponding profile of the account address
     *
     * @param account   account address
     * */
    function profileID(address account) public view returns (uint256) {
        return _userIdPointer[account];
    }

    function userInfo(uint256 userID) public view returns (User memory) {
        return _user[userID];
    }

    function userStatus(uint256 userID) public view returns (WhiteList) {
        return _user[userID].status;
    }

    function nbOfUsers() public view returns (uint256) {
        return _userID.current();
    }

    function nbOfAcceptedUsers() public view returns (uint256) {
        return _acceptedUser.current();
    }

    /**
     *  @dev    Return true if an user has the Approved status
     *
     *          This function is used in modifier in others contracts
     *
     *  @param account address checked
     * */
    function isUser(address account) public view returns (bool) {
        uint256 userID = _userIdPointer[account];
        return _user[userID].status == WhiteList.Approved;
    }

    function governanceAddress() public view returns (address) {
        return address(_governance);
    }
}
