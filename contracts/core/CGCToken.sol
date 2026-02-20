// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CGCToken (CryptoGift Coin)
 * @author CryptoGift DAO Team
 * @notice Governance token for the CryptoGift Wallets DAO
 * @dev Enhanced ERC20 token with voting capabilities for Aragon DAO
 * 
 * Features:
 * - Fixed supply of 2,000,000 tokens
 * - 18 decimals standard
 * - EIP-2612 permit for gasless approvals
 * - ERC20Votes for on-chain governance
 * - Logo URI for dApps display
 * - Pausable for emergency situations
 * - Batch operations for efficiency
 * - Full Aragon TokenVoting plugin compatibility
 */
contract CGCToken is ERC20, ERC20Permit, ERC20Votes, Ownable, Pausable {
    // ============ Constants ============
    
    /// @notice Total supply of CGC tokens (2 million with 18 decimals)
    uint256 public constant TOTAL_SUPPLY = 2_000_000 * 10**18;
    
    /// @notice Token logo URI for dApps
    string public constant logoURI = "https://raw.githubusercontent.com/cryptogift-dao/cryptogift-wallets-DAO/main/frontend/public/CGC-logo.png";
    
    /// @notice Contract version
    string public constant version = "2.0.0";
    
    // ============ State Variables ============
    
    /// @notice Timestamp when the token was deployed
    uint256 public immutable deploymentTimestamp;
    
    /// @notice Address of the DAO that receives initial supply
    address public immutable dao;
    
    /// @notice Addresses that can mint additional tokens (initially none)
    mapping(address => bool) public minters;
    
    /// @notice Total number of holders
    uint256 public totalHolders;
    
    /// @notice Track addresses that hold tokens
    mapping(address => bool) public isHolder;
    
    // ============ Events ============
    
    event TokenDeployed(
        address indexed dao,
        uint256 totalSupply,
        uint256 timestamp
    );
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    event HolderAdded(address indexed holder, uint256 balance);
    event HolderRemoved(address indexed holder);
    
    event BatchTransfer(
        address indexed from,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount
    );

    // ============ Constructor ============
    
    /**
     * @notice Deploys the CGC token and mints total supply to DAO
     * @param _dao Address of the Aragon DAO that will receive all tokens
     * @param _initialOwner Address that will own the contract initially
     * @dev The DAO address should be the Aragon DAO contract, not an EOA
     */
    constructor(
        address _dao,
        address _initialOwner
    ) 
        ERC20("CryptoGift Coin", "CGC")
        ERC20Permit("CryptoGift Coin")
        Ownable(_initialOwner)
    {
        require(_dao != address(0), "CGCToken: DAO address cannot be zero");
        require(_initialOwner != address(0), "CGCToken: Initial owner cannot be zero");
        
        dao = _dao;
        deploymentTimestamp = block.timestamp;
        
        // Mint entire supply to the DAO treasury
        _mint(_dao, TOTAL_SUPPLY);
        
        // Add DAO as holder
        isHolder[_dao] = true;
        totalHolders = 1;
        
        emit TokenDeployed(_dao, TOTAL_SUPPLY, block.timestamp);
        emit HolderAdded(_dao, TOTAL_SUPPLY);
    }

    // ============ Minting Functions ============
    
    /**
     * @notice Add a new minter
     * @param minter Address to give minting privileges
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!minters[minter], "Already a minter");
        
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @notice Remove a minter
     * @param minter Address to remove minting privileges from
     */
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "Not a minter");
        
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @notice Mint new tokens (only by authorized minters)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (NO LIMITS)
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Not authorized to mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be > 0");
        
        _mint(to, amount);
        _updateHolderStatus(to);
    }

    // ============ Batch Operations ============
    
    /**
     * @notice Batch transfer to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty arrays");
        require(recipients.length <= 200, "Too many recipients"); // Gas limit protection
        
        uint256 totalAmount = 0;
        
        // Calculate total and validate
        for (uint i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            totalAmount += amounts[i];
        }
        
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // Execute transfers
        for (uint i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
            _updateHolderStatus(recipients[i]);
        }
        
        _updateHolderStatus(msg.sender);
        
        emit BatchTransfer(msg.sender, recipients, amounts, totalAmount);
    }
    
    /**
     * @notice Batch transfer from multiple sources (requires approvals)
     * @param senders Array of sender addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer
     */
    function batchTransferFrom(
        address[] calldata senders,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused {
        require(
            senders.length == recipients.length && 
            recipients.length == amounts.length, 
            "Length mismatch"
        );
        require(senders.length > 0, "Empty arrays");
        require(senders.length <= 100, "Too many transfers"); // Gas limit protection
        
        for (uint i = 0; i < senders.length; i++) {
            require(senders[i] != address(0), "Invalid sender");
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            
            _spendAllowance(senders[i], msg.sender, amounts[i]);
            _transfer(senders[i], recipients[i], amounts[i]);
            
            _updateHolderStatus(senders[i]);
            _updateHolderStatus(recipients[i]);
        }
    }

    // ============ Holder Management ============
    
    /**
     * @notice Update holder status after balance changes
     * @param account Account to check
     */
    function _updateHolderStatus(address account) internal {
        uint256 balance = balanceOf(account);
        
        if (balance > 0 && !isHolder[account]) {
            // New holder
            isHolder[account] = true;
            totalHolders++;
            emit HolderAdded(account, balance);
        } else if (balance == 0 && isHolder[account]) {
            // Removed holder
            isHolder[account] = false;
            totalHolders--;
            emit HolderRemoved(account);
        }
    }

    // ============ Emergency Functions ============
    
    /**
     * @notice Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Override Functions ============
    
    /**
     * @notice Override transfer to update holder status
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) whenNotPaused {
        super._update(from, to, value);
        
        if (from != address(0)) _updateHolderStatus(from);
        if (to != address(0)) _updateHolderStatus(to);
    }
    
    /**
     * @notice Override nonces for permit functionality
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
    
    /**
     * @notice Returns the number of decimals used by the token
     * @return decimals The number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ============ View Functions ============
    
    /**
     * @notice Returns token metadata for external integrations
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Token decimals
     * @return tokenTotalSupply Total token supply
     * @return tokenVersion Contract version
     */
    function getTokenInfo() 
        external 
        view 
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            uint8 tokenDecimals,
            uint256 tokenTotalSupply,
            string memory tokenVersion
        ) 
    {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            version
        );
    }
    
    /**
     * @notice Check if an address has any voting power
     * @param account Address to check
     * @return hasVotingPower True if the address can vote
     */
    function hasVotingPower(address account) external view returns (bool) {
        return getVotes(account) > 0;
    }
    
    /**
     * @notice Returns the voting power of an account at current block
     * @param account Address to check
     * @return votingPower Current voting power
     */
    function getCurrentVotes(address account) external view returns (uint256) {
        return getVotes(account);
    }
    
    /**
     * @notice Returns the percentage of total supply held by an address
     * @param account Address to check
     * @return percentage Percentage with 4 decimal precision (1000000 = 100%)
     */
    function getSupplyPercentage(address account) external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 0;
        return (balanceOf(account) * 1000000) / supply;
    }
    
    /**
     * @notice Get holder statistics
     * @return total Total number of holders
     * @return daoAddress DAO address
     * @return daoBalance DAO's current balance
     * @return daoPercentage DAO's percentage of total supply
     */
    function getHolderStats() external view returns (
        uint256 total,
        address daoAddress,
        uint256 daoBalance,
        uint256 daoPercentage
    ) {
        uint256 daoTokens = balanceOf(dao);
        return (
            totalHolders,
            daoAddress,
            daoTokens,
            totalSupply() > 0 ? (daoTokens * 1000000) / totalSupply() : 0
        );
    }
    
    /**
     * @notice Check if address is a minter
     * @param account Address to check
     * @return bool Whether the address can mint
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
}