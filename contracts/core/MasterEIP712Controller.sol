// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MasterEIP712Controller
 * @author CryptoGift DAO Team
 * @notice Master controller that authorizes which EIP-712 contracts can interact with escrows
 * @dev This is the top security layer - only owner can authorize EIP-712 contracts
 * 
 * Architecture:
 * MasterController → Authorizes EIP-712 → Controls Escrow Batches
 * 
 * Security Features:
 * - Owner-only authorization
 * - Pausable for emergencies
 * - Rate limiting
 * - Nonce system for replay protection
 * - Event logging for complete audit trail
 */
contract MasterEIP712Controller is Ownable, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // ============ Constants ============
    bytes32 public constant AUTHORIZATION_TYPEHASH = keccak256(
        "Authorization(address escrow,address eip712Contract,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    
    uint256 public constant MIN_AUTHORIZATION_INTERVAL = 1 hours;
    uint256 public constant MAX_AUTHORIZED_CONTRACTS = 100;

    // ============ State Variables ============
    
    // Escrow → EIP-712 → Authorized
    mapping(address => mapping(address => bool)) public escrowToEIP712Authorization;
    
    // Global authorization for EIP-712 contracts
    mapping(address => bool) public globallyAuthorizedEIP712;
    
    // Authorized escrows that can use this master
    mapping(address => bool) public authorizedEscrows;
    
    // Rate limiting
    mapping(address => uint256) public lastAuthorizationTime;
    
    // Nonce management for replay protection
    mapping(address => uint256) public nonces;
    
    // Statistics
    uint256 public totalAuthorizations;
    uint256 public totalRevocations;
    uint256 public activeAuthorizations;
    
    // Emergency contacts
    address public emergencyAdmin;
    address public technicalAdmin;

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
    
    event EscrowAuthorized(
        address indexed escrow,
        uint256 timestamp
    );
    
    event EscrowRevoked(
        address indexed escrow,
        uint256 timestamp
    );
    
    event GlobalAuthorizationSet(
        address indexed eip712Contract,
        bool authorized,
        uint256 timestamp
    );
    
    event EmergencyAdminUpdated(
        address indexed oldAdmin,
        address indexed newAdmin
    );
    
    event TechnicalAdminUpdated(
        address indexed oldAdmin,
        address indexed newAdmin
    );
    
    event EmergencyActionExecuted(
        string action,
        address executor,
        uint256 timestamp
    );

    // ============ Modifiers ============
    
    modifier onlyAuthorizedAdmin() {
        require(
            msg.sender == owner() || 
            msg.sender == emergencyAdmin || 
            msg.sender == technicalAdmin,
            "Not authorized admin"
        );
        _;
    }
    
    modifier rateLimited(address target) {
        require(
            block.timestamp >= lastAuthorizationTime[target] + MIN_AUTHORIZATION_INTERVAL,
            "Rate limit exceeded"
        );
        _;
        lastAuthorizationTime[target] = block.timestamp;
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        require(addr != address(this), "Cannot be self");
        _;
    }

    // ============ Constructor ============
    
    /**
     * @notice Initialize the Master Controller
     * @param _emergencyAdmin Address that can pause in emergencies
     * @param _technicalAdmin Address that can manage technical operations
     */
    constructor(
        address _emergencyAdmin,
        address _technicalAdmin
    ) Ownable(_emergencyAdmin) EIP712("MasterEIP712Controller", "1") {
        require(_emergencyAdmin != address(0), "Invalid emergency admin");
        require(_technicalAdmin != address(0), "Invalid technical admin");
        
        emergencyAdmin = _emergencyAdmin;
        technicalAdmin = _technicalAdmin;
        
        emit EmergencyAdminUpdated(address(0), _emergencyAdmin);
        emit TechnicalAdminUpdated(address(0), _technicalAdmin);
    }

    // ============ Authorization Functions ============
    
    /**
     * @notice Authorize an EIP-712 contract for a specific escrow
     * @param escrow The escrow contract address
     * @param eip712Contract The EIP-712 rules contract to authorize
     */
    function authorizeEIP712ForEscrow(
        address escrow,
        address eip712Contract
    ) 
        external 
        onlyOwner 
        whenNotPaused 
        validAddress(escrow)
        validAddress(eip712Contract)
        rateLimited(escrow)
    {
        require(authorizedEscrows[escrow], "Escrow not authorized");
        require(!escrowToEIP712Authorization[escrow][eip712Contract], "Already authorized");
        require(activeAuthorizations < MAX_AUTHORIZED_CONTRACTS, "Max authorizations reached");
        
        escrowToEIP712Authorization[escrow][eip712Contract] = true;
        totalAuthorizations++;
        activeAuthorizations++;
        
        emit EIP712Authorized(escrow, eip712Contract, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Revoke an EIP-712 contract authorization for a specific escrow
     * @param escrow The escrow contract address
     * @param eip712Contract The EIP-712 rules contract to revoke
     */
    function revokeEIP712Authorization(
        address escrow,
        address eip712Contract
    ) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(escrowToEIP712Authorization[escrow][eip712Contract], "Not authorized");
        
        escrowToEIP712Authorization[escrow][eip712Contract] = false;
        totalRevocations++;
        activeAuthorizations--;
        
        emit EIP712Revoked(escrow, eip712Contract, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Authorize an escrow to use this master controller
     * @param escrow The escrow contract to authorize
     */
    function authorizeEscrow(address escrow) 
        external 
        onlyOwner 
        whenNotPaused 
        validAddress(escrow)
    {
        require(!authorizedEscrows[escrow], "Already authorized");
        
        authorizedEscrows[escrow] = true;
        
        emit EscrowAuthorized(escrow, block.timestamp);
    }
    
    /**
     * @notice Revoke an escrow's authorization
     * @param escrow The escrow contract to revoke
     */
    function revokeEscrow(address escrow) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(authorizedEscrows[escrow], "Not authorized");
        
        authorizedEscrows[escrow] = false;
        
        emit EscrowRevoked(escrow, block.timestamp);
    }
    
    /**
     * @notice Set global authorization for an EIP-712 contract
     * @param eip712Contract The EIP-712 contract
     * @param authorized Whether it's globally authorized
     */
    function setGlobalAuthorization(
        address eip712Contract,
        bool authorized
    ) 
        external 
        onlyOwner 
        whenNotPaused 
        validAddress(eip712Contract)
    {
        globallyAuthorizedEIP712[eip712Contract] = authorized;
        
        emit GlobalAuthorizationSet(eip712Contract, authorized, block.timestamp);
    }

    // ============ Validation Functions ============
    
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
    ) 
        external 
        view 
        whenNotPaused 
        returns (bool) 
    {
        // Check basic authorizations
        if (!authorizedEscrows[escrow]) return false;
        
        // Check if globally authorized or specifically authorized
        bool contractAuthorized = globallyAuthorizedEIP712[eip712Contract] || 
                           escrowToEIP712Authorization[escrow][eip712Contract];
        
        if (!contractAuthorized) return false;
        
        // Check deadline
        if (block.timestamp > deadline) return false;
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            AUTHORIZATION_TYPEHASH,
            escrow,
            eip712Contract,
            amount,
            nonces[escrow],
            deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        return signer == owner();
    }
    
    /**
     * @notice Simple check if an EIP-712 is authorized for an escrow
     * @param escrow The escrow contract
     * @param eip712Contract The EIP-712 contract
     * @return bool Whether it's authorized
     */
    function isAuthorized(
        address escrow,
        address eip712Contract
    ) 
        external 
        view 
        returns (bool) 
    {
        if (!authorizedEscrows[escrow]) return false;
        
        return globallyAuthorizedEIP712[eip712Contract] || 
               escrowToEIP712Authorization[escrow][eip712Contract];
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update emergency admin
     * @param newAdmin New emergency admin address
     */
    function updateEmergencyAdmin(address newAdmin) 
        external 
        onlyOwner 
        validAddress(newAdmin)
    {
        address oldAdmin = emergencyAdmin;
        emergencyAdmin = newAdmin;
        
        emit EmergencyAdminUpdated(oldAdmin, newAdmin);
    }
    
    /**
     * @notice Update technical admin
     * @param newAdmin New technical admin address
     */
    function updateTechnicalAdmin(address newAdmin) 
        external 
        onlyOwner 
        validAddress(newAdmin)
    {
        address oldAdmin = technicalAdmin;
        technicalAdmin = newAdmin;
        
        emit TechnicalAdminUpdated(oldAdmin, newAdmin);
    }
    
    /**
     * @notice Pause the contract in case of emergency
     */
    function pause() external onlyAuthorizedAdmin {
        _pause();
        emit EmergencyActionExecuted("pause", msg.sender, block.timestamp);
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyActionExecuted("unpause", msg.sender, block.timestamp);
    }
    
    /**
     * @notice Increment nonce for an address (for invalidating signatures)
     * @param account The account to increment nonce for
     */
    function incrementNonce(address account) external onlyOwner {
        nonces[account]++;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current nonce for an address
     * @param account The account to check
     * @return uint256 The current nonce
     */
    function getNonce(address account) external view returns (uint256) {
        return nonces[account];
    }
    
    /**
     * @notice Get statistics about authorizations
     * @return total Total authorizations made
     * @return revoked Total revocations made
     * @return active Currently active authorizations
     */
    function getStatistics() 
        external 
        view 
        returns (
            uint256 total,
            uint256 revoked,
            uint256 active
        ) 
    {
        return (totalAuthorizations, totalRevocations, activeAuthorizations);
    }
    
    /**
     * @notice Check if caller is an admin
     * @param account Address to check
     * @return bool Whether the address is an admin
     */
    function isAdmin(address account) external view returns (bool) {
        return account == owner() || 
               account == emergencyAdmin || 
               account == technicalAdmin;
    }
    
    /**
     * @notice Get domain separator for EIP-712
     * @return bytes32 The domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}