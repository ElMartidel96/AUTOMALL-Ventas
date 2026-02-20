// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICGCToken
 * @notice Interface for CGC Token contract
 * @dev Used by MinterGateway and other contracts that interact with CGC Token
 */
interface ICGCToken {
    function mint(address to, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function owner() external view returns (address);
    function minters(address account) external view returns (bool);
    function addMinter(address minter) external;
    function removeMinter(address minter) external;
    function transferOwnership(address newOwner) external;
}
