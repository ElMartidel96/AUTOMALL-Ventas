// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title TaskRulesEIP712
 * @author CryptoGift DAO Team
 * @notice Defines task structure and validation rules using EIP-712 standard
 * @dev This contract validates task completion and calculates rewards WITHOUT LIMITS
 * 
 * Features:
 * - Task structure with all necessary fields
 * - Reward calculation from 1 wei to unlimited amounts
 * - EIP-712 signature validation
 * - Multi-sig support for validation
 * - Complexity levels 1-5 + custom amounts
 * - Deadline management
 */
contract TaskRulesEIP712 is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // ============ Constants ============
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    bytes32 public constant TASK_TYPEHASH = keccak256(
        "Task(bytes32 taskId,string platform,address assignee,uint8 complexity,uint256 rewardAmount,uint256 deadline,bytes32 verificationHash)"
    );
    
    bytes32 public constant COMPLETION_TYPEHASH = keccak256(
        "TaskCompletion(bytes32 taskId,address completer,uint256 completedAt,bytes32 proofHash,uint256 nonce)"
    );
    
    bytes32 public constant RELEASE_TYPEHASH = keccak256(
        "FundRelease(bytes32 taskId,address recipient,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    // ============ State Variables ============
    
    // Task management
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => bool) public taskExists;
    mapping(bytes32 => TaskCompletion) public completions;
    mapping(address => uint256) public nonces;
    
    // Reward configuration (NO LIMITS)
    mapping(uint8 => uint256) public baseRewards;
    uint256 public customRewardMultiplier = 100; // Basis points (100 = 1%)
    
    // Statistics
    uint256 public totalTasksCreated;
    uint256 public totalTasksCompleted;
    uint256 public totalRewardsReleased;
    
    // Authorized signers for multi-sig validation
    mapping(address => bool) public authorizedSigners;
    uint256 public requiredSignatures = 1;
    
    // Platform configuration
    mapping(string => bool) public allowedPlatforms;

    // ============ Structs ============
    
    struct Task {
        bytes32 taskId;
        string platform;          // "github", "discord", "manual"
        address assignee;
        uint8 complexity;          // 1-5 scale, 0 for custom
        uint256 rewardAmount;      // NO LIMITS - can be any amount
        uint256 deadline;
        bytes32 verificationHash;  // Hash of completion criteria
        uint256 createdAt;
        address creator;
        bool isActive;
    }
    
    struct TaskCompletion {
        bytes32 taskId;
        address completer;
        uint256 completedAt;
        bytes32 proofHash;         // Hash of completion proof (e.g., PR link)
        bool isValidated;
        uint256 validatedAt;
        address[] validators;      // Who validated this completion
    }

    // ============ Events ============
    
    event TaskCreated(
        bytes32 indexed taskId,
        address indexed assignee,
        uint256 rewardAmount,
        uint256 deadline,
        address creator
    );
    
    event TaskCompleted(
        bytes32 indexed taskId,
        address indexed completer,
        bytes32 proofHash,
        uint256 timestamp
    );
    
    event TaskValidated(
        bytes32 indexed taskId,
        address indexed validator,
        bool approved,
        uint256 timestamp
    );
    
    event RewardReleased(
        bytes32 indexed taskId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event RequiredSignaturesUpdated(uint256 oldValue, uint256 newValue);
    event BaseRewardUpdated(uint8 complexity, uint256 amount);
    event PlatformUpdated(string platform, bool allowed);

    // ============ Modifiers ============
    
    modifier onlyValidator() {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "Not a validator");
        _;
    }
    
    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, msg.sender), "Not a manager");
        _;
    }
    
    modifier taskMustExist(bytes32 taskId) {
        require(taskExists[taskId], "Task does not exist");
        _;
    }

    // ============ Constructor ============
    
    constructor() EIP712("TaskRulesEIP712", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        
        // Initialize default base rewards (can be changed later)
        baseRewards[1] = 100 * 10**18;  // 100 CGC
        baseRewards[2] = 110 * 10**18;  // 110 CGC
        baseRewards[3] = 120 * 10**18;  // 120 CGC
        baseRewards[4] = 135 * 10**18;  // 135 CGC
        baseRewards[5] = 150 * 10**18;  // 150 CGC
        
        // Initialize allowed platforms
        allowedPlatforms["github"] = true;
        allowedPlatforms["discord"] = true;
        allowedPlatforms["manual"] = true;
        allowedPlatforms["custom"] = true;
        
        // Add deployer as authorized signer
        authorizedSigners[msg.sender] = true;
        
        emit SignerAdded(msg.sender);
    }

    // ============ Task Management Functions ============
    
    /**
     * @notice Create a new task
     * @param taskId Unique identifier for the task
     * @param platform Platform where task is from
     * @param assignee Address assigned to complete the task
     * @param complexity Complexity level (1-5) or 0 for custom
     * @param customReward Custom reward amount (used if complexity is 0)
     * @param deadline Deadline for task completion
     * @param verificationHash Hash of completion criteria
     */
    function createTask(
        bytes32 taskId,
        string calldata platform,
        address assignee,
        uint8 complexity,
        uint256 customReward,
        uint256 deadline,
        bytes32 verificationHash
    ) 
        external 
        onlyManager 
        whenNotPaused 
    {
        require(!taskExists[taskId], "Task already exists");
        require(allowedPlatforms[platform], "Platform not allowed");
        require(assignee != address(0), "Invalid assignee");
        require(deadline > block.timestamp, "Invalid deadline");
        require(complexity <= 5, "Invalid complexity");
        
        uint256 rewardAmount;
        if (complexity == 0) {
            // Custom reward - NO LIMITS
            require(customReward > 0, "Custom reward must be > 0");
            rewardAmount = customReward;
        } else {
            rewardAmount = baseRewards[complexity];
            require(rewardAmount > 0, "Base reward not set");
        }
        
        tasks[taskId] = Task({
            taskId: taskId,
            platform: platform,
            assignee: assignee,
            complexity: complexity,
            rewardAmount: rewardAmount,
            deadline: deadline,
            verificationHash: verificationHash,
            createdAt: block.timestamp,
            creator: msg.sender,
            isActive: true
        });
        
        taskExists[taskId] = true;
        totalTasksCreated++;
        
        emit TaskCreated(taskId, assignee, rewardAmount, deadline, msg.sender);
    }
    
    /**
     * @notice Submit task completion
     * @param taskId The task being completed
     * @param proofHash Hash of the completion proof
     */
    function submitCompletion(
        bytes32 taskId,
        bytes32 proofHash
    ) 
        external 
        taskMustExist(taskId) 
        whenNotPaused 
    {
        Task storage task = tasks[taskId];
        require(task.isActive, "Task not active");
        require(msg.sender == task.assignee, "Not task assignee");
        require(block.timestamp <= task.deadline, "Task expired");
        require(!completions[taskId].isValidated, "Already completed");
        
        completions[taskId] = TaskCompletion({
            taskId: taskId,
            completer: msg.sender,
            completedAt: block.timestamp,
            proofHash: proofHash,
            isValidated: false,
            validatedAt: 0,
            validators: new address[](0)
        });
        
        emit TaskCompleted(taskId, msg.sender, proofHash, block.timestamp);
    }

    // ============ Validation Functions ============
    
    /**
     * @notice Validate task completion and authorize reward release
     * @param taskId Task to validate
     * @param recipient Address to receive the reward
     * @param amount Amount to release (must match task reward)
     * @param signature Validator signature
     * @return bool Whether validation succeeded
     */
    function validateRelease(
        bytes32 taskId,
        address recipient,
        uint256 amount,
        bytes calldata signature
    ) 
        external 
        view 
        whenNotPaused 
        returns (bool) 
    {
        if (!taskExists[taskId]) return false;
        
        Task memory task = tasks[taskId];
        if (!task.isActive) return false;
        if (amount != task.rewardAmount) return false;
        if (recipient != task.assignee) return false;
        
        TaskCompletion memory completion = completions[taskId];
        if (completion.completer == address(0)) return false;
        if (completion.completer != recipient) return false;
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            RELEASE_TYPEHASH,
            taskId,
            recipient,
            amount,
            nonces[recipient],
            task.deadline
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        return authorizedSigners[signer];
    }
    
    /**
     * @notice Validate task completion with multi-sig
     * @param taskId Task to validate
     * @param approve Whether to approve the completion
     */
    function validateCompletion(
        bytes32 taskId,
        bool approve
    ) 
        external 
        onlyValidator 
        taskMustExist(taskId) 
        whenNotPaused 
    {
        TaskCompletion storage completion = completions[taskId];
        require(completion.completer != address(0), "No completion submitted");
        require(!completion.isValidated, "Already validated");
        
        // Check if validator already voted
        for (uint i = 0; i < completion.validators.length; i++) {
            require(completion.validators[i] != msg.sender, "Already voted");
        }
        
        completion.validators.push(msg.sender);
        
        if (approve && completion.validators.length >= requiredSignatures) {
            completion.isValidated = true;
            completion.validatedAt = block.timestamp;
            totalTasksCompleted++;
            
            Task storage task = tasks[taskId];
            totalRewardsReleased += task.rewardAmount;
        }
        
        emit TaskValidated(taskId, msg.sender, approve, block.timestamp);
    }

    // ============ Reward Calculation Functions ============
    
    /**
     * @notice Calculate reward for a given complexity
     * @param complexity Task complexity (1-5)
     * @return uint256 Reward amount in wei
     */
    function calculateReward(uint8 complexity) 
        external 
        view 
        returns (uint256) 
    {
        if (complexity == 0 || complexity > 5) {
            return 0; // Custom amount needed
        }
        return baseRewards[complexity];
    }
    
    /**
     * @notice Calculate custom reward with multiplier
     * @param baseAmount Base amount to multiply
     * @return uint256 Final reward amount
     */
    function calculateCustomReward(uint256 baseAmount) 
        external 
        view 
        returns (uint256) 
    {
        // NO LIMITS - can return any amount
        return (baseAmount * customRewardMultiplier) / 100;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update base reward for a complexity level
     * @param complexity Complexity level (1-5)
     * @param amount New reward amount (NO LIMITS)
     */
    function updateBaseReward(uint8 complexity, uint256 amount) 
        external 
        onlyManager 
    {
        require(complexity >= 1 && complexity <= 5, "Invalid complexity");
        // NO LIMIT CHECK - amount can be anything
        
        baseRewards[complexity] = amount;
        emit BaseRewardUpdated(complexity, amount);
    }
    
    /**
     * @notice Add authorized signer
     * @param signer Address to authorize
     */
    function addAuthorizedSigner(address signer) 
        external 
        onlyManager 
    {
        require(signer != address(0), "Invalid signer");
        require(!authorizedSigners[signer], "Already authorized");
        
        authorizedSigners[signer] = true;
        emit SignerAdded(signer);
    }
    
    /**
     * @notice Remove authorized signer
     * @param signer Address to remove
     */
    function removeAuthorizedSigner(address signer) 
        external 
        onlyManager 
    {
        require(authorizedSigners[signer], "Not authorized");
        
        authorizedSigners[signer] = false;
        emit SignerRemoved(signer);
    }
    
    /**
     * @notice Update required signatures for validation
     * @param required New number of required signatures
     */
    function updateRequiredSignatures(uint256 required) 
        external 
        onlyManager 
    {
        require(required > 0, "Must be > 0");
        
        uint256 oldValue = requiredSignatures;
        requiredSignatures = required;
        
        emit RequiredSignaturesUpdated(oldValue, required);
    }
    
    /**
     * @notice Update platform allowance
     * @param platform Platform name
     * @param allowed Whether it's allowed
     */
    function updatePlatform(string calldata platform, bool allowed) 
        external 
        onlyManager 
    {
        allowedPlatforms[platform] = allowed;
        emit PlatformUpdated(platform, allowed);
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyManager {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyManager {
        _unpause();
    }
    
    /**
     * @notice Cancel a task
     * @param taskId Task to cancel
     */
    function cancelTask(bytes32 taskId) 
        external 
        onlyManager 
        taskMustExist(taskId) 
    {
        tasks[taskId].isActive = false;
    }

    // ============ View Functions ============
    
    /**
     * @notice Get task details
     * @param taskId Task identifier
     * @return Task struct
     */
    function getTask(bytes32 taskId) 
        external 
        view 
        returns (Task memory) 
    {
        return tasks[taskId];
    }
    
    /**
     * @notice Get completion details
     * @param taskId Task identifier
     * @return TaskCompletion struct
     */
    function getCompletion(bytes32 taskId) 
        external 
        view 
        returns (TaskCompletion memory) 
    {
        return completions[taskId];
    }
    
    /**
     * @notice Check if address is authorized signer
     * @param signer Address to check
     * @return bool Whether authorized
     */
    function isAuthorizedSigner(address signer) 
        external 
        view 
        returns (bool) 
    {
        return authorizedSigners[signer];
    }
    
    /**
     * @notice Get statistics
     * @return created Total tasks created
     * @return completed Total tasks completed
     * @return released Total rewards released
     */
    function getStatistics() 
        external 
        view 
        returns (
            uint256 created,
            uint256 completed,
            uint256 released
        ) 
    {
        return (totalTasksCreated, totalTasksCompleted, totalRewardsReleased);
    }
    
    /**
     * @notice Get domain separator for EIP-712
     * @return bytes32 Domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    /**
     * @notice Increment nonce for replay protection
     * @param account Account to increment nonce for
     */
    function incrementNonce(address account) external {
        require(msg.sender == account || hasRole(MANAGER_ROLE, msg.sender), "Unauthorized");
        nonces[account]++;
    }
}