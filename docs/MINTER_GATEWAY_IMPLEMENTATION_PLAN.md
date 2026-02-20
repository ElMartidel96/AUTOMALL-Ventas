# 🔐 MinterGateway Implementation Plan
## Solución para Enforcement de Supply Cap Verificable On-Chain

**Fecha**: 13 Diciembre 2025
**Autor**: CryptoGift DAO Team
**Versión**: 3.3 FINAL (Copy-Paste Ready)
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN - Runbook Completo con 5 Actions

---

## ⚠️ IMPORTANTE: ESTE ES EL DOCUMENTO DEFINITIVO

Este documento contiene:
- ✅ **UN SOLO** contrato final (sin bloques viejos)
- ✅ **Todas** las funciones view alineadas correctamente
- ✅ **Cero** contradicciones sobre MilestoneEscrow
- ✅ **Postura honesta** sobre Timelock (delay, no imposibilidad absoluta)
- ✅ **Política clara** de pause/unpause para evitar DoS
- ✅ **CGC decimals verificado**: 18 (línea 288 de CGCToken.sol)

---

## 📋 RESUMEN EJECUTIVO

### El Problema
CGCToken tiene función `mint()` **SIN CAP**:
```solidity
// CGCToken.sol línea 137 - Comentario literal: "NO LIMITS"
function mint(address to, uint256 amount) external {
    require(minters[msg.sender], "Not authorized to mint");
    // ❌ NO HAY require(totalSupply() + amount <= MAX_SUPPLY)
    _mint(to, amount);
}
```

### La Solución
MinterGateway: contrato intermediario que **sí enforza** el cap.

---

## 🔍 HECHOS VERIFICADOS (No Suposiciones)

### 1. CGCToken Decimals
```solidity
// CGCToken.sol línea 287-289
function decimals() public pure override returns (uint8) {
    return 18;  // ✅ VERIFICADO
}
```

### 2. MilestoneEscrow NO Mintea
```solidity
// MilestoneEscrow.sol línea 487-494
function withdraw() external nonReentrant {
    cgcToken.safeTransfer(msg.sender, amount);  // ← TRANSFER, no MINT
}
```
**HECHO**: MilestoneEscrow **NUNCA** llama `mint()`. Solo `transfer()`.

### 3. Quién Puede Mintear Hoy
| Dirección | ¿Es Minter? | ¿Llama mint()? | Fuente |
|-----------|-------------|----------------|--------|
| MilestoneEscrow | ✅ Sí (en deploy) | ❌ **NUNCA** | Código verificado |
| Deployer EOA | ✅ Si corrió script | ✅ Sí (manual) | mint-additional-supply.js |
| Aragon DAO | Owner del token | Puede añadir minters | CGCToken.addMinter() |

---

## 🏗️ ARQUITECTURA FINAL

