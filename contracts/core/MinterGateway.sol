// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICGCToken {
    function mint(address to, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title MinterGateway v3.3 FINAL
 * @author CryptoGift DAO Team
 * @notice Enforces hard cap on CGC token minting FROM THIS GATEWAY ONLY
 *
 * VERIFIED FACTS:
 * - CGC has 18 decimals (CGCToken.sol line 288)
 * - MilestoneEscrow never calls mint() (uses transfer)
 * - This contract reads actual totalSupply() at deployment
 *
 * OWNERSHIP MODEL:
 * - Gateway owner: Multisig 3/5 (fast response for unpause/callers)
 * - Token owner: Timelock 7 days (protects against new minters)
 * - Guardian: Multisig 2/3 for mainnet (EOA only for testnet)
 *
 * CRITICAL LIMITATION:
 * - This Gateway can only limit ITSELF, not other minters
 * - CGCToken has NO native cap - another minter could exceed 22M
 * - See security matrix for full details
 *
 * OPENZEPPELIN VERSION: v5.x ONLY (project uses 5.0.1)
 * - Imports use v5.x paths (Pausable in utils folder)
 * - Ownable constructor pattern: Ownable(_owner)
 * - NOT compatible with v4.x without import path changes
 */
contract MinterGateway is Ownable, Pausable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Maximum total supply that can ever exist (22 million with 18 decimals)
    /// @dev CGC decimals verified: 18 (CGCToken.sol line 288)
    uint256 public constant MAX_TOTAL_SUPPLY = 22_000_000 * 10**18;

    // ═══════════════════════════════════════════════════════════════════════
    // IMMUTABLE VALUES (set in constructor, never change)
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice The CGC token contract
    ICGCToken public immutable cgcToken;

    /// @notice Supply at the moment this gateway was deployed
    /// @dev Read from cgcToken.totalSupply() - NOT hardcoded
    uint256 public immutable initialSupplyAtDeployment;

    /// @notice Maximum tokens that can be minted through this gateway
    /// @dev Calculated as: MAX_TOTAL_SUPPLY - initialSupplyAtDeployment
    uint256 public immutable maxMintableViaGateway;

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Running total of tokens minted via this gateway
    uint256 public totalMintedViaGateway;

    /// @notice Addresses authorized to request minting
    mapping(address => bool) public authorizedCallers;

    /// @notice Count of authorized callers
    uint256 public authorizedCallerCount;

    /// @notice Guardian can pause but NOT unpause (prevents DoS)
    address public guardian;

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event GatewayDeployed(
        address indexed cgcToken,
        uint256 initialSupply,
        uint256 maxMintable,
        address indexed owner,
        address indexed guardian
    );
    event TokensMinted(
        address indexed to,
        uint256 amount,
        uint256 totalMintedSoFar,
        uint256 remainingMintable,
        address indexed requestedBy
    );
    event AuthorizedCallerAdded(address indexed caller);
    event AuthorizedCallerRemoved(address indexed caller);
    event GuardianChanged(address indexed oldGuardian, address indexed newGuardian);
    event EmergencyPaused(address indexed by, string reason);
    event EmergencyUnpaused(address indexed by);

    // ═══════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error NotAuthorized();
    error WouldExceedMaxSupply(uint256 requested, uint256 remaining);
    error InvalidAddress();
    error InvalidAmount();
    error AlreadyAuthorized();
    error NotAuthorizedCaller();
    error InitialSupplyExceedsMax();
    error DecimalsMismatch();

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param _cgcToken Address of CGC token (0x5e3a61b550328f3D8C44f60b3e10a49D3d806175)
     * @param _owner Multisig 3/5 address (for fast unpause and caller management)
     * @param _guardian Multisig 2/3 for mainnet (EOA only for testnet) - can pause but NOT unpause
     */
    constructor(
        address _cgcToken,
        address _owner,
        address _guardian
    ) Ownable(_owner) {
        if (_cgcToken == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        if (_guardian == address(0)) revert InvalidAddress();

        cgcToken = ICGCToken(_cgcToken);
        guardian = _guardian;

        // Verify decimals match our assumption
        if (cgcToken.decimals() != 18) revert DecimalsMismatch();

        // Read ACTUAL supply at deployment (not hardcoded)
        initialSupplyAtDeployment = cgcToken.totalSupply();

        // Verify we haven't already exceeded max
        if (initialSupplyAtDeployment >= MAX_TOTAL_SUPPLY) {
            revert InitialSupplyExceedsMax();
        }

        // Calculate how much can be minted via this gateway
        maxMintableViaGateway = MAX_TOTAL_SUPPLY - initialSupplyAtDeployment;

        emit GatewayDeployed(
            _cgcToken,
            initialSupplyAtDeployment,
            maxMintableViaGateway,
            _owner,
            _guardian
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORE MINTING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Mint tokens with GLOBAL cap enforcement
     * @param to Recipient address
     * @param amount Amount to mint (in wei, 18 decimals)
     *
     * @dev CRITICAL: Validates against ACTUAL totalSupply(), not just internal counter.
     *      This protects against >22M even if another minter is added via Timelock.
     */
    function mint(address to, uint256 amount)
        external
        whenNotPaused
        nonReentrant
    {
        if (!authorizedCallers[msg.sender]) revert NotAuthorized();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        // ══════════════════════════════════════════════════════════════════
        // CRITICAL FIX v3.1: Check against ACTUAL totalSupply() (global cap)
        // ══════════════════════════════════════════════════════════════════
        // This ensures we NEVER exceed 22M even if:
        // - Another minter was added via Timelock and minted tokens
        // - Someone found a way to mint outside Gateway
        // The Gateway becomes a "safety belt" for the entire system.

        uint256 currentActualSupply = cgcToken.totalSupply();
        if (currentActualSupply >= MAX_TOTAL_SUPPLY) {
            revert WouldExceedMaxSupply(amount, 0);
        }

        uint256 globalRemaining = MAX_TOTAL_SUPPLY - currentActualSupply;
        if (amount > globalRemaining) {
            revert WouldExceedMaxSupply(amount, globalRemaining);
        }

        // CEI pattern: update state before external call
        totalMintedViaGateway += amount;

        cgcToken.mint(to, amount);

        emit TokensMinted(
            to,
            amount,
            totalMintedViaGateway,
            getGlobalRemaining(),  // Now shows GLOBAL remaining
            msg.sender
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice GLOBAL remaining - based on ACTUAL totalSupply() of token
     * @dev This is the TRUE remaining that can be minted system-wide
     *      Accounts for any minting that happened outside Gateway
     */
    function getGlobalRemaining() public view returns (uint256) {
        uint256 actualSupply = cgcToken.totalSupply();
        if (actualSupply >= MAX_TOTAL_SUPPLY) return 0;
        return MAX_TOTAL_SUPPLY - actualSupply;
    }

    /**
     * @notice Gateway-internal remaining (for bookkeeping only)
     * @dev This is just the Gateway's internal counter
     *      Use getGlobalRemaining() for actual mintable amount
     *
     * @dev CRITICAL FIX v3.2: Clamp to prevent underflow if burn occurs
     *      SCENARIO: If tokens are burned and Gateway re-mints (allowed by globalRemaining),
     *      totalMintedViaGateway can exceed maxMintableViaGateway → underflow!
     *      FIX: Return 0 instead of reverting
     */
    function getGatewayRemaining() public view returns (uint256) {
        // Clamp to prevent underflow in burn scenarios
        if (totalMintedViaGateway >= maxMintableViaGateway) return 0;
        return maxMintableViaGateway - totalMintedViaGateway;
    }

    /**
     * @notice Current ACTUAL total supply from token contract
     * @dev Reads directly from CGCToken - the source of truth
     */
    function getActualTotalSupply() public view returns (uint256) {
        return cgcToken.totalSupply();
    }

    /**
     * @notice Check if a mint would succeed
     * @dev Uses GLOBAL remaining, not internal counter
     */
    function canMint(uint256 amount) external view returns (bool possible, uint256 remaining) {
        remaining = getGlobalRemaining();  // GLOBAL check
        possible = amount <= remaining && !paused();
    }

    /**
     * @notice Get all supply information
     */
    function getSupplyInfo() external view returns (
        uint256 maxSupply,
        uint256 actualTotalSupply,
        uint256 mintedViaGateway,
        uint256 globalRemaining,
        uint256 gatewayRemaining,
        uint256 percentageMinted
    ) {
        maxSupply = MAX_TOTAL_SUPPLY;
        actualTotalSupply = cgcToken.totalSupply();       // ACTUAL from token
        mintedViaGateway = totalMintedViaGateway;         // Gateway internal counter
        globalRemaining = getGlobalRemaining();           // TRUE remaining
        gatewayRemaining = getGatewayRemaining();         // Internal counter remaining
        percentageMinted = (actualTotalSupply * 10000) / MAX_TOTAL_SUPPLY;
    }

    /**
     * @notice Detect if someone minted outside Gateway (supply drift)
     * @dev If this returns true, it means tokens were minted bypassing Gateway
     */
    function hasSupplyDrift() external view returns (bool driftDetected, uint256 driftAmount) {
        uint256 expectedSupply = initialSupplyAtDeployment + totalMintedViaGateway;
        uint256 actualSupply = cgcToken.totalSupply();

        if (actualSupply > expectedSupply) {
            driftDetected = true;
            driftAmount = actualSupply - expectedSupply;
        } else {
            driftDetected = false;
            driftAmount = 0;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTHORIZED CALLER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function addAuthorizedCaller(address caller) external onlyOwner {
        if (caller == address(0)) revert InvalidAddress();
        if (authorizedCallers[caller]) revert AlreadyAuthorized();
        authorizedCallers[caller] = true;
        authorizedCallerCount++;
        emit AuthorizedCallerAdded(caller);
    }

    function removeAuthorizedCaller(address caller) external onlyOwner {
        if (!authorizedCallers[caller]) revert NotAuthorizedCaller();
        authorizedCallers[caller] = false;
        authorizedCallerCount--;
        emit AuthorizedCallerRemoved(caller);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EMERGENCY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Pause minting (guardian OR owner)
     * @dev Guardian can pause for quick response
     */
    function emergencyPause(string calldata reason) external {
        require(msg.sender == guardian || msg.sender == owner(), "Not authorized");
        _pause();
        emit EmergencyPaused(msg.sender, reason);
    }

    /**
     * @notice Unpause minting (ONLY owner/multisig)
     * @dev Guardian cannot unpause - prevents DoS attack
     *      Owner is Multisig, so unpause is fast (no 7-day delay)
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    function setGuardian(address newGuardian) external onlyOwner {
        if (newGuardian == address(0)) revert InvalidAddress();
        address old = guardian;
        guardian = newGuardian;
        emit GuardianChanged(old, newGuardian);
    }
}
