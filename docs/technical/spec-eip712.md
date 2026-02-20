# 🔐 Especificación EIP-712 - Sistema de Liberación de Tokens

## 1. Introducción

EIP-712 es un estándar para la firma estructurada de datos que mejora la seguridad y la experiencia del usuario al firmar transacciones. En el contexto del CryptoGift Wallets DAO, utilizamos EIP-712 para autorizar la liberación programática de tokens CGC.

### 1.1 Ventajas de EIP-712
- **Legibilidad**: Los usuarios pueden ver exactamente qué están firmando
- **Seguridad**: Previene ataques de phishing y replay
- **Compatibilidad**: Soportado por todas las wallets modernas
- **Verificación on-chain**: Validación eficiente mediante `SignatureChecker`

## 2. Estructura del Dominio

### 2.1 Definición del Dominio

```solidity
struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
}
```

### 2.2 Valores del Dominio

```javascript
const domain = {
    name: "GovTokenVault",
    version: "1",
    chainId: 8453, // Base Mainnet
    verifyingContract: "0x[VAULT_ADDRESS]"
};
```

### 2.3 Type Hash del Dominio

```solidity
bytes32 constant DOMAIN_TYPEHASH = keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
);
```

## 3. Tipos de Mensajes

### 3.1 ReleaseOrder (Orden de Liberación)

#### Estructura
```solidity
struct ReleaseOrder {
    address beneficiary;      // Receptor de los tokens
    uint256 amount;           // Cantidad de tokens CGC (con 18 decimales)
    uint256 goalId;           // ID de la meta completada
    uint256 campaignId;       // ID de la campaña
    bytes32 attestationUID;   // UID de la attestation EAS
    uint256 deadline;         // Timestamp de expiración
    uint256 nonce;           // Nonce anti-replay
}
```

#### Type Hash
```solidity
bytes32 constant RELEASE_ORDER_TYPEHASH = keccak256(
    "ReleaseOrder(address beneficiary,uint256 amount,uint256 goalId,uint256 campaignId,bytes32 attestationUID,uint256 deadline,uint256 nonce)"
);
```

#### Ejemplo de Orden
```javascript
const order = {
    beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    amount: "1000000000000000000000", // 1000 CGC
    goalId: 42,
    campaignId: 1,
    attestationUID: "0xabc123...",
    deadline: 1693526400, // Unix timestamp
    nonce: 12345
};
```

### 3.2 BatchRelease (Liberación en Lote)

#### Estructura
```solidity
struct BatchRelease {
    address[] beneficiaries;
    uint256[] amounts;
    uint256 campaignId;
    bytes32 merkleRoot;
    uint256 deadline;
}
```

#### Type Hash
```solidity
bytes32 constant BATCH_RELEASE_TYPEHASH = keccak256(
    "BatchRelease(address[] beneficiaries,uint256[] amounts,uint256 campaignId,bytes32 merkleRoot,uint256 deadline)"
);
```

## 4. Proceso de Firma

### 4.1 Generación del Hash

```javascript
// 1. Encode the data
const encoded = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "address", "uint256", "uint256", "uint256", "bytes32", "uint256", "uint256"],
    [
        RELEASE_ORDER_TYPEHASH,
        order.beneficiary,
        order.amount,
        order.goalId,
        order.campaignId,
        order.attestationUID,
        order.deadline,
        order.nonce
    ]
);

// 2. Hash the encoded data
const structHash = ethers.utils.keccak256(encoded);

// 3. Create the domain separator
const domainSeparator = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
            DOMAIN_TYPEHASH,
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domain.name)),
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domain.version)),
            domain.chainId,
            domain.verifyingContract
        ]
    )
);

// 4. Create the final digest
const digest = ethers.utils.keccak256(
    ethers.utils.solidityPack(
        ["string", "bytes32", "bytes32"],
        ["\x19\x01", domainSeparator, structHash]
    )
);
```

