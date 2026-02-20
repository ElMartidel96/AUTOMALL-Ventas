# 🛡️ GUÍA COMPLETA: RESOLVER "TOKEN FRAUDULENTO" EN WALLETS

## 📋 PROBLEMA IDENTIFICADO

**Síntoma**: Las wallets (MetaMask, Coinbase Wallet) marcan el token CGC como "Tx fraudulenta" con el mensaje:
> "Esta transacción es iniciada por estafadores para enviar tokens y NFT fraudulentos. Por favor, absténgase de interactuar con ella."

**Causa Raíz**: El token CGC NO está en las listas de tokens verificados de las wallets. Los sistemas anti-scam modernos marcan automáticamente tokens no verificados como potencialmente fraudulentos.

**Fecha del Issue**: 5 DIC 2025
**Token Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
**Network**: Base Mainnet (Chain ID: 8453)

---

## 🎯 SOLUCIÓN: 3 PASOS CRÍTICOS

Para que las wallets **dejen de marcar CGC como fraudulento**, debemos:

1. ✅ **Actualizar info del token en BaseScan** (INMEDIATO - 24-48h)
2. ✅ **Listar el token en CoinGecko** (2-6 semanas, o 24h con Fast Pass)
3. ✅ **Agregar a Token Lists verificadas** (Inmediato una vez tengamos CoinGecko)

---

## 📊 PASO 1: ACTUALIZAR INFO EN BASESCAN

### ¿Por qué es importante?

BaseScan es el explorador oficial de Base Network. Las wallets consultan BaseScan para obtener información sobre tokens. Si el token tiene información completa y verificada, las wallets lo consideran más confiable.

### Requisitos Previos

- [x] Contrato verificado en BaseScan (HECHO - código fuente ya está verificado)
- [ ] Logo del token (PNG, 200x200px)
- [ ] Descripción del proyecto
- [ ] Links de redes sociales
- [ ] Website oficial

### Proceso de Actualización

#### 1.1 Crear cuenta en BaseScan

1. Ir a https://basescan.org/
2. Click en "Sign In" (esquina superior derecha)
3. Crear cuenta con email
4. Verificar email

#### 1.2 Verificar Propiedad del Contrato

**Importante**: Solo el owner del contrato puede actualizar la información.

1. Login en BaseScan
2. Hover sobre tu username → Click "Verified Addresses"
3. Click "Add Address" (botón superior derecho)
4. Ingresar contract address: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
5. Conectar con la wallet que deployó el contrato
6. Firmar el mensaje de verificación
7. Copiar la signature hash
8. Pegar en BaseScan y click "Verify Ownership"

