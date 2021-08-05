//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Users.sol";

/**
 * @title Comments
 * @notice TODO
 * @dev test Pause/unpause in one function
 *      test ERC721Holder.sol => onERC721Received
 *      test setBaseUri (if useful)
 *
 * */

contract Comments is ERC721Enumerable,ERC721URIStorage,Users {  // PAUSABLE
  using Counters for Counters.Counter;

  struct Comment {
    uint256 id;
    address author;
    string contentCID;
    bool contentBanned;
    address target;
    uint256 targetID;
    // edition date & bool
  }
  // storage & event
  Counters.Counter private _commentID;
  mapping(uint256 => Comment) private _comment;

  event Posted(address indexed poster, uint256 commentID, address indexed target, uint256 targetID);
  event CommentBanned(uint256 indexed commentID);

  constructor(address owner_) Users(owner_) ERC721("Comment", "COM") {}

  // overrides
  function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
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
  function post(string memory contentCID, address target, uint256 targetID) public onlyUser returns(uint256) {
    _commentID.increment();
    uint256 commentID = _commentID.current();
    _mint(msg.sender,commentID);
    _setTokenURI(commentID, "https://ipfs.io/ifps/CID.json");
    Comment storage c = _comment[commentID];
    c.author = msg.sender;
    c.id = commentID;
    c.target = target;
    c.targetID = targetID;
    c.contentCID = contentCID;

    emit Posted(msg.sender, commentID, target,targetID);
    return commentID;
  }

  function banPost(uint256 commentID) public onlyOwner returns(bool){
    _comment[commentID].contentBanned = true;

    emit CommentBanned(commentID);
    return true;
  }

  function commentInfo(uint256 commentID) public view returns(Comment memory){
    return _comment[commentID];
  }

  // is useful? enumerable?
  function nbOfComment() public view returns(uint256){
    return _commentID.current();
  }

  
} 
 