### 4.2 Firma con ethers.js

```javascript
// For EOA (Externally Owned Account)
const signature = await signer._signTypedData(domain, types, order);

// For Smart Contract Wallet (ERC-1271)
// The DAO will sign through its proposal system
const daoSignature = await aragonDAO.signMessage(digest);
```

### 4.3 Formato de Firma

```
Signature = r (32 bytes) || s (32 bytes) || v (1 byte)
Total: 65 bytes
```

## 5. Verificación On-chain

### 5.1 Usando SignatureChecker

```solidity
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

function verifySignature(
    ReleaseOrder calldata order,
    bytes calldata signature
) internal view returns (bool) {
    bytes32 digest = _hashTypedDataV4(
        keccak256(abi.encode(
            RELEASE_ORDER_TYPEHASH,
            order.beneficiary,
            order.amount,
            order.goalId,
            order.campaignId,
            order.attestationUID,
            order.deadline,
            order.nonce
        ))
    );
    
    // Verifica EOA o ERC-1271 (smart contract)
    return SignatureChecker.isValidSignatureNow(
        aragonDAO, // El DAO es el firmante autorizado
        digest,
        signature
    );
}
```

### 5.2 Verificación ERC-1271

Para smart contracts como el Aragon DAO:

```solidity
// El DAO implementa ERC-1271
function isValidSignature(
    bytes32 hash,
    bytes memory signature
) external view returns (bytes4 magicValue) {
    // Verifica que la firma fue autorizada por propuesta
    if (authorizedHashes[hash]) {
        return 0x1626ba7e; // ERC-1271 magic value
    }
    return 0xffffffff; // Invalid signature
}
```

## 6. Sistema Anti-Replay

### 6.1 Estrategia de Nonces

```solidity
// Nonce por (beneficiary, campaignId)
mapping(address => mapping(uint256 => uint256)) public nonces;

// Verificación
require(nonces[order.beneficiary][order.campaignId] < order.nonce, "Nonce already used");

// Actualización
nonces[order.beneficiary][order.campaignId] = order.nonce;
```

### 6.2 Order Hash Tracking

```solidity
// Track de hashes procesados
mapping(bytes32 => bool) public usedOrderHashes;

// Verificación
bytes32 orderHash = keccak256(abi.encode(order));
require(!usedOrderHashes[orderHash], "Order already processed");

// Actualización
usedOrderHashes[orderHash] = true;
```

### 6.3 Deadline (TTL)

```solidity
// TTL corto para seguridad (15-30 minutos)
uint256 constant TTL_RELEASE_ORDER = 15 minutes;

// Verificación
require(block.timestamp <= order.deadline, "Order expired");
require(order.deadline <= block.timestamp + TTL_RELEASE_ORDER, "Deadline too far");
```

## 7. Integración con Aragon DAO

### 7.1 Flujo de Autorización

```
1. Bot crea attestation EAS
2. Bot prepara ReleaseOrder
3. Bot envía orden al servicio de firma del DAO
4. DAO valida mediante propuesta o delegación
5. DAO firma con ERC-1271
6. Usuario ejecuta releaseWithOrder() en el Vault
7. Vault verifica firma del DAO
8. Tokens son transferidos
```

### 7.2 Propuesta para Autorizar Batch

```javascript
// Crear propuesta en Aragon para autorizar un batch
const proposal = {
    title: "Autorizar distribución mensual",
    actions: [{
        to: govTokenVault,
        data: encodeFunctionData("authorizeBatch", [merkleRoot, totalAmount])
    }]
};
```

## 8. Ejemplos de Implementación

### 8.1 Cliente JavaScript