**Reference**: [How to Verify Contract Address Ownership - BaseScan](https://info.basescan.org/verifyaddress/)

#### 1.3 Actualizar Información del Token

Una vez verificada la propiedad:

1. Ir a la página del token: https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
2. Click "Update Token Info" (botón cerca del nombre)
3. Completar el formulario:
   - **Token Name**: CryptoGift CGC
   - **Symbol**: CGC
   - **Description**: Descripción completa del proyecto DAO
   - **Logo**: Subir PNG 200x200px (usar logo existente del proyecto)
   - **Website**: URL del proyecto
   - **Social Media**: Twitter, Discord, GitHub
   - **Email**: Email de contacto oficial
   - **Whitepaper**: Link al whitepaper (si existe)

4. Submit y esperar aprobación (24-48 horas)

**Reference**: [Token Info Submission Guidelines - BaseScan](https://info.basescan.org/how-to-update-token-info/)

---

## 🦎 PASO 2: LISTAR EN COINGECKO

### ¿Por qué es crítico?

**CoinGecko es LA referencia** que usan las wallets para validar tokens legítimos. Si un token está en CoinGecko, las wallets automáticamente lo consideran verificado.

### Requisitos para Aplicar

#### 2.1 Requisitos Técnicos
- [x] Token deployado en Base Mainnet
- [x] Contrato verificado en BaseScan
- [ ] Listado en al menos 1 DEX (Uniswap, PancakeSwap, etc.)
- [ ] Liquidez activa (pares de trading funcionando)

#### 2.2 Documentación Requerida
- [ ] **Website oficial** (dominio propio)
- [ ] **Whitepaper** (PDF o página web)
- [ ] **Logo PNG 200x200px** (fondo transparente)
- [ ] **Social Media verificado**:
  - Twitter/X con followers
  - Discord/Telegram con comunidad activa
  - GitHub con código público (ya lo tenemos ✅)
- [ ] **Contract Address verificado**
- [ ] **Supply Info**:
  - Total Supply: 2,000,000 CGC
  - Circulating Supply: [Calcular cuánto está en circulación]
  - Max Supply: 2,000,000 CGC

### Proceso de Aplicación

#### 2.3 Paso a Paso

1. **Preparar documentación completa** (lista arriba)

2. **Aplicar en CoinGecko**:
   - Ir a: https://www.coingecko.com/en/coins/new
   - Click "Request Form"
   - Completar TODOS los campos:
     - Token name, symbol, contract address
     - Website, whitepaper, social media
     - Market/DEX donde está listado
     - Logo (upload)
     - Descripción del proyecto

3. **Public Verification Post** (CRÍTICO):
   - Después de aplicar, recibirás un Request ID por email
   - Ejemplo: `CL12345678`
   - Debes hacer un **post público** en Twitter/Discord verificando el request
   - Formato del post:
     ```
     We are applying to @coingecko for token listing verification.
     Request ID: CL12345678
     Contract: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
     Network: Base
     #CryptoGift #CGC #BaseNetwork
     ```
   - Enviar link del post a CoinGecko

**References**:
- [CoinGecko Listing Requirements](https://listing.help/coingecko-listing-requirements/)
- [How to List New Cryptocurrencies on CoinGecko](https://support.coingecko.com/hc/en-us/articles/7291312302617)
- [Verification Guide - CoinGecko](https://support.coingecko.com/hc/en-us/articles/23725417857817)

#### 2.4 Timeline

- **Revisión estándar**: 2-6 semanas
- **CoinGecko Fast Pass** (PAID): 24 horas ($5,000-$10,000 USD)

**Recomendación**: Si necesitas resolver el issue urgentemente para la comunidad, considera el Fast Pass. Si no hay urgencia extrema, aplicar normal y esperar.

---

## 📜 PASO 3: TOKEN LISTS (OPCIONAL PERO RECOMENDADO)

### ¿Qué son Token Lists?

Son listas JSON que las wallets y DEXs usan para mostrar tokens confiables. Si CGC está en una token list popular, las wallets lo reconocerán automáticamente.

### Crear Token List

#### 3.1 Formato Estándar

Crear archivo: `cgc-token-list.json`

```json
{
  "name": "CryptoGift DAO Token List",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "timestamp": "2025-12-05T00:00:00.000Z",
  "logoURI": "https://cryptogift-dao.com/logo.png",
  "keywords": ["dao", "governance", "cryptogift", "base"],
  "tokens": [
    {
      "chainId": 8453,
      "address": "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175",
      "name": "CryptoGift CGC",
      "symbol": "CGC",
      "decimals": 18,
      "logoURI": "https://cryptogift-dao.com/cgc-logo.png"
    }
  ]
}
```

#### 3.2 Publicar Token List

1. Subir el JSON a tu website (URL pública)
2. Aplicar para incluir en listas populares:
   - **Uniswap Default List** (si estás en Uniswap)
   - **Base Official List** (si Base Network tiene lista oficial)
   - **Community Lists** (agregar a listas comunitarias)

**Reference**: [Token Lists Standard - Uniswap](https://tokenlists.org/)

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### Prioridad ALTA (Esta Semana)

1. **HOY** (5 DIC 2025):
   - [ ] Verificar propiedad del contrato en BaseScan
   - [ ] Actualizar información del token en BaseScan
   - [ ] Preparar logo 200x200px PNG

2. **Esta Semana**:
   - [ ] Crear/actualizar website oficial si no existe
   - [ ] Preparar whitepaper o documento del proyecto
   - [ ] Verificar que hay liquidez en al menos 1 DEX
   - [ ] Preparar social media (Twitter, Discord)

### Prioridad MEDIA (Próximas 2 Semanas)

3. **Aplicar a CoinGecko**:
   - [ ] Completar formulario de aplicación
   - [ ] Hacer public verification post
   - [ ] Seguimiento cada 3-5 días

4. **Crear Token List**:
   - [ ] Generar JSON según estándar
   - [ ] Publicar en website
   - [ ] Compartir con comunidad

### Timeline Realista

| Acción | Tiempo Estimado | Impacto en "Tx Fraudulenta" |
|--------|-----------------|----------------------------|
| BaseScan Update | 24-48h | **Bajo** (pero necesario) |
| CoinGecko Listing | 2-6 semanas | **ALTO** ⭐⭐⭐ |
| CoinGecko Fast Pass | 24h | **ALTO** ⭐⭐⭐ |
| Token Lists | 1 semana | **Medio** ⭐⭐ |

---

## 💡 SOLUCIONES TEMPORALES

Mientras se resuelve el listado oficial:

### Para los Usuarios (Workaround)

1. **Agregar token manualmente**:
   - En MetaMask/Coinbase Wallet
   - Click "Import Token"
   - Ingresar contract address
   - Confirmar que es el token correcto

2. **Educar a la comunidad**:
   - Post en Discord/Twitter explicando
   - "CGC es legítimo, está en proceso de verificación"
   - Compartir link de BaseScan del contrato verificado

### Para el Proyecto

1. **Disclaimer en el website**:
   ```
   ⚠️ NOTA IMPORTANTE:
   El token CGC puede aparecer como "no verificado" en algunas wallets.
   Esto es normal para tokens nuevos que están en proceso de listado
   en CoinGecko. El contrato está verificado en BaseScan y es 100% legítimo.

   Contract: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
   ```

2. **FAQ Section**:
   - "¿Por qué mi wallet marca CGC como fraudulento?"
   - Explicación del proceso de verificación
   - Links a BaseScan y documentación

---

## 📚 RECURSOS Y REFERENCIAS

### BaseScan
- [Verify Contract Ownership](https://info.basescan.org/verifyaddress/)
- [Update Token Info](https://info.basescan.org/how-to-update-token-info/)
- [BaseScan Main Site](https://basescan.org/)

### CoinGecko
- [Listing Requirements 2025](https://listing.help/coingecko-listing-requirements/)
- [How to List New Tokens](https://support.coingecko.com/hc/en-us/articles/7291312302617)
- [Verification Guide](https://support.coingecko.com/hc/en-us/articles/23725417857817)
- [Preview List Tokens](https://support.coingecko.com/hc/en-us/articles/40576012083097)

### Wallet Security Systems
- [Coinbase Scam Token Detection](https://www.coinbase.com/blog/detecting-the-undetectable-coinbase-erc-20-scam-token-detection-system)
- [MetaMask Security Report Oct 2025](https://metamask.io/news/metamask-security-report)

### Token Standards
- [Token Lists Standard](https://tokenlists.org/)
- [ERC-20 Token Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de Aplicar a CoinGecko

- [ ] Contrato verificado en BaseScan (código fuente visible)
- [ ] Información del token actualizada en BaseScan
- [ ] Logo 200x200px PNG preparado
- [ ] Website oficial funcionando
- [ ] Whitepaper disponible públicamente
- [ ] Social media activo (Twitter/Discord/Telegram)
- [ ] Token listado en al menos 1 DEX
- [ ] Liquidez disponible para trading
- [ ] Comunidad activa (mínimo 100 holders recomendado)

### Durante el Proceso

- [ ] Formulario de CoinGecko completado 100%
- [ ] Request ID recibido por email
- [ ] Public verification post publicado
- [ ] Link del post enviado a CoinGecko
- [ ] Seguimiento cada 3-5 días

### Después de la Aprobación

- [ ] Token visible en CoinGecko
- [ ] Precio y market cap actualizándose
- [ ] Logo y descripción correctos
- [ ] Links funcionando
- [ ] Wallets reconociendo el token automáticamente

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **AHORA MISMO**:
   ```bash
   # Verificar que tenemos todo lo necesario
   - Contract address ✅
   - BaseScan verified ✅
   - Logo preparado ❓
   - Website ❓
   - Social media ❓
   ```

2. **PRÓXIMA SESIÓN**:
   - Completar verificación en BaseScan
   - Preparar assets (logo, descripción)
   - Iniciar proceso de CoinGecko

---

**Creado**: 5 DIC 2025
**Última Actualización**: 5 DIC 2025
**Status**: 🔄 EN PROGRESO
**Prioridad**: 🔴 CRÍTICA (afecta confianza de usuarios)

Made by mbxarts.com The Moon in a Box property
Co-Author: Godez22