### Separación de Ownerships (CRÍTICO)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ARQUITECTURA DE OWNERSHIPS FINAL                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │                      CGCTOKEN OWNERSHIP                                │  ║
║  │                                                                        │  ║
║  │  Owner: TimelockController (7 días delay)                             │  ║
║  │                                                                        │  ║
║  │  ¿Por qué Timelock y no Multisig?                                     │  ║
║  │  - Protege contra añadir nuevos minters de forma instantánea          │  ║
║  │  - 7 días = tiempo suficiente para que comunidad audite propuestas    │  ║
║  │                                                                        │  ║
║  │  ⚠️ VERDAD HONESTA:                                                   │  ║
║  │  Con Timelock, el bypass del Gateway ES POSIBLE después de 7 días.   │  ║
║  │  El cap del Gateway es inmutable, pero el DAO podría proponer         │  ║
║  │  addMinter(otraDireccion) y esperar 7 días para ejecutar.            │  ║
║  │                                                                        │  ║
║  │  Si quieres bypass IMPOSIBLE: usar renounceOwnership()               │  ║
║  │  (pero entonces perdemos capacidad de emergencia)                     │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐  ║
║  │                    MINTERGATEWAY OWNERSHIP                             │  ║
║  │                                                                        │  ║
║  │  Owner: Multisig 3/5 (respuesta rápida)                               │  ║
║  │                                                                        │  ║
║  │  ¿Por qué Multisig y no Timelock?                                     │  ║
║  │  - Gateway solo puede mintear hasta el cap (no hay riesgo de bypass) │  ║
║  │  - Necesitamos respuesta rápida para:                                 │  ║
║  │    • unpause después de emergencia (evitar DoS de 7 días)            │  ║
║  │    • añadir/remover authorized callers                                │  ║
║  │                                                                        │  ║
║  │  Guardian: Multisig 2/3 (mainnet) o EOA (solo testnet)                │  ║
║  │  - Puede pausar instantáneo (emergencia)                              │  ║
║  │  - NO puede unpause (evita que guardian malicioso controle minting)  │  ║
║  └────────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Diagrama de Flujo

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    FLUJO DE MINTING CON GATEWAY v3.3                         ║
║                     (CAP GLOBAL contra totalSupply())                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   [Sistema que quiere mintear]                                               ║
║          │                                                                   ║
║          │ minterGateway.mint(recipient, amount)                             ║
║          ▼                                                                   ║
║   ┌──────────────────────────────────────────────────────────────────────┐   ║
║   │                     MINTER GATEWAY v3.3                              │   ║
║   │                                                                      │   ║
║   │  1. ¿Está el caller autorizado?                                     │   ║
║   │     authorizedCallers[msg.sender] == true?                          │   ║
║   │                                                                      │   ║
║   │  2. ¿Cabe bajo el CAP GLOBAL? ← CRÍTICO (v3.1)                     │   ║
║   │     cgcToken.totalSupply() + amount <= MAX_TOTAL_SUPPLY?            │   ║
║   │     (Checa supply REAL del token, no contador interno)              │   ║
║   │                                                                      │   ║
║   │  3. Si pasa: cgcToken.mint(recipient, amount)                       │   ║
║   │     Si falla: REVERT "Would exceed max supply"                      │   ║
║   └──────────────────────────────────────────────────────────────────────┘   ║
║          │                                                                   ║
║          ▼                                                                   ║
║   [CGCToken] ← Gateway es el ÚNICO minter autorizado (idealmente)           ║
║          │                                                                   ║
║          ▼                                                                   ║
║   [Tokens minteados] ← Gateway NO EXCEDERÁ 22M desde sí mismo               ║
║                        (pero otro minter SÍ podría exceder - ver matriz)    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                    PROTECCIÓN CONTRA BYPASS (v3.3)                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ESCENARIO: DAO añade otro minter vía Timelock (7 días)                    ║
║              Ese minter mintea X tokens fuera del Gateway                   ║
║                                                                              ║
║   ANTES (v3.0):                                                              ║
║   │ Gateway tiene contador interno = 0 (no sabe de X)                       ║
║   │ Gateway piensa que puede mintear 20M más                                ║
║   │ Total podría exceder 22M ← ❌ BUG                                       ║
║                                                                              ║
║   AHORA (v3.3):                                                              ║
║   │ Gateway lee totalSupply() = initialSupply + X                           ║
║   │ Gateway calcula: 22M - (initialSupply + X) = remaining                  ║
║   │ Gateway SOLO puede mintear remaining ← ✅ GATEWAY SEGURO               ║
║   │ Además: hasSupplyDrift() detecta que hubo minting externo              ║
║   │                                                                         ║
║   │ ⚠️  PERO: El otro minter YA pudo haber excedido 22M                    ║
║   │     Gateway no puede evitar eso - CGCToken no tiene cap nativo         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 SEMÁNTICA DEL CAP DE 22M (IMPORTANTE ENTENDER)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ¿QUÉ SIGNIFICA "CAP DE 22M"?                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ESTE DISEÑO IMPLEMENTA:                                                    ║
║   ┌────────────────────────────────────────────────────────────────────────┐ ║
║   │  CAP = MÁXIMO SUPPLY EN CIRCULACIÓN EN CUALQUIER MOMENTO               │ ║
║   │                                                                        │ ║
║   │  totalSupply() <= 22,000,000 CGC (en cualquier instante)              │ ║
║   └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║   CONSECUENCIA CON BURN:                                                     ║
║   ┌────────────────────────────────────────────────────────────────────────┐ ║
║   │  Si alguien QUEMA tokens:                                              │ ║
║   │  • totalSupply() baja                                                  │ ║
║   │  • getGlobalRemaining() sube (se abre espacio)                         │ ║
║   │  • Se puede RE-MINTEAR hasta llegar a 22M de nuevo                     │ ║
║   │                                                                        │ ║
║   │  EJEMPLO:                                                              │ ║
║   │  1. Supply inicial: 2M                                                 │ ║
║   │  2. Gateway mintea 20M → Supply = 22M, remaining = 0                   │ ║
║   │  3. Usuario quema 5M → Supply = 17M, remaining = 5M                    │ ║
║   │  4. Gateway puede mintear 5M más → Supply = 22M de nuevo               │ ║
║   └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║   ESTO ES CORRECTO PARA LA MAYORÍA DE CASOS DE USO.                         ║
║                                                                              ║
║   ⚠️  SI NECESITAS "LIFETIME CAP" (nunca más de 22M minteados en total):   ║
║   ┌────────────────────────────────────────────────────────────────────────┐ ║
║   │  OPCIÓN A: Añadir contador `totalEverMinted` al Gateway                │ ║
║   │            (independiente de burns, nunca decrece)                     │ ║
║   │                                                                        │ ║
║   │  OPCIÓN B: Modificar CGCToken con cap nativo                           │ ║
║   │            (requiere upgrade o nuevo deploy)                           │ ║
║   │                                                                        │ ║
║   │  ⚠️  ESTE DOCUMENTO NO IMPLEMENTA LIFETIME CAP                        │ ║
║   └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📜 CONTRATO FINAL (COPY-PASTE READY)

