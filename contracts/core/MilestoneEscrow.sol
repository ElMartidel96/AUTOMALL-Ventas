// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMasterController.sol";
import "../interfaces/ITaskRules.sol";

/**
 * @title MilestoneEscrow
 * @author CryptoGift DAO Team
 * @notice Secure escrow for CGC tokens with batch management and EIP-712 validation
 * @dev Each batch is immutably tied to its EIP-712 contract for maximum security
 * 
 * Security Features:
 * - Each batch immutably tied to specific EIP-712
 * - Master controller validation required
 * - Rate limiting (1 hour between deposits)
 * - Minimum deposit amount (100 CGC)
 * - Circuit breaker for emergencies
 * - Dispute resolution system
 * - Auto-recovery of expired funds
 * - NO LIMITS on release amounts
 */
contract MilestoneEscrow is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    uint256 public constant MIN_DEPOSIT_AMOUNT = 100 * 10**18; // 100 CGC minimum
    uint256 public constant MIN_DEPOSIT_INTERVAL = 1 hours;    // Rate limiting
    uint256 public constant GRACE_PERIOD = 30 days;            // Before funds can be reclaimed
    uint256 public constant MAX_BATCH_RELEASES = 100;          // Max releases in one tx
    uint256 public constant DISPUTE_RESOLUTION_TIME = 7 days;  // Time to resolve disputes

    // ============ State Variables ============
    
    IERC20 public immutable cgcToken;
    IMasterController public immutable masterController;
    
    // Batch management
    mapping(bytes32 => Batch) public batches;
    mapping(address => bytes32[]) public depositorBatches;
    mapping(address => bytes32[]) public eip712Batches;
    
    // Milestone management
    mapping(bytes32 => Milestone) public milestones;
    mapping(address => bytes32[]) public collaboratorMilestones;
    mapping(bytes32 => bytes32[]) public batchMilestones;
    
    // Dispute management
    mapping(bytes32 => Dispute) public disputes;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    // Rate limiting
    mapping(address => uint256) public lastDepositTime;
    
    // Pending withdrawals (pull pattern)
    mapping(address => uint256) public pendingWithdrawals;
    
    // Statistics
    uint256 public totalDeposited;
    uint256 public totalLocked;
    uint256 public totalReleased;
    uint256 public totalDisputed;
    uint256 public totalBatches;
    uint256 public totalMilestones;
    
    // Circuit breaker
    uint256 public maxTotalDeposits = 10_000_000 * 10**18; // 10M CGC max
    bool public depositsEnabled = true;
    bool public releasesEnabled = true;

    // ============ Structs ============
    
    struct Batch {
        bytes32 batchId;
        address depositor;
        address eip712Contract;    // Immutably tied to this EIP-712
        uint256 originalAmount;    // Original deposit
        uint256 remainingAmount;   // Current balance
        uint256 depositTime;
        uint256 lastActivity;
        bool isLocked;             // Cannot be changed once locked
        bool isExpired;
    }
    
    struct Milestone {
        bytes32 milestoneId;
        bytes32 batchId;           // Which batch funds this
        bytes32 taskId;            // Task from EIP-712
        address collaborator;
        uint256 amount;            // NO LIMITS
        uint256 createdAt;
        uint256 deadline;
        bool released;
        bool cancelled;
        bool disputed;
        MilestoneStatus status;
    }
    
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
    
    enum DisputeOutcome {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED
    }

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
    
    event BatchRelease(
        uint256 count,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event DisputeInitiated(
        bytes32 indexed milestoneId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        bytes32 indexed milestoneId,
        DisputeOutcome outcome,
        uint256 votesFor,
        uint256 votesAgainst
    );
    
    event FundsReclaimed(
        bytes32 indexed batchId,
        uint256 amount,
        uint256 timestamp
    );
    
    event EmergencyWithdrawal(
        address indexed recipient,
        uint256 amount,
        string reason
    );
    
    event CircuitBreakerActivated(
        string component,
        bool status,
        address activator
    );

    // ============ Modifiers ============
    
    modifier onlyAuthorizedDepositor() {
        require(depositsEnabled, "Deposits disabled");
        require(totalDeposited < maxTotalDeposits, "Max capacity reached");
        _;
    }
    
    modifier rateLimited() {
        require(
            block.timestamp >= lastDepositTime[msg.sender] + MIN_DEPOSIT_INTERVAL,
            "Rate limit: too frequent"
        );
        lastDepositTime[msg.sender] = block.timestamp;
        _;
    }
    
    modifier batchExists(bytes32 batchId) {
        require(batches[batchId].depositTime > 0, "Batch does not exist");
        _;
    }
    
    modifier milestoneExists(bytes32 milestoneId) {
        require(milestones[milestoneId].createdAt > 0, "Milestone does not exist");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address _masterController,
        address _cgcToken
    ) {
        require(_masterController != address(0), "Invalid master controller");
        require(_cgcToken != address(0), "Invalid token address");
        
        masterController = IMasterController(_masterController);
        cgcToken = IERC20(_cgcToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // ============ Deposit Functions ============
    
    /**
     * @notice Deposit tokens with specific EIP-712 rules
     * @param amount Amount to deposit (must be >= MIN_DEPOSIT_AMOUNT)
     * @param eip712Contract EIP-712 contract that will control this batch
     * @param masterSignature Signature from master controller
     * @return batchId Unique identifier for this batch
     */
    function depositWithRules(
        uint256 amount,
        address eip712Contract,
        bytes calldata masterSignature
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedDepositor 
        rateLimited 
        returns (bytes32 batchId) 
    {
        require(amount >= MIN_DEPOSIT_AMOUNT, "Below minimum deposit");
        require(eip712Contract != address(0), "Invalid EIP-712 contract");
        
        // Validate with master controller
        require(
            masterController.validateBatchCreation(
                address(this),
                eip712Contract,
                amount,
                block.timestamp + 1 hours,
                masterSignature
            ),
            "Master controller validation failed"
        );
        
        // Generate unique batch ID
        batchId = keccak256(abi.encodePacked(
            msg.sender,
            eip712Contract,
            amount,
            block.timestamp,
            block.number,
            totalBatches++
        ));
        
        // Create batch - IMMUTABLY tied to EIP-712
        batches[batchId] = Batch({
            batchId: batchId,
            depositor: msg.sender,
            eip712Contract: eip712Contract,
            originalAmount: amount,
            remainingAmount: amount,
            depositTime: block.timestamp,
            lastActivity: block.timestamp,
            isLocked: true,  // Immutably locked to EIP-712
            isExpired: false
        });
        
        // Update mappings
        depositorBatches[msg.sender].push(batchId);
        eip712Batches[eip712Contract].push(batchId);
        
        // Update statistics
        totalDeposited += amount;
        totalLocked += amount;
        
        // Transfer tokens to escrow
        cgcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit BatchDeposited(batchId, msg.sender, eip712Contract, amount, block.timestamp);
        
        return batchId;
    }

    // ============ Milestone Functions ============
    
    /**
     * @notice Create a milestone funded by a batch
     * @param batchId Batch to fund from
     * @param taskId Task identifier from EIP-712
     * @param collaborator Address that will complete the task
     * @param amount Reward amount (NO LIMITS)
     * @param deadline Task deadline
     */
    function createMilestone(
        bytes32 batchId,
        bytes32 taskId,
        address collaborator,
        uint256 amount,
        uint256 deadline
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        batchExists(batchId) 
        returns (bytes32 milestoneId) 
    {
        Batch storage batch = batches[batchId];
        
        require(msg.sender == batch.depositor || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(batch.remainingAmount >= amount, "Insufficient batch funds");
        require(amount > 0, "Amount must be > 0");
        require(collaborator != address(0), "Invalid collaborator");
        require(deadline > block.timestamp, "Invalid deadline");
        require(!batch.isExpired, "Batch expired");
        
        // Generate milestone ID
        milestoneId = keccak256(abi.encodePacked(
            batchId,
            taskId,
            collaborator,
            amount,
            deadline,
            totalMilestones++
        ));
        
        // Create milestone
        milestones[milestoneId] = Milestone({
            milestoneId: milestoneId,
            batchId: batchId,
            taskId: taskId,
            collaborator: collaborator,
            amount: amount,
            createdAt: block.timestamp,
            deadline: deadline,
            released: false,
            cancelled: false,
            disputed: false,
            status: MilestoneStatus.PENDING
        });
        
        // Update batch
        batch.remainingAmount -= amount;
        batch.lastActivity = block.timestamp;
        
        // Update mappings
        collaboratorMilestones[collaborator].push(milestoneId);
        batchMilestones[batchId].push(milestoneId);
        
        emit MilestoneCreated(milestoneId, batchId, collaborator, amount, deadline);
        
        return milestoneId;
    }
    
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
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        milestoneExists(milestoneId) 
    {
        require(releasesEnabled, "Releases disabled");
        
        Milestone storage milestone = milestones[milestoneId];
        require(!milestone.released, "Already released");
        require(!milestone.cancelled, "Milestone cancelled");
        require(!milestone.disputed, "Milestone disputed");
        require(milestone.taskId == taskId, "Task mismatch");
        require(block.timestamp <= milestone.deadline + GRACE_PERIOD, "Expired");
        
        Batch storage batch = batches[milestone.batchId];
        
        // Validate with the batch's EIP-712 contract
        ITaskRules rules = ITaskRules(batch.eip712Contract);
        require(
            rules.validateRelease(
                taskId,
                milestone.collaborator,
                milestone.amount,
                eip712Signature
            ),
            "EIP-712 validation failed"
        );
        
        // Mark as released
        milestone.released = true;
        milestone.status = MilestoneStatus.RELEASED;
        batch.lastActivity = block.timestamp;
        
        // Update statistics
        totalLocked -= milestone.amount;
        totalReleased += milestone.amount;
        
        // Add to pending withdrawals (pull pattern)
        pendingWithdrawals[milestone.collaborator] += milestone.amount;
        
        emit FundsReleased(
            milestoneId,
            milestone.collaborator,
            milestone.amount,
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        );
    }
    
    /**
     * @notice Batch release multiple milestones
     * @param milestoneIds Array of milestone IDs
     * @param taskIds Corresponding task IDs
     * @param signatures Corresponding signatures
     */
    function batchRelease(
        bytes32[] calldata milestoneIds,
        bytes32[] calldata taskIds,
        bytes[] calldata signatures
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(milestoneIds.length == taskIds.length, "Length mismatch");
        require(milestoneIds.length == signatures.length, "Length mismatch");
        require(milestoneIds.length <= MAX_BATCH_RELEASES, "Too many releases");
        
        uint256 totalAmount = 0;
        uint256 successCount = 0;
        
        for (uint i = 0; i < milestoneIds.length; i++) {
            // Try to release, skip if fails
            try this.releaseFunds(milestoneIds[i], taskIds[i], signatures[i]) {
                totalAmount += milestones[milestoneIds[i]].amount;
                successCount++;
            } catch {
                // Skip failed releases
                continue;
            }
        }
        
        emit BatchRelease(successCount, totalAmount, block.timestamp);
    }
    
    /**
     * @notice Withdraw accumulated funds
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        cgcToken.safeTransfer(msg.sender, amount);
    }

    // ============ Dispute Functions ============
    
    /**
     * @notice Initiate a dispute for a milestone
     * @param milestoneId Milestone to dispute
     * @param reason Reason for dispute
     * @param evidence Evidence data
     */
    function initiateDispute(
        bytes32 milestoneId,
        string calldata reason,
        bytes calldata evidence
    ) 
        external 
        milestoneExists(milestoneId) 
    {
        Milestone storage milestone = milestones[milestoneId];
        
        require(
            msg.sender == milestone.collaborator ||
            msg.sender == batches[milestone.batchId].depositor ||
            hasRole(RESOLVER_ROLE, msg.sender),
            "Not authorized to dispute"
        );
        require(!milestone.released, "Already released");
        require(!milestone.disputed, "Already disputed");
        
        milestone.disputed = true;
        milestone.status = MilestoneStatus.DISPUTED;
        
        disputes[milestoneId] = Dispute({
            milestoneId: milestoneId,
            initiator: msg.sender,
            reason: reason,
            evidence: evidence,
            initiatedAt: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            resolved: false,
            outcome: DisputeOutcome.PENDING
        });
        
        totalDisputed++;
        
        emit DisputeInitiated(milestoneId, msg.sender, reason);
    }
    
    /**
     * @notice Vote on a dispute
     * @param milestoneId Disputed milestone
     * @param voteFor True to vote for release, false against
     */
    function voteOnDispute(bytes32 milestoneId, bool voteFor) 
        external 
        onlyRole(RESOLVER_ROLE) 
    {
        Dispute storage dispute = disputes[milestoneId];
        require(!dispute.resolved, "Already resolved");
        require(!hasVoted[milestoneId][msg.sender], "Already voted");
        
        hasVoted[milestoneId][msg.sender] = true;
        
        if (voteFor) {
            dispute.votesFor++;
        } else {
            dispute.votesAgainst++;
        }
        
        // Auto-resolve if clear majority (e.g., 3 votes difference)
        if (dispute.votesFor >= dispute.votesAgainst + 3) {
            resolveDispute(milestoneId, DisputeOutcome.APPROVED);
        } else if (dispute.votesAgainst >= dispute.votesFor + 3) {
            resolveDispute(milestoneId, DisputeOutcome.REJECTED);
        }
    }
    
    /**
     * @notice Resolve a dispute
     * @param milestoneId Disputed milestone
     * @param outcome Resolution outcome
     */
    function resolveDispute(bytes32 milestoneId, DisputeOutcome outcome) 
        internal 
    {
        Dispute storage dispute = disputes[milestoneId];
        Milestone storage milestone = milestones[milestoneId];
        
        dispute.resolved = true;
        dispute.outcome = outcome;
        
        if (outcome == DisputeOutcome.APPROVED) {
            // Release funds
            milestone.disputed = false;
            milestone.released = true;
            milestone.status = MilestoneStatus.RELEASED;
            
            totalLocked -= milestone.amount;
            totalReleased += milestone.amount;
            pendingWithdrawals[milestone.collaborator] += milestone.amount;
        } else if (outcome == DisputeOutcome.REJECTED) {
            // Return funds to batch
            milestone.disputed = false;
            milestone.cancelled = true;
            milestone.status = MilestoneStatus.CANCELLED;
            
            Batch storage batch = batches[milestone.batchId];
            batch.remainingAmount += milestone.amount;
        }
        
        emit DisputeResolved(milestoneId, outcome, dispute.votesFor, dispute.votesAgainst);
    }

    // ============ Recovery Functions ============
    
    /**
     * @notice Reclaim expired milestone funds
     * @param milestoneId Expired milestone
     */
    function reclaimExpiredMilestone(bytes32 milestoneId) 
        external 
        nonReentrant 
        milestoneExists(milestoneId) 
    {
        Milestone storage milestone = milestones[milestoneId];
        Batch storage batch = batches[milestone.batchId];
        
        require(
            msg.sender == batch.depositor || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        require(!milestone.released, "Already released");
        require(!milestone.disputed, "Currently disputed");
        require(
            block.timestamp > milestone.deadline + GRACE_PERIOD,
            "Not expired yet"
        );
        
        milestone.cancelled = true;
        milestone.status = MilestoneStatus.EXPIRED;
        
        // Return funds to batch
        batch.remainingAmount += milestone.amount;
        batch.lastActivity = block.timestamp;
        
        emit FundsReclaimed(milestone.batchId, milestone.amount, block.timestamp);
    }

    // ============ Emergency Functions ============
    
    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit CircuitBreakerActivated("pause", true, msg.sender);
    }
    
    /**
     * @notice Emergency unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit CircuitBreakerActivated("pause", false, msg.sender);
    }
    
    /**
     * @notice Toggle deposits
     */
    function toggleDeposits(bool enabled) external onlyRole(EMERGENCY_ROLE) {
        depositsEnabled = enabled;
        emit CircuitBreakerActivated("deposits", enabled, msg.sender);
    }
    
    /**
     * @notice Toggle releases
     */
    function toggleReleases(bool enabled) external onlyRole(EMERGENCY_ROLE) {
        releasesEnabled = enabled;
        emit CircuitBreakerActivated("releases", enabled, msg.sender);
    }
    
    /**
     * @notice Emergency withdrawal (only when paused)
     * @param recipient Address to receive funds
     * @param amount Amount to withdraw
     * @param reason Reason for emergency withdrawal
     */
    function emergencyWithdraw(
        address recipient,
        uint256 amount,
        string calldata reason
    ) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        whenPaused 
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= cgcToken.balanceOf(address(this)), "Insufficient balance");
        
        cgcToken.safeTransfer(recipient, amount);
        
        emit EmergencyWithdrawal(recipient, amount, reason);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get batch details
     */
    function getBatch(bytes32 batchId) external view returns (Batch memory) {
        return batches[batchId];
    }
    
    /**
     * @notice Get milestone details
     */
    function getMilestone(bytes32 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }
    
    /**
     * @notice Get dispute details
     */
    function getDispute(bytes32 milestoneId) external view returns (Dispute memory) {
        return disputes[milestoneId];
    }
    
    /**
     * @notice Get depositor's batches
     */
    function getDepositorBatches(address depositor) external view returns (bytes32[] memory) {
        return depositorBatches[depositor];
    }
    
    /**
     * @notice Get collaborator's milestones
     */
    function getCollaboratorMilestones(address collaborator) external view returns (bytes32[] memory) {
        return collaboratorMilestones[collaborator];
    }
    
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
    ) {
        return (totalDeposited, totalLocked, totalReleased, totalDisputed, totalBatches, totalMilestones);
    }
}