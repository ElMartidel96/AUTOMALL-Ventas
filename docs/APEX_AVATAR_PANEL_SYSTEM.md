# apeX AVATAR PANEL SYSTEM - ARQUITECTURA COMPLETA

## INVESTIGACION ULTRA-DETALLADA: Video Profile + Floating Quick Actions

**Fecha**: 15 Enero 2026
**Autor**: CryptoGift Development Team
**Version**: 1.0 - DESIGN DOCUMENT

---

## TABLA DE CONTENIDOS

1. [Vision General](#1-vision-general)
2. [Analisis de Necesidades del Usuario](#2-analisis-de-necesidades-del-usuario)
3. [Best Practices 2025-2026](#3-best-practices-2025-2026)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Componentes UI/UX](#5-componentes-uiux)
6. [Especificaciones Tecnicas](#6-especificaciones-tecnicas)
7. [Integracion con Sistema de Competencias](#7-integracion-con-sistema-de-competencias)
8. [Roadmap de Implementacion](#8-roadmap-de-implementacion)

---

## 1. VISION GENERAL

### 1.1 El Cambio de Paradigma

```
┌─────────────────────────────────────────────────────────────────┐
│              DE "FOTO DE PERFIL" A "VIDEO DE PERFIL"            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ANTES (Legacy)              →      AHORA (apeX Avatar)        │
│   ┌──────────────┐                   ┌──────────────┐           │
│   │    ┌────┐    │                   │    ┌────┐    │           │
│   │    │ 📷 │    │                   │    │ 🎬 │    │           │
│   │    │    │    │       ═══>        │    │    │    │           │
│   │    └────┘    │                   │    └────┘    │           │
│   │  Foto fija   │                   │ Video vivo   │           │
│   │  96x96px     │                   │ Apple Watch  │           │
│   │  Solo ver    │                   │ + Panel      │           │
│   └──────────────┘                   └──────────────┘           │
│                                                                  │
│   CONCEPTO: "apeX" = Avatar + Personal + Experience             │
│   - Video de perfil hasta 7MB                                   │
│   - Forma Apple Watch (squircle con esquinas ultra-redondeadas) │
│   - Panel flotante emergente con Quick Actions                  │
│   - Animacion de oscilacion (float effect)                      │
│   - Shadow effects premium                                      │
│   - Futura integracion con apeX AI Agent                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Por que es Revolucionario

**Estadisticas de Tendencia (2025-2026):**
- 35%+ de Gen Z prefiere avatares sobre fotos estaticas
- Videos cortos incrementan engagement 3x vs imagenes
- Los usuarios pasan 60% mas tiempo en apps con experiencias interactivas

**Diferenciadores Clave:**
1. **Primero en Web3** con video avatars nativos
2. **Panel contextual** con todas las herramientas en un tap
3. **Persistente pero no invasivo** - sigue al usuario
4. **NFT-ready** - el avatar puede ser tokenizado

---

## 2. ANALISIS DE NECESIDADES DEL USUARIO

### 2.1 Perfil del Usuario Cotidiano

El usuario tipico de CryptoGift entra a la plataforma para:

```
┌─────────────────────────────────────────────────────────────────┐
│         NECESIDADES DIARIAS DEL USUARIO CRYPTOGIFT              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 MONITOREO (Lo primero que quiere ver)                       │
│  ├── Balance actual de CGC tokens                               │
│  ├── Balance de ETH para gas                                    │
│  ├── Valor total del portfolio en USD                           │
│  └── Cambio % en las ultimas 24h                                │
│                                                                  │
│  🎯 APUESTAS/COMPETENCIAS (Sistema principal)                   │
│  ├── Apuestas activas y su estado                               │
│  ├── Probabilidades actualizadas en tiempo real                 │
│  ├── Notificaciones de resultados                               │
│  ├── Disputas pendientes                                        │
│  └── Historial de ganancias/perdidas                            │
│                                                                  │
│  👥 REFERIDOS (Motor de crecimiento)                            │
│  ├── Nuevos usuarios registrados hoy/semana                     │
│  ├── Comisiones ganadas (L1: 10%, L2: 5%, L3: 2.5%)            │
│  ├── Red total de referidos (arbol multinivel)                  │
│  ├── Proximos milestones de bonificacion                        │
│  └── Codigo de referido para compartir                          │
│                                                                  │
│  📤 ENVIOS/GIFTS (Core del producto)                            │
│  ├── Regalos pendientes por reclamar                            │
│  ├── Regalos enviados y su estado                               │
│  ├── Historial de transacciones                                 │
│  └── Quick send a contactos frecuentes                          │
│                                                                  │
│  🔔 NOTIFICACIONES (Awareness)                                  │
│  ├── Alertas de precio CGC                                      │
│  ├── Nuevas propuestas DAO                                      │
│  ├── Mensajes de la comunidad                                   │
│  └── Updates del sistema                                        │
│                                                                  │
│  ⚙️ CONFIGURACION (Menos frecuente)                             │
│  ├── Perfil y video avatar                                      │
│  ├── Preferencias de notificacion                               │
│  ├── Seguridad y wallets conectadas                             │
│  └── Idioma y tema                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Frecuencia de Uso por Feature

| Feature | Frecuencia | Prioridad en Panel |
|---------|------------|-------------------|
| Ver balance | Cada visita | **#1 - CRITICO** |
| Apuestas activas | Diario | **#2 - ALTO** |
| Nuevos referidos | Diario | **#3 - ALTO** |
| Comisiones | Semanal | #4 - MEDIO |
| Enviar regalo | Semanal | #5 - MEDIO |
| Perfil/Config | Mensual | #6 - BAJO |

### 2.3 User Journey con apeX Panel

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY CON APEX PANEL                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ENTRADA A LA APP                                            │
│     │                                                            │
│     ├── Usuario ve su apeX Avatar flotando                      │
│     │   (Video/Foto con forma Apple Watch, oscilando)           │
│     │                                                            │
│     └── El avatar muestra badge de notificaciones               │
│         (ej: "3" si hay 3 alerts pendientes)                    │
│                                                                  │
│  2. TAP EN APEX AVATAR                                          │
│     │                                                            │
│     └── Se expande panel emergente con:                         │
│         ┌─────────────────────────────────────────┐             │
│         │  ┌──────┐  Rafael Gonzalez              │             │
│         │  │ 🎬   │  0x1234...5678                │             │
│         │  └──────┘  ✅ Verified Holder           │             │
│         ├─────────────────────────────────────────┤             │
│         │  💰 12,450 CGC      📈 +5.2%           │             │
│         │  ⛽ 0.0034 ETH      ≈ $2,340 USD       │             │
│         ├─────────────────────────────────────────┤             │
│         │  🎯 3 apuestas activas   [Ver >]       │             │
│         │  👥 +5 nuevos referidos  [Ver >]       │             │
│         │  💸 45 CGC pendientes    [Claim]       │             │
│         ├─────────────────────────────────────────┤             │
│         │  [🎁 Enviar] [📊 Dashboard] [⚙️ Config]│             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│  3. ACCIONES RAPIDAS (Un tap desde el panel)                    │
│     │                                                            │
│     ├── "Ver apuestas" → Modal con detalles                     │
│     ├── "Ver referidos" → Modal con red                         │
│     ├── "Claim" → Ejecuta claim inline                          │
│     ├── "Enviar" → Quick send modal                             │
│     ├── "Dashboard" → Navega a /dashboard                       │
│     └── "Config" → Navega a /settings                           │
│                                                                  │
│  4. INTERACCION CONTINUA                                        │
│     │                                                            │
│     ├── El panel se puede minimizar a avatar                    │
│     ├── El avatar sigue al scroll (sticky mode)                 │
│     ├── Notificaciones actualizan badge en tiempo real          │
│     └── Un swipe dismisses el panel                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. BEST PRACTICES 2025-2026

### 3.1 Floating Panels - Lecciones de Figma

**Fuente**: [Figma's Floating Panels UX Lesson](https://bitskingdom.com/blog/figma-floating-panels-ux-lesson/)

| Aspecto | Floating Panels | Fixed Panels | Nuestra Solucion |
|---------|-----------------|--------------|------------------|
| Espacio | Puede desperdiciar | Mas eficiente | Hibrido: Avatar fijo, panel expandible |
| Claridad | Puede confundir | Limites claros | Panel con bordes definidos + blur backdrop |
| Flexibilidad | Alta | Media | Avatar movil, panel contextual |
| Clutter visual | Riesgo alto | Bajo | Progressive disclosure |

**Conclusion**: Usamos un **hibrido** - el avatar es flotante/sticky, pero el panel expandido tiene bordes claros y blur backdrop para separarlo del contenido.

### 3.2 Profile Panel Best Practices

**Fuente**: [Medium - UX Profile Pages Guide](https://kamushken.medium.com/how-to-design-ux-friendly-user-profile-pages-a-tactical-guide-for-designers-and-developers-0eb98d3d5c70)

```
┌─────────────────────────────────────────────────────────────────┐
│              PROFILE PANEL - BEST PRACTICES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Avatar minimo 96x96px (nosotros: 120x120px para calidad)    │
│  ✅ Edit button top-right (esperado por usuarios)               │
│  ✅ Bios cortos con emojis/hashtags                             │
│  ✅ Primary actions como FABs (Floating Action Buttons)         │
│  ✅ Progressive disclosure - "Ver mas" para info secundaria     │
│  ✅ Role-based elements visibles (Holder, Voter, Admin)         │
│                                                                  │
│  ❌ EVITAR:                                                     │
│  - Formularios largos en el panel                               │
│  - Demasiadas opciones visibles                                 │
│  - Texto pequeno (minimo 14px)                                  │
│  - Tap targets menores a 44x44px                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Apple Watch UI Patterns

**Fuente**: [Apple Human Interface Guidelines - watchOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)

```
┌─────────────────────────────────────────────────────────────────┐
│              APPLE WATCH - UI PATTERNS APLICABLES                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FORMA "SQUIRCLE" (Super-ellipse):                              │
│  ┌────────────────────┐                                          │
│  │   ╭──────────────╮ │  Esquinas: 22% del ancho               │
│  │   │              │ │  Border-radius: ~44px para 200px width │
│  │   │     🎬       │ │  Aspect ratio: 1:1 (cuadrado perfecto) │
│  │   │              │ │                                         │
│  │   ╰──────────────╯ │  CSS: border-radius: 22%;              │
│  └────────────────────┘        o usar clip-path para precision  │
│                                                                  │
│  COMPLICACIONES (Quick glance info):                            │
│  - Numero en esquina (badge de notificaciones)                  │
│  - Indicador de estado (punto verde = online)                   │
│  - Progress ring (para completar perfil, etc.)                  │
│                                                                  │
│  INTERACCIONES:                                                  │
│  - Tap: Expandir panel                                          │
│  - Long press: Opciones contextuales                            │
│  - Swipe: Dismiss panel                                         │
│  - Double tap: Fullscreen video                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Crypto Wallet UX 2025

**Fuentes**:
- [Cryptowisser - Wallet UX Guide 2025](https://www.cryptowisser.com/guides/crypto-wallet-ux-guide-2025/)
- [Viartisan - e-Wallet Design Guide](https://viartisan.com/2025/05/26/e-wallet-ui-ux-design/)

```
TENDENCIAS CLAVE:
├── Gasless UX: Ocultar complejidad de gas fees
├── Passkeys: Reemplazar seed phrases con biometricos
├── Chain abstraction: Usuario no necesita saber que chain usa
├── Smart recovery: Backup sin 24 palabras
└── Real-time feedback: Confirmaciones instantaneas

APLICACION EN APEX PANEL:
├── Balance siempre visible, sin clicks extra
├── Claim con un tap (gasless via relayer)
├── Status indicators claros (pending, confirmed)
├── Notificaciones push para transacciones
└── Quick actions sin necesidad de navegar
```

### 3.5 Web3 Social & Video Avatars

**Fuentes**:
- [Coinbound - Top Web3 Social Platforms 2026](https://coinbound.io/top-web3-social-media-platforms/)
- [Alchemy - Web3 Social Dapps](https://www.alchemy.com/dapps/best/web3-social-media-dapps)

```
PLATAFORMAS DE REFERENCIA:
├── Lens Protocol: Social graph descentralizado
├── Farcaster: Protocolo-first, alta senal
├── Tape: Video-sharing en Lens (ejemplo de video social)
├── Zepeto: Avatares animados con face recognition
└── Revel: NFTs de media personal

TENDENCIA 2026:
"Los avatares seran AI-enhanced, interoperables entre
Web3, gaming y metaverse. El avatar ES la identidad."
```

### 3.6 Sticky Floating Video Implementation

**Fuentes**:
- [Envato Tuts+ - Sticky Floating Video](https://webdesign.tutsplus.com/how-to-create-a-sticky-floating-video-on-page-scroll--cms-28342t)
- [GitHub - Sticky Video Tutorial](https://github.com/tutsplus/how-to-create-a-sticky-floating-video-on-page-scroll)

```javascript
// LOGICA CLAVE PARA STICKY VIDEO AVATAR
// 1. Check if video/avatar is in viewport
// 2. If not in viewport AND user scrolled down: make sticky
// 3. Position in corner (bottom-right for thumb zone)
// 4. Add float animation
// 5. On tap: expand panel

// Ya implementado en VideoCarousel.tsx - REUSAR LOGICA
const isSticky = !isInViewport(avatarRef) && scrollY > avatarTop;
```

---

## 4. ARQUITECTURA DEL SISTEMA

### 4.1 Modelo Conceptual

```
┌─────────────────────────────────────────────────────────────────┐
│               APEX AVATAR PANEL - ARQUITECTURA                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    APEX AVATAR COMPONENT                     ││
│  │  ┌───────────────┐      ┌────────────────────────────────┐  ││
│  │  │  Video/Image  │ tap  │      FLOATING PANEL            │  ││
│  │  │  ┌─────────┐  │─────►│  ┌────────────────────────┐    │  ││
│  │  │  │  🎬     │  │      │  │ Header: Name + Balance │    │  ││
│  │  │  │         │  │      │  ├────────────────────────┤    │  ││
│  │  │  └─────────┘  │      │  │ Quick Stats           │    │  ││
│  │  │   120x120px   │      │  │ - Apuestas activas    │    │  ││
│  │  │   Squircle    │      │  │ - Nuevos referidos    │    │  ││
│  │  │   Float anim  │      │  │ - Comisiones pending  │    │  ││
│  │  └───────────────┘      │  ├────────────────────────┤    │  ││
│  │        │                │  │ Quick Actions (FABs)  │    │  ││
│  │        │ scroll         │  │ [Send] [Dash] [Config]│    │  ││
│  │        ▼                │  └────────────────────────┘    │  ││
│  │  ┌───────────────┐      └────────────────────────────────┘  ││
│  │  │ STICKY MODE   │                                          ││
│  │  │ - Mini avatar │                                          ││
│  │  │ - Badge count │                                          ││
│  │  │ - Float anim  │                                          ││
│  │  └───────────────┘                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  DATA SOURCES:                                                   │
│  ├── User Profile (Supabase)                                    │
│  ├── Token Balance (On-chain via wagmi)                         │
│  ├── Apuestas/Competencias (competition_service)                │
│  ├── Referidos (referral_service)                               │
│  ├── Notificaciones (notification_service)                      │
│  └── Gifts pendientes (gift_service)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Componentes Principales

```typescript
// ESTRUCTURA DE COMPONENTES

src/components/apex/
├── ApexAvatar.tsx              // Contenedor principal
│   ├── AvatarMedia.tsx         // Video/Image con forma Apple Watch
│   ├── AvatarBadge.tsx         // Badge de notificaciones
│   └── FloatAnimation.tsx      // Animacion de oscilacion
│
├── ApexPanel.tsx               // Panel expandido
│   ├── PanelHeader.tsx         // Nombre + Balance + Edit
│   ├── QuickStats.tsx          // Stats con links
│   │   ├── ActiveBetsWidget.tsx
│   │   ├── ReferralsWidget.tsx
│   │   └── PendingRewardsWidget.tsx
│   └── QuickActions.tsx        // FABs de acciones rapidas
│
├── hooks/
│   ├── useApexData.ts          // Agregador de datos
│   ├── useApexPosition.ts      // Logica de posicionamiento
│   └── useApexAnimation.ts     // Control de animaciones
│
└── styles/
    └── apex-animations.css     // Keyframes de float, etc.
```

### 4.3 Estado del Sistema

```typescript
interface ApexState {
  // Visibilidad
  isExpanded: boolean;
  isSticky: boolean;
  isMinimized: boolean;

  // Datos del usuario
  user: {
    name: string;
    address: string;
    avatarUrl: string;       // URL de imagen
    videoUrl?: string;       // URL de video (hasta 7MB)
    role: 'visitor' | 'holder' | 'voter' | 'admin';
  };

  // Balances
  balances: {
    cgc: bigint;
    eth: bigint;
    usdValue: number;
    change24h: number;
  };

  // Quick Stats
  stats: {
    activeBets: number;
    newReferrals: number;
    pendingRewards: bigint;
    pendingGifts: number;
  };

  // Notificaciones
  notifications: {
    unreadCount: number;
    items: Notification[];
  };
}
```

---

## 5. COMPONENTES UI/UX

### 5.1 Avatar Media (Video/Image)

```
┌─────────────────────────────────────────────────────────────────┐
│              AVATAR MEDIA - ESPECIFICACIONES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DIMENSIONES:                                                    │
│  ├── Normal mode: 120x120px                                     │
│  ├── Sticky mode: 60x60px (mini)                                │
│  └── Expanded (en panel): 96x96px                               │
│                                                                  │
│  FORMA (Squircle Apple Watch):                                  │
│  ├── border-radius: 22% (o 26px para 120px)                     │
│  ├── Alternativa: clip-path con superellipse                    │
│  └── Shadow: 0 8px 32px rgba(0,0,0,0.25)                        │
│                                                                  │
│  VIDEO SPECS:                                                    │
│  ├── Max size: 7MB                                              │
│  ├── Formatos: MP4, WebM, MOV                                   │
│  ├── Resolucion recomendada: 480x480px                          │
│  ├── Duracion: 3-10 segundos (loop)                             │
│  ├── Autoplay: muted por defecto                                │
│  └── Codec: H.264 para maxima compatibilidad                    │
│                                                                  │
│  FALLBACK:                                                       │
│  ├── Si video falla: mostrar imagen estatica                    │
│  ├── Si imagen falla: mostrar iniciales con gradiente           │
│  └── Default: icono de usuario generico                         │
│                                                                  │
│  CSS EXAMPLE:                                                    │
│  .apex-avatar {                                                 │
│    width: 120px;                                                │
│    height: 120px;                                               │
│    border-radius: 22%;                                          │
│    overflow: hidden;                                            │
│    box-shadow: 0 8px 32px rgba(0,0,0,0.25),                    │
│                0 2px 8px rgba(0,0,0,0.15);                     │
│    border: 3px solid rgba(255,255,255,0.2);                    │
│    animation: apexFloat 4s ease-in-out infinite;               │
│  }                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Float Animation

```css
/* ANIMACION DE OSCILACION - SIMILAR A VIDEO CAROUSEL */

@keyframes apexFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes apexFloatSticky {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.02);
  }
}

@keyframes apexPulse {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 8px 48px rgba(139, 92, 246, 0.5);
  }
}

.apex-avatar {
  animation: apexFloat 4s ease-in-out infinite;
}

.apex-avatar.sticky {
  animation: apexFloatSticky 3s ease-in-out infinite;
}

.apex-avatar.has-notifications {
  animation: apexFloat 4s ease-in-out infinite,
             apexPulse 2s ease-in-out infinite;
}
```

### 5.3 Panel Expandido

```
┌─────────────────────────────────────────────────────────────────┐
│              PANEL EXPANDIDO - LAYOUT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  HEADER                                        [✕] [⚙️]   │  │
│  │  ┌────────┐  Rafael Gonzalez                              │  │
│  │  │  🎬    │  0x1234...5678  [📋]                          │  │
│  │  │  ░░░░  │  ✅ Diamond Holder                            │  │
│  │  └────────┘                                               │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  BALANCE SECTION                                          │  │
│  │  ┌─────────────────────┬─────────────────────┐            │  │
│  │  │  💰 12,450 CGC      │  📈 +5.2% (24h)     │            │  │
│  │  │  ≈ $2,340 USD       │  ⛽ 0.0034 ETH      │            │  │
│  │  └─────────────────────┴─────────────────────┘            │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  QUICK STATS                                              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  🎯 3 apuestas activas              [Ver detalles >]│  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  👥 +5 nuevos referidos esta semana [Ver red >]     │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  💸 45 CGC en comisiones pendientes [Claim Now]     │  │  │
│  │  ├─────────────────────────────────────────────────────┤  │  │
│  │  │  🎁 2 regalos pendientes por reclamar [Ver >]       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  QUICK ACTIONS (FABs)                                     │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │  🎁     │  │  📊     │  │  🏆     │  │  🤖     │      │  │
│  │  │ Enviar  │  │Dashboard│  │Compete  │  │  apeX   │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DIMENSIONES PANEL:                                              │
│  ├── Width: 340px (mobile: 100% - 32px margin)                  │
│  ├── Max height: 80vh                                           │
│  ├── Border radius: 24px                                        │
│  └── Backdrop blur: 20px                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Responsive Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│              RESPONSIVE BEHAVIOR                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MOBILE (< 768px):                                              │
│  ├── Avatar: bottom-right corner, 60x60px sticky                │
│  ├── Panel: full width modal from bottom (drawer)               │
│  ├── Swipe down to dismiss                                      │
│  └── Quick actions: horizontal scroll if needed                 │
│                                                                  │
│  TABLET (768px - 1024px):                                       │
│  ├── Avatar: bottom-right corner, 80x80px                       │
│  ├── Panel: 360px width, floating right                         │
│  └── Click outside to dismiss                                   │
│                                                                  │
│  DESKTOP (> 1024px):                                            │
│  ├── Avatar: puede estar en navbar O flotante                   │
│  ├── Panel: 400px width, floating                               │
│  ├── Keyboard shortcut: 'P' to toggle panel                     │
│  └── Hover preview of stats                                     │
│                                                                  │
│  THUMB ZONE OPTIMIZATION:                                        │
│  ├── Avatar siempre en zona alcanzable con pulgar               │
│  ├── Quick Actions en mitad inferior del panel                  │
│  └── Close button accesible (top-right O swipe)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. ESPECIFICACIONES TECNICAS

### 6.1 Video Upload & Processing

```typescript
// VIDEO UPLOAD SERVICE

interface VideoUploadConfig {
  maxSizeBytes: 7 * 1024 * 1024;  // 7MB
  allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime'];
  maxDuration: 10;  // seconds
  outputFormat: 'mp4';
  outputCodec: 'h264';
  outputResolution: { width: 480, height: 480 };
  thumbnailResolution: { width: 120, height: 120 };
}

// FLUJO DE UPLOAD:
// 1. Client: Selecciona video
// 2. Client: Valida formato y tamano
// 3. Client: Genera preview local
// 4. Server: Recibe y procesa con FFmpeg
// 5. Server: Genera thumbnail
// 6. Server: Sube a Mux (o storage alternativo)
// 7. Server: Guarda URLs en perfil de usuario
// 8. Client: Actualiza avatar con nuevo video
```

### 6.2 Storage Options

```
┌─────────────────────────────────────────────────────────────────┐
│              STORAGE OPTIONS PARA VIDEO AVATARS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPCION 1: MUX (Recomendado - ya integrado)                     │
│  ├── Pro: Ya tenemos integracion, CDN global, adaptive          │
│  ├── Con: Costo por minuto de video                             │
│  └── Uso: Para videos de alta calidad                           │
│                                                                  │
│  OPCION 2: CLOUDFLARE R2 + STREAM                               │
│  ├── Pro: Mas economico, buen performance                       │
│  ├── Con: Requiere setup adicional                              │
│  └── Uso: Para gran volumen de usuarios                         │
│                                                                  │
│  OPCION 3: IPFS + PINATA                                        │
│  ├── Pro: Descentralizado, NFT-ready                            │
│  ├── Con: Latencia variable                                     │
│  └── Uso: Para avatares NFT tokenizables                        │
│                                                                  │
│  OPCION 4: SUPABASE STORAGE                                     │
│  ├── Pro: Ya integrado, simple                                  │
│  ├── Con: No optimizado para video streaming                    │
│  └── Uso: Para fallback de imagenes                             │
│                                                                  │
│  DECISION: Hibrido MUX + Supabase                               │
│  - Videos: Mux (streaming optimizado)                           │
│  - Imagenes/Thumbnails: Supabase Storage                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Data Fetching Strategy

```typescript
// HOOK PRINCIPAL DE DATOS

function useApexData() {
  const { address } = useAccount();

  // Datos on-chain (refetch cada 30s)
  const { data: balances } = useBalances(address, {
    refetchInterval: 30000,
  });

  // Datos off-chain (Supabase real-time)
  const { data: profile } = useUserProfile(address);
  const { data: stats } = useUserStats(address);
  const { data: notifications } = useNotifications(address);

  // Competencias activas
  const { data: activeBets } = useActiveBets(address);

  // Referidos
  const { data: referrals } = useReferralStats(address);

  // Rewards pendientes
  const { data: pendingRewards } = usePendingRewards(address);

  return {
    isLoading,
    balances,
    profile,
    stats: {
      activeBets: activeBets?.length ?? 0,
      newReferrals: referrals?.newThisWeek ?? 0,
      pendingRewards: pendingRewards?.total ?? 0n,
      pendingGifts: stats?.pendingGifts ?? 0,
    },
    notifications,
  };
}
```

### 6.4 Real-time Updates

```typescript
// SUPABASE REAL-TIME SUBSCRIPTIONS

function useApexRealtime(address: string) {
  useEffect(() => {
    const channel = supabase
      .channel('apex-updates')
      // Nuevos referidos
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'referrals',
        filter: `referrer_address=eq.${address}`,
      }, (payload) => {
        // Incrementar contador + notificacion
        updateReferralCount(payload.new);
        showToast('Nuevo referido!');
      })
      // Nuevas comisiones
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'referral_rewards',
        filter: `recipient_address=eq.${address}`,
      }, (payload) => {
        updatePendingRewards(payload.new);
        showToast(`+${payload.new.amount} CGC en comisiones`);
      })
      // Resultados de apuestas
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'competitions',
        filter: `participants.cs.{"address":"${address}"}`,
      }, (payload) => {
        if (payload.new.status === 'RESOLVED') {
          updateBetResults(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);
}
```

---

## 7. INTEGRACION CON SISTEMA DE COMPETENCIAS

### 7.1 Quick Stats Widget para Apuestas

```typescript
interface ActiveBetsWidget {
  // Datos mostrados en el panel
  total: number;           // Total apuestas activas
  totalStaked: bigint;     // Total apostado (en tokens)
  potentialWin: bigint;    // Ganancia potencial maxima

  // Top 3 apuestas para preview
  topBets: {
    id: string;
    title: string;
    outcome: string;       // Mi prediccion
    probability: number;   // Probabilidad actual
    stake: bigint;
    potentialReturn: bigint;
    status: 'active' | 'pending_resolution' | 'disputed';
  }[];

  // Acciones
  onViewAll: () => void;   // Navegar a /competencias
  onQuickBet: () => void;  // Abrir modal de apuesta rapida
}
```

### 7.2 Referidos Widget con Red

```typescript
interface ReferralsWidget {
  // Resumen
  totalReferrals: number;      // Total historico
  newThisWeek: number;         // Nuevos esta semana
  activeReferrals: number;     // Con actividad reciente

  // Comisiones
  pendingRewards: bigint;      // Por reclamar
  totalEarned: bigint;         // Historico ganado

  // Tier actual
  currentTier: 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  nextTierProgress: number;    // 0-100%

  // Quick actions
  onClaim: () => Promise<void>;  // Claim inline
  onShare: () => void;           // Compartir codigo
  onViewNetwork: () => void;     // Ver arbol completo
}
```

### 7.3 Flujo de Claim Inline

```
┌─────────────────────────────────────────────────────────────────┐
│              CLAIM INLINE - SIN SALIR DEL PANEL                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ESTADO INICIAL:                                                 │
│  ┌─────────────────────────────────────────────────┐            │
│  │  💸 45 CGC en comisiones pendientes  [Claim]   │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  CLICK EN CLAIM:                                                 │
│  ┌─────────────────────────────────────────────────┐            │
│  │  💸 45 CGC en comisiones             [Claiming │            │
│  │     ⏳ Procesando...                  ░░░░░░░]  │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  EXITO:                                                          │
│  ┌─────────────────────────────────────────────────┐            │
│  │  ✅ 45 CGC reclamados!                         │            │
│  │     Tu nuevo balance: 12,495 CGC               │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  NOTA: Usamos gasless transactions via relayer                  │
│  El usuario NO necesita aprobar en wallet para claims           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. ROADMAP DE IMPLEMENTACION

### Fase 1: Avatar Base (1-2 semanas)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: AVATAR BASE                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEMANA 1:                                                       │
│  □ Crear componente ApexAvatar con forma Apple Watch            │
│  □ Implementar animacion de oscilacion (float)                  │
│  □ Soporte para imagen estatica (fallback)                      │
│  □ Badge de notificaciones                                      │
│  □ Integrar en Navbar existente                                 │
│                                                                  │
│  SEMANA 2:                                                       │
│  □ Logica de sticky positioning                                 │
│  □ Responsive behavior (mobile/tablet/desktop)                  │
│  □ Transiciones suaves expand/collapse                          │
│  □ Tests de accesibilidad                                       │
│                                                                  │
│  DELIVERABLE: Avatar flotante funcional con imagen              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 2: Panel Expandido (2-3 semanas)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 2: PANEL EXPANDIDO                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEMANA 3-4:                                                     │
│  □ Crear componente ApexPanel                                   │
│  □ Header con perfil y balance                                  │
│  □ Quick Stats widgets (apuestas, referidos, rewards)           │
│  □ Quick Actions (FABs)                                         │
│  □ Animaciones de apertura/cierre                               │
│                                                                  │
│  SEMANA 5:                                                       │
│  □ Integracion con datos reales (hooks)                         │
│  □ Real-time updates via Supabase                               │
│  □ Claim inline functionality                                   │
│  □ Links a secciones detalladas                                 │
│                                                                  │
│  DELIVERABLE: Panel completo con datos en vivo                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 3: Video Avatars (2-3 semanas)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 3: VIDEO AVATARS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEMANA 6-7:                                                     │
│  □ Video upload UI en settings                                  │
│  □ Backend: validacion y procesamiento                          │
│  □ Integracion con Mux para hosting                             │
│  □ Thumbnail generation                                         │
│  □ Preview antes de guardar                                     │
│                                                                  │
│  SEMANA 8:                                                       │
│  □ Video playback en avatar (loop, muted)                       │
│  □ Fallback graceful a imagen                                   │
│  □ Optimizacion de performance                                  │
│  □ Mobile: pausar video cuando no visible                       │
│                                                                  │
│  DELIVERABLE: Video avatars completos                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 4: Integracion Competencias (2 semanas)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 4: INTEGRACION COMPETENCIAS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEMANA 9:                                                       │
│  □ Widget de apuestas activas                                   │
│  □ Notificaciones de resultados                                 │
│  □ Link directo a crear apuesta                                 │
│  □ Preview de probabilidades                                    │
│                                                                  │
│  SEMANA 10:                                                      │
│  □ Widget de referidos mejorado                                 │
│  □ Visualizacion de tier y progreso                             │
│  □ Quick share functionality                                    │
│  □ Historial de comisiones                                      │
│                                                                  │
│  DELIVERABLE: Panel integrado con competencias                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 5: apeX AI Integration (Futuro)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 5: APEX AI INTEGRATION (FUTURO)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  □ Boton de apeX en Quick Actions                               │
│  □ Mini-chat inline en el panel                                 │
│  □ Sugerencias contextuales de apeX                             │
│  □ Voice commands para acciones rapidas                         │
│  □ Personalizacion del avatar via AI                            │
│                                                                  │
│  VISION: El avatar apeX se convierte en tu asistente personal   │
│  que conoce tu historial, tus preferencias, y te guia           │
│  proactivamente en la plataforma.                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. METRICAS DE EXITO

```
┌─────────────────────────────────────────────────────────────────┐
│              METRICAS DE EXITO                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ENGAGEMENT:                                                     │
│  ├── % usuarios que abren el panel diariamente                  │
│  ├── Tiempo promedio en panel                                   │
│  └── Acciones completadas desde panel vs navegacion normal      │
│                                                                  │
│  CONVERSION:                                                     │
│  ├── % de claims hechos desde panel                             │
│  ├── % de shares de codigo referido desde panel                 │
│  └── Nuevas apuestas iniciadas desde panel                      │
│                                                                  │
│  RETENCION:                                                      │
│  ├── DAU/MAU ratio con/sin panel                                │
│  ├── Churn rate por segmento                                    │
│  └── Feature adoption rate                                      │
│                                                                  │
│  DIFERENCIACION:                                                 │
│  ├── % usuarios con video avatar (vs imagen)                    │
│  ├── Menciones en redes sociales                                │
│  └── Feedback cualitativo de usuarios                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. REFERENCIAS

### Best Practices & Guidelines
- [Apple Human Interface Guidelines - watchOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)
- [Figma Floating Panels UX Lesson](https://bitskingdom.com/blog/figma-floating-panels-ux-lesson/)
- [Medium - UX Profile Pages Guide](https://kamushken.medium.com/how-to-design-ux-friendly-user-profile-pages-a-tactical-guide-for-designers-and-developers-0eb98d3d5c70)
- [Cryptowisser - Wallet UX Guide 2025](https://www.cryptowisser.com/guides/crypto-wallet-ux-guide-2025/)
- [Viartisan - e-Wallet Design Guide](https://viartisan.com/2025/05/26/e-wallet-ui-ux-design/)

### Web3 Social & Video
- [Coinbound - Top Web3 Social Platforms 2026](https://coinbound.io/top-web3-social-media-platforms/)
- [Alchemy - Web3 Social Dapps](https://www.alchemy.com/dapps/best/web3-social-media-dapps)

### Implementation Tutorials
- [Envato Tuts+ - Sticky Floating Video](https://webdesign.tutsplus.com/how-to-create-a-sticky-floating-video-on-page-scroll--cms-28342t)
- [GitHub - Sticky Video Tutorial](https://github.com/tutsplus/how-to-create-a-sticky-floating-video-on-page-scroll)

### Documentacion Interna
- [COMPETENCIAS_ARQUITECTURA_COMPLETA.md](../cryptogift-wallets/COMPETENCIAS_ARQUITECTURA_COMPLETA.md)
- [VideoCarousel.tsx](../components/landing/VideoCarousel.tsx) - Referencia de implementacion sticky video

---

**Este documento representa el plan completo para el sistema apeX Avatar Panel. Es un proyecto ambicioso que establecera un nuevo estandar en Web3 social UX.**

---

*Made by mbxarts.com The Moon in a Box property*
*Co-Author: Godez22*