```javascript
import { ethers } from "ethers";

class ReleaseOrderSigner {
    constructor(provider, vaultAddress, daoAddress) {
        this.provider = provider;
        this.vaultAddress = vaultAddress;
        this.daoAddress = daoAddress;
        
        this.domain = {
            name: "GovTokenVault",
            version: "1",
            chainId: 8453,
            verifyingContract: vaultAddress
        };
        
        this.types = {
            ReleaseOrder: [
                { name: "beneficiary", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "goalId", type: "uint256" },
                { name: "campaignId", type: "uint256" },
                { name: "attestationUID", type: "bytes32" },
                { name: "deadline", type: "uint256" },
                { name: "nonce", type: "uint256" }
            ]
        };
    }
    
    async createOrder(beneficiary, amount, goalId, campaignId, attestationUID) {
        const deadline = Math.floor(Date.now() / 1000) + (15 * 60); // 15 min
        const nonce = Date.now(); // Simple nonce
        
        const order = {
            beneficiary,
            amount: ethers.utils.parseEther(amount).toString(),
            goalId,
            campaignId,
            attestationUID,
            deadline,
            nonce
        };
        
        // This would need DAO authorization in production
        const signer = this.provider.getSigner();
        const signature = await signer._signTypedData(
            this.domain,
            this.types,
            order
        );
        
        return { order, signature };
    }
}
```

### 8.2 Script de Testing

```javascript
// Test de verificación de firma
async function testSignatureVerification() {
    const order = {
        beneficiary: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
        amount: ethers.utils.parseEther("100"),
        goalId: 1,
        campaignId: 1,
        attestationUID: ethers.utils.id("test-attestation"),
        deadline: Math.floor(Date.now() / 1000) + 900,
        nonce: 1
    };
    
    // Sign
    const signature = await signer._signTypedData(domain, types, order);
    
    // Verify on-chain
    const tx = await vault.releaseWithOrder(order, signature);
    const receipt = await tx.wait();
    
    console.log("Release successful:", receipt.transactionHash);
}
```

## 9. Seguridad

### 9.1 Mejores Prácticas

1. **TTL Corto**: 15-30 minutos máximo para órdenes
2. **Nonces Incrementales**: Prevenir replay attacks
3. **Verificación de Attestation**: Siempre validar EAS
4. **Caps y Límites**: Aplicar límites por periodo
5. **Firma del DAO**: Solo el DAO puede autorizar (ERC-1271)
6. **Modo Shadow**: Probar sin transferencias reales

### 9.2 Vectores de Ataque y Mitigaciones

| Vector | Mitigación |
|--------|------------|
| Replay Attack | Nonces + order hash tracking |
| Signature Malleability | SignatureChecker de OpenZeppelin |
| Front-running | Deadline corto + slippage protection |
| Phishing | Mostrar datos claros al usuario |
| Chain Replay | chainId en el dominio |

## 10. Testing y Auditoría

### 10.1 Test Cases

```javascript
describe("EIP-712 Release Orders", () => {
    it("Should accept valid signature from DAO", async () => {
        // Test implementation
    });
    
    it("Should reject expired orders", async () => {
        // Test implementation
    });
    
    it("Should prevent replay attacks", async () => {
        // Test implementation
    });
    
    it("Should verify ERC-1271 signatures", async () => {
        // Test implementation
    });
});
```

### 10.2 Checklist de Auditoría

- [ ] Dominio correcto y único
- [ ] Type hashes calculados correctamente
- [ ] Nonces implementados correctamente
- [ ] TTL aplicado y verificado
- [ ] SignatureChecker usado correctamente
- [ ] ERC-1271 soportado
- [ ] Anti-replay completo
- [ ] Caps y límites funcionales
- [ ] Eventos emitidos correctamente
- [ ] No hay reentrancy

## 11. Referencias

- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-1271 Standard](https://eips.ethereum.org/EIPS/eip-1271)
- [OpenZeppelin SignatureChecker](https://docs.openzeppelin.com/contracts/4.x/api/utils#SignatureChecker)
- [Ethers.js Typed Data](https://docs.ethers.io/v5/api/signer/#Signer-signTypedData)

---

*Versión: 1.0*
*Última actualización: Agosto 28, 2025*