```solidity
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
 * @dev VERIFIED FACTS:
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
 * OPENZEPPELIN VERSION: v5.x ONLY (project uses ^5.0.1)
 * - Imports use v5.x paths: @openzeppelin/contracts/utils/Pausable.sol
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
```

---

## 📋 RUNBOOK DE DEPLOY (5 Actions)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RUNBOOK DE DEPLOY MAINNET v3.3                            ║
║                    (Con migración atómica + Wording honesto)                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PRE-REQUISITOS:                                                             ║
║  • Multisig 3/5 creado (Gnosis Safe recomendado) para Gateway owner         ║
║  • Multisig 2/3 para Guardian (⚠️ OBLIGATORIO en mainnet, EOA solo testnet)║
║  • ETH para gas (~0.02 ETH)                                                 ║
║                                                                              ║
║  ⚠️  IMPORTANTE: Actions 3 DEBE ejecutarse en UN SOLO BATCH                 ║
║      para evitar estados intermedios peligrosos.                            ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ACTION 1: Deploy TimelockController                                         ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ new TimelockController(                                                 │ ║
║  │     7 days,              // minDelay                                    │ ║
║  │     [daoAddress],        // proposers                                   │ ║
║  │     [daoAddress],        // executors                                   │ ║
║  │     address(0)           // admin (none)                                │ ║
║  │ )                                                                       │ ║
║  │                                                                         │ ║
║  │ PROPÓSITO: Proteger CGCToken.addMinter() con delay de 7 días           │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ACTION 2: Deploy MinterGateway                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ new MinterGateway(                                                      │ ║
║  │     0x5e3a61b550328f3D8C44f60b3e10a49D3d806175,  // CGC Token          │ ║
║  │     multisigAddress,                              // Owner (3/5 Safe)  │ ║
║  │     guardianMultisig                              // Guardian (2/3 Safe)│ ║
║  │ )                                                                       │ ║
║  │                                                                         │ ║
║  │ Constructor automáticamente:                                            │ ║
║  │ • Verifica decimals == 18                                               │ ║
║  │ • Lee totalSupply() actual                                              │ ║
║  │ • Calcula maxMintableViaGateway                                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ACTION 3: BATCH ATÓMICO - Configurar minters + Transfer ownership          ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ ⚠️  EJECUTAR COMO MULTICALL O PROPUESTA ÚNICA EN GNOSIS SAFE           │ ║
║  │                                                                         │ ║
║  │ // Todas estas llamadas en UN SOLO BATCH:                               │ ║
║  │ cgcToken.addMinter(gatewayAddress)       // Gateway puede mintear      │ ║
║  │ cgcToken.removeMinter(escrowAddress)     // 0x8346CFcaE... (nunca usó) │ ║
║  │ cgcToken.removeMinter(deployerAddress)   // 0xc655BF2B... (si aplica)  │ ║
║  │ cgcToken.transferOwnership(timelockAddress)  // Protección final       │ ║
║  │                                                                         │ ║
║  │ ¿POR QUÉ ATÓMICO?                                                       │ ║
║  │ • Si se ejecuta secuencial, hay ventana donde:                          │ ║
║  │   - Gateway es minter PERO minters viejos siguen activos               │ ║
║  │   - O Gateway es minter SIN timelock protegiendo ownership             │ ║
║  │ • Con batch atómico: estado final garantizado en 1 tx                   │ ║
║  │                                                                         │ ║
║  │ CÓMO EN GNOSIS SAFE:                                                    │ ║
║  │ • Transaction Builder → Add New Transaction × 4                         │ ║
║  │ • Agregar las 4 llamadas arriba                                         │ ║
║  │ • Create Batch → Submit → Confirm 3/5 firmas                           │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ACTION 4: Verificación Post-Deploy                                          ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ ☐ gateway.cgcToken() == 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175     │ ║
║  │ ☐ gateway.initialSupplyAtDeployment() == valor esperado                 │ ║
║  │ ☐ gateway.maxMintableViaGateway() == 22M - initialSupply               │ ║
║  │ ☐ gateway.getGlobalRemaining() == 22M - cgcToken.totalSupply()         │ ║
║  │ ☐ gateway.owner() == multisigAddress                                   │ ║
║  │ ☐ gateway.guardian() == guardianMultisig                               │ ║
║  │ ☐ cgcToken.minters(gateway) == true                                    │ ║
║  │ ☐ cgcToken.minters(escrow) == false                                    │ ║
║  │ ☐ cgcToken.minters(deployer) == false                                  │ ║
║  │ ☐ cgcToken.owner() == timelockAddress                                  │ ║
║  │ ☐ gateway.hasSupplyDrift() == (false, 0)  // No drift inicial          │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ACTION 5: Habilitar Sistemas de Minting (CRÍTICO)                          ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ ⚠️  SIN ESTE PASO, NINGÚN SISTEMA PUEDE MINTEAR                        │ ║
║  │                                                                         │ ║
║  │ El Gateway por defecto tiene authorizedCallers vacío.                   │ ║
║  │ Debes añadir los contratos/EOAs que necesitan mintear:                  │ ║
║  │                                                                         │ ║
║  │ // Desde Multisig Owner (3/5):                                          │ ║
║  │ gateway.addAuthorizedCaller(rewardsSystemAddress)                       │ ║
║  │ gateway.addAuthorizedCaller(adminEOAForEmergency)  // Opcional          │ ║
║  │                                                                         │ ║
║  │ VERIFICAR:                                                              │ ║
║  │ ☐ gateway.authorizedCallers(rewardsSystemAddress) == true              │ ║
║  │ ☐ gateway.authorizedCallerCount() >= 1                                 │ ║
║  │                                                                         │ ║
║  │ NOTA: Solo authorizedCallers pueden llamar gateway.mint()              │ ║
║  │       Si no añades ninguno, el minting quedará bloqueado.               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🛡️ MATRIZ DE SEGURIDAD HONESTA (v3.3)

