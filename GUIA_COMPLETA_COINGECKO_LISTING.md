# 🚀 GUÍA COMPLETA: COINGECKO LISTING PASO A PASO

**Versión**: 1.1
**Fecha**: 8 de Diciembre, 2025
**Presupuesto**: $100 USD para liquidez inicial
**Token**: CGC (CryptoGift Coin)
**Network**: Base Mainnet
**Website Oficial**: https://mbxarts.com

Made by mbxarts.com The Moon in a Box property

---

## 📋 TABLA DE CONTENIDOS

1. [Pre-Requisitos](#pre-requisitos)
2. [Fase 1: Exportar Whitepaper a PDF](#fase-1-exportar-whitepaper-a-pdf)
3. [Fase 2: Crear Pool de Liquidez en Base](#fase-2-crear-pool-de-liquidez-en-base)
4. [Fase 3: Completar Formulario CoinGecko](#fase-3-completar-formulario-coingecko)
5. [Fase 4: Seguimiento Post-Solicitud](#fase-4-seguimiento-post-solicitud)
6. [Troubleshooting](#troubleshooting)

---

## ✅ PRE-REQUISITOS

Antes de comenzar, asegúrate de tener:

### Documentación (✅ COMPLETO)
- [x] Whitepaper HTML generado
- [x] API endpoints funcionando
- [x] Contract verificado en BaseScan
- [x] Logos optimizados (32x32 y 200x200)

### Wallet & Fondos
- [ ] Wallet con CGC tokens (para liquidez)
- [ ] ~$100 USD en ETH (Base network) para:
  - Gas fees de creación del pool (~$2-5)
  - Liquidez inicial en par CGC/ETH (~$95)

### Acceso a Plataformas
- [ ] Cuenta en CoinGecko (crear si no tienes)
- [ ] Acceso a DEX en Base (Uniswap V3, Aerodrome, o BaseSwap)
- [ ] Wallet conectada a Base Mainnet

---

## 🎯 FASE 1: EXPORTAR WHITEPAPER A PDF

### Paso 1.1: Abrir HTML en Navegador

**Ubicación del archivo**:
```
C:\Users\rafae\cryptogift-wallets-DAO\public\CRYPTOGIFT_WHITEPAPER_v1.2.html
```

**Opciones para abrir**:
1. **Doble clic** en el archivo (se abre en navegador predeterminado)
2. **Arrastrar** el archivo a Chrome/Edge
3. **Ctrl+O** en el navegador → Seleccionar el archivo

### Paso 1.2: Configurar Impresión

Una vez abierto en el navegador:

1. **Presionar**: `Ctrl+P` (Windows) o `Cmd+P` (Mac)

2. **Configurar destino**:
   - Destino: **"Guardar como PDF"** o **"Microsoft Print to PDF"**

3. **Configurar página**:
   - Tamaño de papel: **A4** (recomendado) o **Letter**
   - Orientación: **Vertical**
   - Márgenes: **Predeterminado**

4. **IMPORTANTE - Activar gráficos**:
   - ✅ **Gráficos de fondo**: **ACTIVADO** (crítico para estilos)
   - En Chrome: "Más ajustes" → "Gráficos de fondo" → ✅
   - En Edge: "Más configuraciones" → "Gráficos de fondo" → ✅

### Paso 1.3: Guardar PDF

1. **Click en "Guardar"** o **"Print"**

2. **Guardar como**:
   - Nombre: `CRYPTOGIFT_WHITEPAPER_v1.2.pdf`
   - Ubicación: `C:\Users\rafae\cryptogift-wallets-DAO\public\`

3. **Verificar PDF**:
   - Abrir el PDF generado
   - Verificar que los estilos se vean correctos
   - Verificar que las tablas estén formateadas
   - Verificar que los headers/footers estén presentes

### Paso 1.4: Subir a Repositorio (Opcional)

```bash
# Agregar PDF al repositorio
git add public/CRYPTOGIFT_WHITEPAPER_v1.2.pdf

# Commit
git commit -m "docs: add whitepaper PDF for CoinGecko listing

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22"

# Push
git push origin main
```

**✅ RESULTADO**: Tendrás el whitepaper en PDF listo para CoinGecko

---

## 💧 FASE 2: CREAR POOL DE LIQUIDEZ EN BASE

### ¿Por qué necesitas liquidez?

CoinGecko requiere que el token tenga **liquidez activa** en al menos un DEX para ser listado. Un pool pequeño de $100 USD es suficiente para cumplir este requisito.

### Opción A: Uniswap V3 (Recomendado)

**URL**: https://app.uniswap.org

#### Paso 2A.1: Conectar Wallet
1. Ir a https://app.uniswap.org
2. Click en "Connect Wallet"
3. Seleccionar MetaMask (o tu wallet preferida)
4. Cambiar network a **Base** (arriba a la derecha)

#### Paso 2A.2: Crear Nueva Posición
1. Click en **"Pool"** (menú superior)
2. Click en **"New Position"** o **"+ New Position"**
3. Seleccionar par de tokens:
   - Token 1: **CGC** (pegar address: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`)
   - Token 2: **ETH** (WETH - aparece automáticamente)

#### Paso 2A.3: Configurar Rango de Precio
1. **Fee tier**: Seleccionar **1%** (recomendado para tokens nuevos)
2. **Rango de precio**:
   - Opción fácil: Click en **"Full Range"** (rango completo)
   - Opción avanzada: Establecer rango personalizado según tu estrategia

#### Paso 2A.4: Depositar Liquidez
1. **Cantidad de CGC**:
   - Ejemplo: 10,000 CGC (ajustar según lo que quieras)

2. **Cantidad de ETH**:
   - El sistema calculará automáticamente basado en el ratio
   - Aproximadamente: ~$50 USD en ETH (si depositas $100 total)

3. **Aprobar tokens**:
   - Click "Approve CGC" → Confirmar en wallet
   - Esperar confirmación (~5-10 segundos en Base)

4. **Crear pool**:
   - Click "Preview"
   - Revisar detalles
   - Click "Add" → Confirmar en wallet
   - **Gas fee**: ~$2-5 USD en ETH

#### Paso 2A.5: Confirmar Creación
1. Esperar confirmación de transacción
2. Guardar **Transaction Hash** para CoinGecko
3. Anotar **Pool Address** (se muestra después de crear)

### Opción B: Aerodrome Finance (Alternativa)

**URL**: https://aerodrome.finance

Similar a Uniswap pero específico de Base. Pasos similares:
1. Conectar wallet a Base
2. "Liquidity" → "Deposit"
3. Seleccionar CGC/ETH
4. Depositar cantidades (~$100 total)
5. Confirmar transacción

### Opción C: BaseSwap (Alternativa)

**URL**: https://baseswap.fi

Similar a PancakeSwap. Pasos:
1. Conectar wallet
2. "Liquidity" → "Add Liquidity"
3. Seleccionar CGC + ETH
4. Depositar (~$100 total)
5. Confirmar

### 📊 Información a Guardar del Pool

Después de crear el pool, guarda esta información:

```
✅ DEX usado: Uniswap V3 (o el que usaste)
✅ Pool Address: 0x... (copiar de la transacción)
✅ Transaction Hash: 0x... (copiar de la confirmación)
✅ Total Liquidity: ~$100 USD
✅ CGC Amount: 10,000 CGC (ejemplo)
✅ ETH Amount: 0.025 ETH (ejemplo)
✅ Fee Tier: 1%
✅ BaseScan Link: https://basescan.org/tx/[tu-transaction-hash]
```

**⏱️ TIEMPO ESTIMADO**: 10-15 minutos

**💰 COSTO TOTAL**: ~$100 USD en liquidez + ~$2-5 gas fees

**✅ RESULTADO**: Pool de liquidez activo en Base para CGC/ETH

---

## 📝 FASE 3: COMPLETAR FORMULARIO COINGECKO

### Paso 3.1: Acceder al Formulario

**URL**: https://www.coingecko.com/en/coins/new

**Requisito**: Crear cuenta en CoinGecko si no tienes una.

### Paso 3.2: Información Básica del Token

#### **Project Name** (Nombre del Proyecto)
```
CryptoGift Wallets DAO
```

#### **Ticker/Symbol**
```
CGC
```

#### **Project Website**
```
https://mbxarts.com
```

#### **Project Description** (Descripción corta)
```
CryptoGift Wallets DAO is a Web3 education platform that transforms learning into governance power. Users earn CGC tokens by completing educational quests, which grant voting rights in the DAO. Built on Base (Ethereum L2) with Aragon OSx governance.
```

#### **Category**
```
Education, DAO, Governance
```

### Paso 3.3: Información de Blockchain

#### **Blockchain**
```
Base
```

#### **Contract Address**
```
0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
```

#### **Contract Decimals**
```
18
```

#### **Total Supply** (Max Supply)
```
22000000
```
*Note: CGC uses milestone-based progressive emission. Initial circulating: 2M CGC, Max theoretical: 22M CGC.*

#### **Total Supply API**
```
https://mbxarts.com/api/token/total-supply
```

#### **Circulating Supply API**
```
https://mbxarts.com/api/token/circulating-supply
```

#### **Block Explorer**
```
https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
```

### Paso 3.4: Información de Mercado

#### **Is your project listed on any exchanges?**
```
No (seleccionar)
```

#### **Liquidity Pools** (DEX)
```
Yes (seleccionar)
```

#### **DEX Name**
```
Uniswap V3 (o el que usaste)
```

#### **Pair**
```
CGC/WETH
```

#### **Pool Address**
```
[Pegar el Pool Address que guardaste en Fase 2]
```

#### **Pool Transaction Hash**
```
[Pegar el Transaction Hash que guardaste en Fase 2]
```

#### **Pool Creation Date**
```
[Fecha de hoy: December 7, 2025]
```

### Paso 3.5: Documentación y Enlaces

#### **Whitepaper**
```
https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf
```

O si prefieres el HTML:
```
https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html
```

#### **GitHub**
```
https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO
```

#### **Documentation**
```
https://mbxarts.com/docs
```

#### **Twitter/X**
```
https://x.com/cryptogiftdao
```

#### **Discord**
```
https://discord.gg/XzmKkrvhHc
```

#### **Telegram**
```
https://t.me/cryptogiftwalletsdao
```

#### **Giveth**
```
https://giveth.io/project/cryptogift-wallets-dao
```

#### **Medium/Blog** (opcional)
```
[Dejar vacío si no tienes]
```

### Paso 3.6: Información del Equipo

#### **Project Team Email**
```
admin@mbxarts.com
```

#### **Team Members** (opcional pero recomendado)
```
Rafael Gonzalez - Founder & Product/Engineering Lead (LinkedIn: linkedin.com/in/rafael-gonzalez-iautomallink)
Roberto Legrá - Head of Community & Growth / Marketing Advisor
Leodanni Avila - Business Development & Operations / Marketing Advisor
```

#### **Team Page**
```
https://mbxarts.com/docs?tab=verification
```

#### **Are you associated with any other projects?**
```
No (o mencionar CryptoGift Wallets si aplica)
```

### Paso 3.7: Logos e Imágenes

#### **Logo 32x32 SVG** (Para BaseScan)
**URL GitHub RAW** (Recomendado):
```
https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/cgc-logo-32x32.svg
```

**URL Vercel**:
```
https://mbxarts.com/cgc-logo-32x32.svg
```

#### **Logo 200x200 PNG** (Para CoinGecko)
**URL GitHub RAW** (Recomendado):
```
https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png
```

**URL Vercel**:
```
https://mbxarts.com/metadata/cgc-logo-200x200.png
```

#### **Logo 512x512 PNG** (Para Wallets)
**URL GitHub RAW**:
```
https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png
```

### Paso 3.8: Información Adicional

#### **Additional Information** (campo de texto libre)
```
CryptoGift Wallets DAO represents the first Web3 education platform that directly converts learning effort into governance power through a decentralized autonomous organization.

Key Highlights:
• Built on Base Mainnet (Ethereum Layer 2) for low fees and fast transactions
• Aragon OSx v1.4.0 governance framework
• EAS (Ethereum Attestation Service) integration for quest verification
• All smart contracts verified on BaseScan
• Complete documentation and professional whitepaper
• Active community with multi-level referral system

Token Utility:
• Governance voting rights in DAO proposals
• Access to premium educational content
• Experience multipliers for learning quests
• Delegation capabilities for community representatives

Security:
• All contracts audited and verified
• Bug bounty program active
• Multisig treasury management
• 48h timelock on critical functions

The project aims to democratize Web3 education by rewarding users for learning and enabling them to co-govern the protocol's future direction.
```

#### **Is this a fork of another project?**
```
No
```

#### **Is this a rebase/elastic supply token?**
```
No (CGC uses milestone-based progressive emission. Initial: 2M CGC, Max: 22M CGC minted as DAO completes verified milestones)
```

### Paso 3.9: Verificación Final

Antes de enviar, revisa:

- [x] Todos los campos completados correctamente
- [x] URLs accesibles y funcionando
- [x] Contract address correcto
- [x] Pool de liquidez creado y verificable
- [x] APIs respondiendo correctamente
- [x] Logos cargados o URLs funcionando
- [x] Email de contacto válido

### Paso 3.10: Enviar Formulario

1. **Revisar** toda la información una última vez
2. **Aceptar** términos y condiciones de CoinGecko
3. Click en **"Submit"** o **"Send Application"**
4. **Guardar** el número de confirmación o email que recibas

**✅ RESULTADO**: Solicitud enviada a CoinGecko para revisión

---

## 📧 FASE 4: SEGUIMIENTO POST-SOLICITUD

### Paso 4.1: Confirmación Inmediata

**Lo que recibirás**:
- Email de confirmación de CoinGecko
- Número de ticket o referencia
- Tiempo estimado de revisión (generalmente 7-14 días)

**Guardar**:
- Email de confirmación
- Número de ticket
- Fecha de envío

### Paso 4.2: Revisión por CoinGecko

**Proceso de CoinGecko**:
1. **Verificación automática** (1-2 días):
   - Verifican que el contract existe
   - Verifican que las APIs responden
   - Verifican liquidez en DEX

2. **Revisión manual** (3-7 días):
   - Equipo de CoinGecko revisa whitepaper
   - Verifican legitimidad del proyecto
   - Revisan redes sociales y comunidad

3. **Decisión final** (7-14 días):
   - Aprobación → Token listado
   - Rechazo → Email con razones
   - Solicitud de información adicional

### Paso 4.3: Posibles Respuestas

#### ✅ **APROBADO**
**Email de CoinGecko**:
```
"Congratulations! Your token has been approved for listing on CoinGecko."
```

**Qué hacer**:
1. Verificar que el token aparece en CoinGecko
2. Verificar que los datos se muestran correctamente
3. Compartir el link de CoinGecko en redes sociales
4. Actualizar website con "Listed on CoinGecko" badge

**URL de tu token** (después de aprobación):
```
https://www.coingecko.com/en/coins/cryptogift-coin
```

#### ❌ **INFORMACIÓN ADICIONAL REQUERIDA**
**Posibles solicitudes**:
- Más información sobre el equipo
- Mayor liquidez en DEX
- Más actividad en redes sociales
- Documentación adicional

**Qué hacer**:
1. Responder el email de CoinGecko rápidamente
2. Proporcionar la información solicitada
3. Hacer los ajustes necesarios (si aplica)
4. Esperar nueva revisión

#### 🔄 **RECHAZADO**
**Razones comunes**:
- Liquidez insuficiente
- Proyecto muy nuevo
- Falta de actividad en redes sociales
- Documentación incompleta

**Qué hacer**:
1. Leer cuidadosamente las razones
2. Incrementar liquidez si es necesario
3. Mejorar presencia en redes sociales
4. Esperar 30-60 días antes de re-aplicar

### Paso 4.4: Monitoreo Durante la Espera

**Mientras esperas respuesta de CoinGecko**:

1. **Mantener liquidez activa**:
   - NO remover el pool que creaste
   - Considerar agregar más liquidez si es posible
   - Monitorear que el pool sigue activo

2. **Actividad en redes sociales**:
   - Publicar sobre el proyecto en Twitter/X
   - Compartir updates en Discord
   - Crear engagement con la comunidad

3. **Verificar que todo funciona**:
   - APIs siguen respondiendo
   - Website sigue online
   - Contract sigue verificado en BaseScan

4. **Preparar para después del listing**:
   - Plan de marketing post-listing
   - Announcements preparados
   - Community engagement strategy

### Paso 4.5: Después del Listing

**Una vez listado en CoinGecko**:

1. **Verificar información**:
   - Precio mostrado correctamente
   - Supply correcto
   - Links funcionando
   - Logos mostrándose bien

2. **Promover el listing**:
   ```
   🎉 Exciting News!

   CGC (CryptoGift Coin) is now LIVE on @coingecko! 🚀

   Track our price, market cap, and stats:
   [Link to CoinGecko page]

   Built on @BuildOnBase | Governed by @AragonProject

   #CryptoGift #CGC #Base #DAO
   ```

3. **Agregar badge a website**:
   - CoinGecko proporciona badges oficiales
   - Agregar a la homepage
   - Agregar al README de GitHub

4. **Actualizar documentación**:
   - Agregar link de CoinGecko a docs
   - Actualizar CLAUDE.md con la información
   - Mencionar en whitepaper (versión futura)

---

## 🔧 TROUBLESHOOTING

### Problema: APIs no responden

**Solución**:
```bash
# Verificar que el deployment en Vercel está activo
curl https://mbxarts.com/api/token/total-supply

# Debe retornar:
{
  "total_supply": "22000000",
  "circulating_supply": "2000000",
  "emission_model": "milestone-based",
  "max_supply": "22000000",
  "notes": "CGC uses milestone-based progressive emission..."
}
```

Si no funciona:
1. Verificar deployment en Vercel
2. Verificar que no hay errores en logs
3. Re-deploy si es necesario

### Problema: Pool de liquidez no aparece

**Solución**:
1. Verificar transaction en BaseScan
2. Esperar 5-10 minutos para indexación
3. Verificar en el DEX que el pool existe
4. Proporcionar transaction hash a CoinGecko

### Problema: Logos no cargan

**Solución**:
1. Verificar que los archivos están en `public/metadata/`
2. Verificar que los archivos están en el deployment de Vercel
3. Probar URLs directamente en navegador
4. Re-subir archivos si es necesario

### Problema: Contract no verificado

**Solución**:
```bash
# Ya está verificado, pero si hay problema, verificar en BaseScan:
https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175#code

# Debe mostrar código fuente completo y badge verde "Verified"
```

### Problema: Fondos insuficientes para crear pool

**Solución**:
1. **Reducir cantidad de liquidez**:
   - Mínimo aceptable: ~$50 USD total
   - CoinGecko acepta pools pequeños

2. **Usar DEX con fees más bajos**:
   - BaseSwap puede tener fees menores
   - Aerodrome también es opción

3. **Obtener ETH en Base**:
   - Bridge desde Ethereum mainnet
   - Comprar directamente en exchange que soporte Base
   - Usar faucets de testnet primero para practicar (NO para CoinGecko)

---

## 📊 RESUMEN DE COSTOS

```
PRESUPUESTO TOTAL: ~$105-110 USD

Desglose:
├── Liquidez en DEX:         $100 USD
│   ├── 50% en CGC tokens
│   └── 50% en ETH (WETH)
│
├── Gas fees (Base):         $2-5 USD
│   ├── Approve CGC:         ~$1
│   ├── Add liquidity:       ~$1-2
│   └── Contingencia:        ~$1-2
│
└── CoinGecko listing:       $0 USD (GRATIS)
```

**NOTA**: Base tiene fees mucho más bajos que Ethereum mainnet (generalmente <$1 por transacción).

---

## ⏱️ TIMELINE ESTIMADO

```
DÍA 1 (HOY):
├── 00:00-00:15 → Exportar whitepaper a PDF
├── 00:15-00:30 → Preparar fondos (ETH + CGC)
├── 00:30-01:00 → Crear pool en DEX
└── 01:00-01:30 → Completar formulario CoinGecko

DÍA 2-7:
└── Verificación automática de CoinGecko

DÍA 8-14:
└── Revisión manual por equipo CoinGecko

DÍA 15-21:
└── Decisión final y listing (si aprobado)

TOTAL: ~2-3 semanas desde solicitud hasta listing
```

---

## 🎯 CHECKLIST FINAL PRE-SOLICITUD

Antes de enviar la solicitud a CoinGecko, verifica:

### Documentación
- [ ] Whitepaper PDF generado y subido
- [ ] APIs funcionando (total-supply y circulating-supply)
- [ ] Contract verificado en BaseScan (badge verde)
- [ ] Website online y funcionando
- [ ] Docs page accesible
- [ ] GitHub público y actualizado

### Liquidez
- [ ] Pool creado en DEX (Uniswap/Aerodrome/BaseSwap)
- [ ] Transaction hash guardado
- [ ] Pool address guardado
- [ ] Liquidez visible en DEX (~$100)
- [ ] Par CGC/WETH activo

### Redes Sociales
- [ ] Twitter/X activo (@cryptogiftdao)
- [ ] Discord creado y con link funcionando
- [ ] Al menos 1-2 posts sobre el proyecto

### Assets
- [ ] Logo 32x32 PNG disponible
- [ ] Logo 200x200 PNG disponible
- [ ] Ambos logos accesibles vía URL o archivo local

### Información del Formulario
- [ ] Toda la información copiada y lista
- [ ] Contract address verificado
- [ ] URLs probadas en navegador
- [ ] Email de contacto preparado

---

## 🎉 CONCLUSIÓN

Siguiendo esta guía paso a paso, tendrás tu token CGC listado en CoinGecko en aproximadamente 2-3 semanas. El proceso es gratuito (excepto la liquidez inicial) y CoinGecko es una plataforma muy respetada en el ecosistema crypto.

**Beneficios del listing en CoinGecko**:
✅ Visibilidad masiva (millones de usuarios)
✅ Tracking de precio en tiempo real
✅ Credibilidad y legitimidad del proyecto
✅ Integración con otras plataformas (wallets, DEX aggregators)
✅ Analytics y métricas del token
✅ Mayor confianza de inversores

**Próximos pasos después de CoinGecko**:
1. Aplicar a CoinMarketCap
2. Incrementar liquidez gradualmente
3. Crear más pares de trading (CGC/USDC, etc.)
4. Aplicar a exchanges centralizados (CEX)
5. Continuar desarrollo del ecosistema DAO

---

## 📞 SOPORTE

Si tienes problemas durante el proceso:

1. **Documentación de CoinGecko**:
   - https://www.coingecko.com/en/methodology
   - https://support.coingecko.com

2. **Documentación del proyecto**:
   - `COINGECKO_LISTING_DOCUMENTATION_COMPLETE.md`
   - `CLAUDE.md`
   - GitHub Issues

3. **Comunidad**:
   - Discord de CryptoGift
   - Twitter/X: @cryptogiftdao

---

**¡MUCHA SUERTE CON EL LISTING! 🚀**

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22

---

**FIN DE LA GUÍA**
