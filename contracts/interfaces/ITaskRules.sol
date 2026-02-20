// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITaskRules
 * @notice Interface for Task Rules EIP-712 contracts
 */
interface ITaskRules {
    // ============ Structs ============
    
    struct Task {
        bytes32 taskId;
        string platform;
        address assignee;
        uint8 complexity;
        uint256 rewardAmount;
        uint256 deadline;
        bytes32 verificationHash;
        uint256 createdAt;
        address creator;
        bool isActive;
    }
    
    struct TaskCompletion {
        bytes32 taskId;
        address completer;
        uint256 completedAt;
        bytes32 proofHash;
        bool isValidated;
        uint256 validatedAt;
        address[] validators;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Validate task completion and authorize reward release
     * @param taskId Task to validate
     * @param recipient Address to receive the reward
     * @param amount Amount to release
     * @param signature Validator signature
     * @return bool Whether validation succeeded
     */
    function validateRelease(
        bytes32 taskId,
        address recipient,
        uint256 amount,
        bytes calldata signature
    ) external view returns (bool);
    
    /**
     * @notice Calculate reward for a given complexity
     * @param complexity Task complexity (1-5)
     * @return uint256 Reward amount in wei
     */
    function calculateReward(uint8 complexity) external view returns (uint256);
    
    /**
     * @notice Get task details
     * @param taskId Task identifier
     * @return Task struct
     */
    function getTask(bytes32 taskId) external view returns (Task memory);
    
    /**
     * @notice Get completion details
     * @param taskId Task identifier
     * @return TaskCompletion struct
     */
    function getCompletion(bytes32 taskId) external view returns (TaskCompletion memory);
    
    /**
     * @notice Check if address is authorized signer
     * @param signer Address to check
     * @return bool Whether authorized
     */
    function isAuthorizedSigner(address signer) external view returns (bool);
    
    /**
     * @notice Get domain separator for EIP-712
     * @return bytes32 Domain separator
     */
    function getDomainSeparator() external view returns (bytes32);
    
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
    
    event RewardReleased(
        bytes32 indexed taskId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
}