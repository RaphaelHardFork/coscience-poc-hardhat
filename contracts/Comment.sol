//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title Comment
 * @notice TODO
 * @dev test Pause/unpause in one function
 *      test ERC721Holder.sol => onERC721Received
 *      test setBaseUri (if useful)
 *
 * */

contract Comment is ERC721 {
    enum Types {
        Article,
        Review,
        Comment
    }
    struct On {
        // not possible try arrays
        uint256 id;
        address _contract;
    }
    struct Info {
        address author;
        uint256 createdAt;
        string title; //not sure
        string contentCID;
        uint256 upVote;
        uint256 downVote;
        uint256 cited; // maybe an idea
    }

    constructor() {}
}
