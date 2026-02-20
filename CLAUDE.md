# Autos MALL - Development Guide

## Project Overview
Autos MALL is an AI-powered car sales platform for independent sellers in Houston, TX. Each seller gets a professional subdomain (sellername.autosmall.com), AI sales assistant, CRM, and multi-channel communication tools.

**Origin**: This codebase is built on top of CryptoGift-Wallets-DAO infrastructure. All Web3/blockchain functionality is preserved but hidden behind feature flags. The two projects share the same technical foundation ("mismo laboratorio") but must NEVER be mixed publicly.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4 + glass morphism design system
- **Auth**: Thirdweb v5 inAppWallet (social login: Google, Apple, email, passkey)
- **Database**: Supabase (PostgreSQL)
- **i18n**: next-intl (EN/ES), locale files in `src/locales/`
- **Theming**: next-themes (dark/light mode with `class` strategy)
- **Package Manager**: pnpm

## Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `am-blue` | `#1B3A6B` | Primary - headers, navbar |
| `am-blue-light` | `#2B5EA7` | Hover states, links |
| `am-orange` | `#E8832A` | Accent - CTAs, highlights |
| `am-orange-light` | `#F5A623` | Hover CTAs, badges |
| `am-green` | `#2D8F4E` | Success, confirmations |
| `am-dark` | `#0D1B2A` | Dark mode background |

## Feature Flags (`lib/config/features.ts`)
All Web3/blockchain UI is hidden behind feature flags. **NEVER expose crypto content to end users.**

| Flag | Default | Purpose |
|------|---------|---------|
| `FEATURE_WEB3_VISIBLE` | false | Hides all blockchain/token UI |
| `FEATURE_WALLET_LOGIN` | false | Hides crypto wallet login options |
| `FEATURE_DAO_GOVERNANCE` | false | Hides governance system |
| `FEATURE_CGC_TOKEN` | false | Hides CGC token references |
| `FEATURE_SELLER_SUBDOMAINS` | false | Seller subdomain system (future) |
| `FEATURE_AI_SALES_AGENT` | false | AI sales assistant (future) |

## Critical Rules
1. **Zero crypto exposure**: No user-facing text should mention blockchain, wallets, tokens, DAO, or CGC. The platform must appear as a pure car sales tool.
2. **Same codebase**: The underlying Web3 infrastructure is preserved but hidden. Feature flags control visibility.
3. **i18n always**: All user-facing text uses `useTranslations()` - never hardcode strings.
4. **Glass morphism**: Use `glass-panel`, `glass-card`, `glass-button` classes from the design system.
5. **Respond in Spanish**: Always respond to the user in Spanish.

## Key Directories
```
app/                    # Next.js pages (App Router)
  page.tsx              # Dealer home (customer-facing welcome)
  landing/page.tsx      # B2B platform landing (future: landing.autosmall.com)
  dashboard/            # Seller dashboard
  inventory/            # Vehicle inventory (placeholder)
  clients/              # CRM (placeholder)
  referrals/            # Referral network
  profile/              # Seller profile
  docs/                 # Reserved for future lab collaboration (NOT dealer UI)
  admin/                # Admin panel (hidden)
  agent/                # AI agent (hidden, future)
components/
  layout/               # Navbar, Footer
  thirdweb/             # ConnectButtonDAO (social login)
  dashboard/            # Dashboard panels (crypto - hidden)
  ui/                   # Reusable UI (shadcn-style)
lib/
  config/features.ts    # Feature flags
  thirdweb/             # Auth provider & hooks
  web3/                 # Blockchain hooks (hidden)
  supabase/             # Database client
src/locales/            # en.json, es.json translations
public/                 # Static assets
  logo-automall.png     # Hero logo (optimized 84KB, 1000x552)
  logo-automall-nav.png # Navbar logo (240x132)
  logo-automall-footer.png # Footer logo (160x88)
  brands/               # Car brand logos (200x200 transparent PNGs)
  og-automall.png       # OpenGraph image (1200x630, am-dark bg)
```

## Common Patterns
- **Auth check**: `const { isConnected, address } = useAccount();`
- **Translations**: `const t = useTranslations('namespace');`
- **Feature gate**: `import { FEATURE_WEB3_VISIBLE } from '@/lib/config/features';`
- **Glass components**: `<div className="glass-panel p-6">...</div>`

## i18n Namespaces
| Namespace | Usage |
|-----------|-------|
| `dealer` | Dealer home page (hero, search, brands, why, featured, testimonials, CTA) |
| `landing` | B2B platform landing page content |
| `navigation` | Nav links, menus |
| `dashboard` | Seller dashboard |
| `footer` | Footer content |
| `common` | Shared buttons, labels |
| `wallet` | Auth/connection (internal) |
| `referrals` | Referral system |

## Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript check
```

## Commit Rules
- **Attribution**: Made by mbxarts.com The Moon in a Box property. Co-Author: Godez22
- **No AI references**: Never include Claude, GPT, AI co-author, or similar in commits
- **Language**: Commit messages in English, professional format

## Verification Protocol (PERFECTO Y ROBUSTO)
After any change:
1. `pnpm build` must pass
2. Zero visible mentions of CryptoGift/CGC/DAO/blockchain/wallet
3. Logo and colors correct (am-blue/am-orange/am-green)
4. Dark/light mode works
5. i18n EN/ES works
6. Mobile responsive

## Branding Assets

### Logo Source
- **Source file**: `AutoMALL.png` (root, 2784x1536, ~2.7MB) - DO NOT deploy directly
- **All variants** are generated from this source using `sharp` (Node.js)
- Variants are stored in `public/` and must be whitelisted in `.vercelignore`

### Logo Variants
| File | Size | Dimensions | Used In |
|------|------|------------|---------|
| `public/logo-automall.png` | 84KB | 1000x552 | Hero (page.tsx), ConnectButtonDAO, landing |
| `public/logo-automall-nav.png` | 10KB | 240x132 | Navbar |
| `public/logo-automall-footer.png` | 6KB | 160x88 | Footer |
| `public/og-automall.png` | 335KB | 1200x630 | OpenGraph / social sharing |
| `app/favicon.ico` | 2.4KB | 32x32 | Browser tab favicon |
| `app/icon.png` | 44KB | 192x192 | Next.js app icon |
| `public/favicon-32x32.png` | 2.4KB | 32x32 | Metadata favicon |
| `public/icon-192x192.png` | 44KB | 192x192 | PWA icon |
| `public/icon-512x512.png` | 248KB | 512x512 | PWA icon large |
| `public/apple-touch-icon.png` | 39KB | 180x180 | iOS home screen |

### Car Brand Logos (`public/brands/`)

**Current brands** (9): Toyota, Ford, Chevrolet, Nissan, GMC, Dodge, Jeep, Mazda, Mercedes

**How to add a new brand logo:**
1. Obtain the logo image (JPG/PNG, any size, ideally on solid black or white background)
2. Place the source file in `AutosMall/AutosMall/` folder (or provide directly)
3. Process with sharp to remove background and normalize to 200x200 transparent PNG:
```javascript
// Background removal: pixel-level threshold
// For BLACK backgrounds: R,G,B all < 30 → make transparent
// For WHITE backgrounds: R,G,B all > 240 → make transparent
const sharp = require('sharp');
const img = sharp('source-logo.jpg')
  .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .raw().toBuffer({ resolveWithObject: true });
// Then iterate pixels: if (r < 30 && g < 30 && b < 30) alpha = 0;
// Write back with sharp from raw RGBA buffer
```
4. Save as `public/brands/{brand-name-lowercase}.png`
5. Add to `brandLogos` array in `app/page.tsx`
6. **CRITICAL**: Add `!public/brands/{brand-name}.png` to `.vercelignore`
7. Verify with `pnpm build`

**Pending brands** (to add when logos are available): Honda, Hyundai, Kia, BMW

### .vercelignore Image Rules (CRITICAL)
The `.vercelignore` file blocks ALL images by default (`*.png`, `*.ico`, `*.jpg`, etc.).
Every image that must be deployed needs an explicit `!path/to/file.ext` exception.
**If you add ANY new image to `public/`, you MUST whitelist it in `.vercelignore`.**

---

## PROBLEMAS CONOCIDOS
_(Ninguno actualmente)_

---

## PROBLEMAS RESUELTOS

### PROBLEMA: Logos invisibles en produccion (Vercel)
- **Sintoma**: Logo no aparece en navbar (espacio vacio), hero muestra alt text "Autos MALL" en vez de imagen, favicon muestra triangulo de Vercel
- **Ubicacion**: `.vercelignore` (lineas 26-31)
- **Intentos fallidos**: Se regeneraron los logos multiples veces pensando que eran archivos corruptos o mal dimensionados. Se verifico visualmente que los PNGs eran validos. El problema no era el contenido de los archivos.
- **Causa raiz**: `.vercelignore` tenia reglas globales `*.png` / `*.ico` / `*.jpg` que excluian TODAS las imagenes del deploy. Solo assets legacy de CryptoGift tenian excepciones (`!public/apeX.png`, etc.). Ningun archivo de AutoMALL estaba en la lista blanca. Los `onError` handlers en los componentes Image ocultaban silenciosamente las imagenes rotas.
- **Solucion**: Agregar 19 excepciones explicitas en `.vercelignore` para todos los assets de AutoMALL (logos, favicons, iconos, OG image, brand logos). Tambien se optimizo `logo-automall.png` de 2.7MB a 84KB.
- **Leccion**: Siempre verificar `.vercelignore` al agregar nuevas imagenes. El sintoma (imagen no carga) es identico al de un archivo corrupto, lo que desvio el diagnostico.