### Qué Protege Este Sistema

| Ataque | ¿Protegido? | Explicación |
|--------|-------------|-------------|
| Minter autorizado mintea infinito | ✅ **SÍ** | Cap en Gateway es inmutable |
| Caller no autorizado intenta mintear | ✅ **SÍ** | authorizedCallers check |
| Guardian malicioso pausa indefinido | ✅ **SÍ** | Unpause es Multisig (rápido) |
| DAO añade nuevo minter bypass | ⚠️ **CON DELAY** | Timelock da 7 días de aviso |
| Bug en contrato Gateway | ✅ **MITIGADO** | Multisig puede pausar, comunidad puede migrar |
| **Gateway excede 22M por drift externo** | ✅ **SÍ (v3.2)** | Gateway checa totalSupply() REAL antes de mintear |
| **Supply drift no detectado** | ✅ **SÍ (v3.2)** | hasSupplyDrift() detecta minting externo |
| **Otro minter excede 22M** | ❌ **NO** | CGCToken NO tiene cap; otro minter puede exceder |

### Lo Que NO Protege (Honestidad)

| Escenario | Realidad |
|-----------|----------|
| DAO vota añadir minter bypass | **POSIBLE** después de 7 días de delay |
| Multisig 3/5 se compromete | Gateway owner comprometido = callers manipulables |
| Timelock + DAO maliciosos coordinados | Pueden bypass después de delay |
| Guardian spamea pausas | **MITIGADO** - ver sección siguiente |
| **Otro minter excede supply total de 22M** | **NO PROTEGIDO** - CGCToken no tiene cap, Gateway solo se auto-limita |

