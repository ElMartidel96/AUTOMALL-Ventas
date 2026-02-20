// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMasterController
 * @notice Interface for the Master EIP-712 Controller
 */
interface IMasterController {
    // ============ View Functions ============
    
    /**
     * @notice Validate if a batch creation is authorized
     * @param escrow The escrow requesting validation
     * @param eip712Contract The EIP-712 contract for the batch
     * @param amount The amount for the batch
     * @param deadline The deadline for the authorization
     * @param signature The owner's signature
     * @return bool Whether the batch creation is authorized
     */
    function validateBatchCreation(
        address escrow,
        address eip712Contract,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external view returns (bool);
    
    /**
     * @notice Simple check if an EIP-712 is authorized for an escrow
     * @param escrow The escrow contract
     * @param eip712Contract The EIP-712 contract
     * @return bool Whether it's authorized
     */
    function isAuthorized(
        address escrow,
        address eip712Contract
    ) external view returns (bool);
    
    /**
     * @notice Get current nonce for an address
     * @param account The account to check
     * @return uint256 The current nonce
     */
    function getNonce(address account) external view returns (uint256);
    
    /**
     * @notice Get domain separator for EIP-712
     * @return bytes32 The domain separator
     */
    function getDomainSeparator() external view returns (bytes32);
    
    // ============ Events ============
    
    event EIP712Authorized(
        address indexed escrow,
        address indexed eip712Contract,
        uint256 timestamp,
        address authorizedBy
    );
    
    event EIP712Revoked(
        address indexed escrow,
        address indexed eip712Contract,
        uint256 timestamp,
        address revokedBy
    );
}