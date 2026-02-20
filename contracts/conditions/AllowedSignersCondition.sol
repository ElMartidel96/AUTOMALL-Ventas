// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAragonDAO.sol";

/**
 * @title AllowedSignersCondition
 * @notice Permission condition for managing allowed signers in the Vault
 * @dev Implements IPermissionCondition for Aragon OSx permission system
 * 
 * This condition allows the DAO to maintain a list of authorized signers
 * who can create release orders, while the DAO itself validates via ERC-1271
 * 
 * @author CryptoGift Wallets DAO
 */
contract AllowedSignersCondition is IPermissionCondition {
    // ============ State Variables ============
    
    /// @notice The Aragon DAO that owns this condition
    address public immutable dao;
    
    /// @notice The GovTokenVault contract this condition applies to
    address public immutable vault;
    
    /// @notice Mapping of allowed signer addresses
    mapping(address => bool) public allowedSigners;
    
    /// @notice Count of allowed signers
    uint256 public signerCount;
    
    // ============ Events ============
    
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event SignersRotated(address[] removed, address[] added);
    
    // ============ Errors ============
    
    error OnlyDAO();
    error SignerAlreadyExists();
    error SignerNotFound();
    error InvalidSigner();
    error InvalidCaller();
    
    // ============ Modifiers ============
    
    modifier onlyDAO() {
        if (msg.sender != dao) revert OnlyDAO();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _dao, address _vault, address[] memory _initialSigners) {
        dao = _dao;
        vault = _vault;
        
        // Add initial signers
        for (uint256 i = 0; i < _initialSigners.length; i++) {
            if (_initialSigners[i] == address(0)) revert InvalidSigner();
            if (!allowedSigners[_initialSigners[i]]) {
                allowedSigners[_initialSigners[i]] = true;
                signerCount++;
                emit SignerAdded(_initialSigners[i]);
            }
        }
    }
    
    // ============ Permission Condition Implementation ============
    
    /**
     * @notice Check if the permission should be granted
     * @dev Called by Aragon permission manager
     * @param _where The contract being called (should be vault)
     * @param _who The address calling the function
     * @param _permissionId The permission being checked
     * @param _data Additional data (can contain signer info)
     * @return True if permission should be granted
     */
    function isGranted(
        address _where,
        address _who,
        bytes32 _permissionId,
        bytes calldata _data
    ) external view override returns (bool) {
        // Only apply to our vault
        if (_where != vault) return false;
        
        // The vault itself should always have permission (for internal calls)
        if (_who == vault) return true;
        
        // Check if the caller is the DAO (for admin functions)
        if (_who == dao) return true;
        
        // For regular callers, check if they're allowed signers
        // This is used when someone calls releaseWithOrder
        // The actual signature validation happens in the vault
        
        // If data contains a signer address, check that signer
        if (_data.length >= 20) {
            address signer;
            assembly {
                signer := shr(96, calldataload(add(_data.offset, 0)))
            }
            return allowedSigners[signer];
        }
        
        // Otherwise, check if the caller is an allowed signer
        return allowedSigners[_who];
    }
    
    // ============ Admin Functions (DAO Only) ============
    
    /**
     * @notice Add a new allowed signer
     * @param signer The address to add as an allowed signer
     */
    function addSigner(address signer) external onlyDAO {
        if (signer == address(0)) revert InvalidSigner();
        if (allowedSigners[signer]) revert SignerAlreadyExists();
        
        allowedSigners[signer] = true;
        signerCount++;
        
        emit SignerAdded(signer);
    }
    
    /**
     * @notice Remove an allowed signer
     * @param signer The address to remove from allowed signers
     */
    function removeSigner(address signer) external onlyDAO {
        if (!allowedSigners[signer]) revert SignerNotFound();
        
        allowedSigners[signer] = false;
        signerCount--;
        
        emit SignerRemoved(signer);
    }
    
    /**
     * @notice Rotate multiple signers at once (atomic operation)
     * @param toRemove Array of signers to remove
     * @param toAdd Array of signers to add
     */
    function rotateSigners(
        address[] calldata toRemove,
        address[] calldata toAdd
    ) external onlyDAO {
        // Remove old signers
        for (uint256 i = 0; i < toRemove.length; i++) {
            if (allowedSigners[toRemove[i]]) {
                allowedSigners[toRemove[i]] = false;
                signerCount--;
            }
        }
        
        // Add new signers
        for (uint256 i = 0; i < toAdd.length; i++) {
            if (toAdd[i] == address(0)) revert InvalidSigner();
            if (!allowedSigners[toAdd[i]]) {
                allowedSigners[toAdd[i]] = true;
                signerCount++;
            }
        }
        
        emit SignersRotated(toRemove, toAdd);
    }
    
    /**
     * @notice Batch check multiple signers
     * @param signers Array of addresses to check
     * @return statuses Array of booleans indicating if each signer is allowed
     */
    function batchCheckSigners(
        address[] calldata signers
    ) external view returns (bool[] memory statuses) {
        statuses = new bool[](signers.length);
        for (uint256 i = 0; i < signers.length; i++) {
            statuses[i] = allowedSigners[signers[i]];
        }
    }
    
    /**
     * @notice Get all allowed signers (gas intensive, use with care)
     * @dev This is for off-chain reading, not recommended for on-chain use
     * @param offset Starting index for pagination
     * @param limit Maximum number of results
     * @return signers Array of allowed signer addresses
     */
    function getAllowedSigners(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory signers) {
        // This would require maintaining an array of signers
        // For now, this is a placeholder that returns empty
        // In production, consider using an enumerable set
        signers = new address[](0);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check if an address is an allowed signer
     * @param signer The address to check
     * @return True if the address is an allowed signer
     */
    function isSigner(address signer) external view returns (bool) {
        return allowedSigners[signer];
    }
    
    /**
     * @notice Get the total number of allowed signers
     * @return The count of allowed signers
     */
    function getSignerCount() external view returns (uint256) {
        return signerCount;
    }
}