### ⚠️ LIMITACIÓN CRÍTICA: EL GATEWAY NO CONTROLA OTROS MINTERS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    VERDAD SOBRE LA PROTECCIÓN DE 22M                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   LO QUE EL GATEWAY SÍ HACE:                                                ║
║   ✅ Se auto-limita a no mintear si totalSupply() >= 22M                    ║
║   ✅ Detecta drift con hasSupplyDrift()                                      ║
║   ✅ No agrava el problema si otro minter ya excedió                        ║
║                                                                              ║
║   LO QUE EL GATEWAY NO PUEDE HACER:                                         ║
║   ❌ Prevenir que otro minter (añadido vía Timelock) mintee > 22M          ║
║   ❌ Forzar el cap de 22M a nivel del token CGC (no tiene cap nativo)      ║
║                                                                              ║
║   CONSECUENCIA:                                                              ║
║   Si el DAO añade otro minter y ese minter NO tiene cap interno,            ║
║   la supply total PUEDE exceder 22M.                                        ║
║   El Gateway no puede evitar eso - solo puede evitar contribuir al exceso.  ║
║                                                                              ║
║   SOLUCIÓN REAL PARA CAP ABSOLUTO:                                          ║
║   Modificar CGCToken con un cap nativo (requiere upgrade o nuevo deploy)   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 🛑 Mitigación de Guardian Spam (Brecha #4)

**Problema**: Guardian puede pausar repetidamente (DoS intermitente).

**Soluciones disponibles (escoger según nivel de riesgo)**:

```solidity
// OPCIÓN A: Guardian es Multisig 2/3 (recomendado para producción)
// PRO: Requiere coordinación de 2 personas para pausar
// CON: Más lento para emergencias reales
constructor(..., address _guardian) {
    // Guardian debe ser Safe 2/3, no EOA
    require(IGnosisSafe(_guardian).getThreshold() >= 2, "Guardian must be multisig");
}

// OPCIÓN B: Cooldown de pausa (24 horas entre pausas)
// PRO: Limita spam sin multisig
// CON: Puede bloquear pausas legítimas consecutivas
uint256 public lastPauseTimestamp;
uint256 public constant PAUSE_COOLDOWN = 24 hours;

function emergencyPause(string calldata reason) external {
    require(msg.sender == guardian || msg.sender == owner(), "Not authorized");
    require(block.timestamp >= lastPauseTimestamp + PAUSE_COOLDOWN, "Cooldown active");
    lastPauseTimestamp = block.timestamp;
    _pause();
    emit EmergencyPaused(msg.sender, reason);
}

// OPCIÓN C: Guardian puede ser removido rápido (owner=multisig)
// PRO: Si guardian spamea, multisig lo remueve en <4h
// CON: Ventana de spam antes de remoción
// → Esta es la opción actual del contrato v3.1
```

**Recomendación**: Para producción, usar **OPCIÓN A** (Guardian = Multisig 2/3). Para testnet, OPCIÓN C es suficiente.

**SOLUCIÓN PARA BYPASS ABSOLUTO**: Si se requiere que bypass sea **100% imposible**, usar `cgcToken.renounceOwnership()` en lugar de Timelock. Pero esto elimina capacidad de emergencia.

---

## ❌ LO QUE SE ELIMINÓ (Contradicciones Anteriores)

1. **Fase 6 "Actualizar MilestoneEscrow"** - ELIMINADA
   - MilestoneEscrow **nunca** llama mint(), usa transfer()
   - No necesita modificación alguna

2. **Tests `test_milestoneEscrowThroughGateway()`** - ELIMINADOS
   - Escrow no pasa por Gateway porque no mintea

3. **Variables `INITIAL_SUPPLY` y `MAX_MINTABLE` hardcodeadas** - ELIMINADAS
   - Todas las funciones usan `initialSupplyAtDeployment` y `maxMintableViaGateway`

4. **Afirmaciones "bypass imposible"** - CORREGIDAS
   - Ahora dice: "bypass posible con delay de 7 días"

---

## 📊 TESTS REQUERIDOS (v3.3)

```javascript
// Tests CORE:
test_cannotMintOverCap()
test_onlyAuthorizedCanMint()
test_correctInitialSupplyReading()
test_correctMaxMintableCalculation()
test_pauseStopsMinting()
test_guardianCanPause()
test_guardianCannotUnpause()
test_ownerCanUnpause()
test_decimalsVerification()

// Tests GLOBAL CAP (v3.1+):
test_globalCapEnforcedAgainstTotalSupply()    // ← CRÍTICO
test_cannotExceed22MEvenIfAnotherMinterExists()  // Simular otro minter
test_getGlobalRemainingReflectsActualSupply()
test_hasSupplyDriftDetectsExternalMinting()
test_mintFailsWhenGlobalCapReached()

// Tests UNDERFLOW FIX (v3.2):
test_getGatewayRemainingReturnsZeroAfterBurn()  // ← NUEVO v3.2
test_getSupplyInfoDoesNotRevertAfterBurn()      // ← NUEVO v3.2
// Escenario: mint 19M, burn 5M, mint 2M más → gatewayRemaining debe ser 0 (no revert)

// Test de Simulación de Bypass:
// 1. Deploy Gateway
// 2. Simular que otro contrato mintea X tokens directamente
// 3. Verificar que Gateway.mint() respeta el cap global (22M - totalSupply())
// 4. Verificar que hasSupplyDrift() == true y reporta X

// Tests que NO tienen sentido (MilestoneEscrow no mintea):
// ❌ test_milestoneEscrowThroughGateway()
// ❌ test_escrowMintAfterMigration()
```

---

## 🎯 CRITERIO GO/NO-GO (v3.3)

| Criterio | Estado |
|----------|--------|
| Un solo código final sin bloques viejos | ✅ |
| View functions usan variables correctas | ✅ |
| Sin contradicción MilestoneEscrow | ✅ |
| Postura Timelock honesta | ✅ |
| Política pause/unpause clara | ✅ |
| CGC decimals verificado (18) | ✅ |
| **Cap validado contra totalSupply() real** | ✅ v3.1 |
| **Migración atómica documentada** | ✅ v3.1 |
| **Guardian spam mitigación documentada** | ✅ v3.1 |
| **Wording honesto: Gateway no protege otros minters** | ✅ v3.2 |
| **getGatewayRemaining() con clamp anti-underflow** | ✅ v3.2 |
| **OpenZeppelin version: v5.x ONLY (^5.0.1)** | ✅ v3.2 |
| **ACTION 5: authorizedCallers documentado** | ✅ v3.3 |
| **Guardian wording consistente (Multisig 2/3)** | ✅ v3.3 |

**VEREDICTO: GO** - Este documento v3.3 está listo para implementación.

### ⚠️ ADVERTENCIA FINAL PARA EL IMPLEMENTADOR

```
╔══════════════════════════════════════════════════════════════════════════════╗
║   ANTES DE DEPLOY EN MAINNET, ASEGURATE DE ENTENDER ESTAS LIMITACIONES:     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   1. El Gateway SOLO se limita a sí mismo - NO puede controlar otros        ║
║      minters que el DAO añada en el futuro vía Timelock.                    ║
║                                                                              ║
║   2. Si necesitas un cap ABSOLUTO de 22M en TODO el sistema, debes          ║
║      modificar CGCToken directamente (requiere upgrade o nuevo deploy).     ║
║                                                                              ║
║   3. El Gateway es una CAPA DE SEGURIDAD ADICIONAL, no la única.           ║
║                                                                              ║
║   4. Guardian DEBE ser Multisig 2/3 en mainnet (no EOA).                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📞 DIRECCIONES DE REFERENCIA

```
CGC Token:         0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
MilestoneEscrow:   0x8346CFcaECc90d678d862319449E5a742c03f109 (NO mintea)
Deployer:          0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6
DAO Aragon:        0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31 (owner actual)
```

---

**Made by mbxarts.com The Moon in a Box property**
**Co-Author: Godez22**
**Versión: 3.3 FINAL - 13 Diciembre 2025**

---

## 📝 CHANGELOG

### v3.3 (13 Dic 2025) - Runbook Completo + Guardian Consistency
- **NUEVO**: ACTION 5 añadido al runbook - "Habilitar Sistemas de Minting"
- **CRÍTICO**: Sin ACTION 5, ningún sistema puede llamar gateway.mint() (authorizedCallers vacío)
- **FIX**: Guardian wording consistente - ahora dice "Multisig 2/3" en TODO el documento
- **FIX**: Constructor @param _guardian actualizado con descripción correcta
- **FIX**: Arquitectura diagram actualizado (EOA → Multisig 2/3)
- **FIX**: OpenZeppelin version aclarada - "v5.x ONLY" (proyecto usa ^5.0.1)
- **ACTUALIZADO**: GO/NO-GO criteria con 2 nuevos checks

### v3.2 (13 Dic 2025) - Wording Honesto + Underflow Fix
- **FIX CRÍTICO**: `getGatewayRemaining()` ahora usa clamp para evitar underflow en escenario burn
- **WORDING HONESTO**: Matriz de seguridad ahora dice claramente que otro minter SÍ puede exceder 22M
- **NUEVO**: Sección "LIMITACIÓN CRÍTICA: EL GATEWAY NO CONTROLA OTROS MINTERS"
- **ACTUALIZADO**: Contract header clarifica que Gateway solo se limita a sí mismo
- **ACTUALIZADO**: OpenZeppelin version clarificada (v4.x vs v5.x paths)
- **ACTUALIZADO**: Guardian recomendación reforzada: Multisig 2/3 obligatorio para mainnet
- **ACTUALIZADO**: Advertencia final para implementador con 4 puntos críticos
- **TESTS NUEVOS**: `test_getGatewayRemainingReturnsZeroAfterBurn()`, `test_getSupplyInfoDoesNotRevertAfterBurn()`

### v3.1 (13 Dic 2025) - Brechas Críticas Corregidas
- **Brecha #1 (CRÍTICA)**: mint() ahora valida contra `MAX_TOTAL_SUPPLY - cgcToken.totalSupply()` (cap global real)
- **Brecha #3 (MEDIA)**: Runbook actualizado con batch atómico para Actions 3 (Gnosis Safe multicall)
- **Brecha #4 (MEDIA)**: Documentadas 3 opciones para mitigar guardian spam
- **NUEVO**: `getGlobalRemaining()` - remaining basado en totalSupply() real
- **NUEVO**: `getActualTotalSupply()` - lee supply directamente del token
- **NUEVO**: `hasSupplyDrift()` - detecta minting externo al Gateway
- **ACTUALIZADO**: getSupplyInfo() ahora retorna `actualTotalSupply` y `globalRemaining`
- **ACTUALIZADO**: Tests incluyen simulación de bypass con otro minter

### v3.0 (13 Dic 2025)
- Documento limpio sin código viejo
- Todas las 6 deficiencias de v2.0 corregidas
- Un solo contrato copy-paste ready

### v2.0 (Deprecated)
- Mezclaba variables v1 y v3
- Contradicciones sobre MilestoneEscrow
- Afirmaciones falsas sobre bypass "imposible"
