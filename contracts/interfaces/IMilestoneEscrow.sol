// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMilestoneEscrow
 * @notice Interface for Milestone Escrow contract
 */
interface IMilestoneEscrow {
    // ============ Enums ============
    
    enum MilestoneStatus {
        PENDING,
        IN_PROGRESS,
        SUBMITTED,
        VERIFIED,
        RELEASED,
        EXPIRED,
        DISPUTED,
        CANCELLED
    }
    
    enum DisputeOutcome {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED
    }
    
    // ============ Structs ============
    
    struct Batch {
        bytes32 batchId;
        address depositor;
        address eip712Contract;
        uint256 originalAmount;
        uint256 remainingAmount;
        uint256 depositTime;
        uint256 lastActivity;
        bool isLocked;
        bool isExpired;
    }
    
    struct Milestone {
        bytes32 milestoneId;
        bytes32 batchId;
        bytes32 taskId;
        address collaborator;
        uint256 amount;
        uint256 createdAt;
        uint256 deadline;
        bool released;
        bool cancelled;
        bool disputed;
        MilestoneStatus status;
    }
    
    struct Dispute {
        bytes32 milestoneId;
        address initiator;
        string reason;
        bytes evidence;
        uint256 initiatedAt;
        uint256 votesFor;
        uint256 votesAgainst;
        bool resolved;
        DisputeOutcome outcome;
    }
    
    // ============ Functions ============
    
    /**
     * @notice Deposit tokens with specific EIP-712 rules
     * @param amount Amount to deposit
     * @param eip712Contract EIP-712 contract that will control this batch
     * @param masterSignature Signature from master controller
     * @return batchId Unique identifier for this batch
     */
    function depositWithRules(
        uint256 amount,
        address eip712Contract,
        bytes calldata masterSignature
    ) external returns (bytes32 batchId);
    
    /**
     * @notice Create a milestone funded by a batch
     * @param batchId Batch to fund from
     * @param taskId Task identifier from EIP-712
     * @param collaborator Address that will complete the task
     * @param amount Reward amount
     * @param deadline Task deadline
     */
    function createMilestone(
        bytes32 batchId,
        bytes32 taskId,
        address collaborator,
        uint256 amount,
        uint256 deadline
    ) external returns (bytes32 milestoneId);
    
    /**
     * @notice Release funds for a completed milestone
     * @param milestoneId Milestone to release
     * @param taskId Task identifier for validation
     * @param eip712Signature Signature from EIP-712 validator
     */
    function releaseFunds(
        bytes32 milestoneId,
        bytes32 taskId,
        bytes calldata eip712Signature
    ) external;
    
    /**
     * @notice Withdraw accumulated funds
     */
    function withdraw() external;
    
    // ============ View Functions ============
    
    /**
     * @notice Get batch details
     */
    function getBatch(bytes32 batchId) external view returns (Batch memory);
    
    /**
     * @notice Get milestone details
     */
    function getMilestone(bytes32 milestoneId) external view returns (Milestone memory);
    
    /**
     * @notice Get pending withdrawals
     */
    function pendingWithdrawals(address account) external view returns (uint256);
    
    /**
     * @notice Get contract statistics
     */
    function getStatistics() external view returns (
        uint256 deposited,
        uint256 locked,
        uint256 released,
        uint256 disputed,
        uint256 batchCount,
        uint256 milestoneCount
    );
    
    // ============ Events ============
    
    event BatchDeposited(
        bytes32 indexed batchId,
        address indexed depositor,
        address indexed eip712Contract,
        uint256 amount,
        uint256 timestamp
    );
    
    event MilestoneCreated(
        bytes32 indexed milestoneId,
        bytes32 indexed batchId,
        address indexed collaborator,
        uint256 amount,
        uint256 deadline
    );
    
    event FundsReleased(
        bytes32 indexed milestoneId,
        address indexed recipient,
        uint256 amount,
        bytes32 txHash
    );
}