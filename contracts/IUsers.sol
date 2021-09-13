// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title IUsers
 * @author  Sarah, Henry & Raphael
 * @notice You can use this interface for give a status and vote to governance and user.
 * */
interface IUsers {

    ///@notice Handle the approval status
    enum WhiteList {
        NotApproved,
        Pending,
        Approved
    }

    ///@notice Handle the vote in Governance.sol
    enum Vote {
        No,
        Yes
    }
}
