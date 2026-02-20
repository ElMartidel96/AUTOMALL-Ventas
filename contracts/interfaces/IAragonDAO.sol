// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAragonDAO Interface
 * @notice Interface for interacting with Aragon OSx DAO
 * @dev Includes ERC-1271 signature validation and permission management
 */
interface IAragonDAO {
    /**
     * @dev ERC-1271: Standard signature validation for contracts
     * @param hash Hash of the data to be signed
     * @param signature Signature byte array associated with hash
     * @return magicValue The magic value 0x1626ba7e when signature is valid
     */
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4 magicValue);
    
    /**
     * @dev Execute an action from the DAO
     * @param _target The address to call
     * @param _value The ETH value to send
     * @param _data The calldata for the call
     * @return The return data from the call
     */
    function execute(
        address _target,
        uint256 _value,
        bytes calldata _data
    ) external returns (bytes memory);
    
    /**
     * @dev Grant a permission
     * @param _where The address of the target contract
     * @param _who The address to grant the permission to
     * @param _permissionId The permission identifier
     */
    function grant(
        address _where,
        address _who,
        bytes32 _permissionId
    ) external;
    
    /**
     * @dev Grant a permission with a condition
     * @param _where The address of the target contract
     * @param _who The address to grant the permission to
     * @param _permissionId The permission identifier
     * @param _condition The address of the condition contract
     */
    function grantWithCondition(
        address _where,
        address _who,
        bytes32 _permissionId,
        address _condition
    ) external;
    
    /**
     * @dev Revoke a permission
     * @param _where The address of the target contract
     * @param _who The address to revoke the permission from
     * @param _permissionId The permission identifier
     */
    function revoke(
        address _where,
        address _who,
        bytes32 _permissionId
    ) external;
    
    /**
     * @dev Check if a permission is granted
     * @param _where The address of the target contract
     * @param _who The address to check the permission for
     * @param _permissionId The permission identifier
     * @return True if the permission is granted
     */
    function hasPermission(
        address _where,
        address _who,
        bytes32 _permissionId
    ) external view returns (bool);
}

/**
 * @title IPermissionCondition
 * @notice Interface for permission conditions in Aragon OSx
 */
interface IPermissionCondition {
    /**
     * @dev Check if the permission should be granted
     * @param _where The address of the target contract
     * @param _who The address requesting the permission
     * @param _permissionId The permission identifier
     * @param _data Additional data for the condition check
     * @return True if the condition is met
     */
    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view returns (bool);
}