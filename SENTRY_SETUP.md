# 🔧 CONFIGURACIÓN DE SENTRY PARA DAO

## ESTADO ACTUAL
- ✅ Estructura Next.js creada para el dashboard
- ✅ Archivos de configuración Sentry preparados
- ⏳ Wizard de Sentry pendiente de ejecutar

## EJECUTAR EL WIZARD DE SENTRY

### Paso 1: Instalar dependencias de Next.js primero
```bash
# Copiar package de Next.js
cp package-nextjs.json package.json.bak
mv package.json package-hardhat.json
cp package-nextjs.json package.json

# Instalar dependencias
npm install

# Crear archivo next-env.d.ts
echo '/// <reference types="next" />' > next-env.d.ts
echo '/// <reference types="next/image-types/global" />' >> next-env.d.ts
```

### Paso 2: Ejecutar el Wizard de Sentry
```bash
npx @sentry/wizard@latest -i nextjs --saas --org cryptogift-wallets --project cryptogift-dao
```

Durante el wizard:
1. **Do you want to continue anyway?** → Yes
2. **Route your app for Sentry?** → Yes
3. **Create example page?** → No (ya tenemos páginas)
4. **URL to your Sentry instance** → https://sentry.io/ (default)
5. **Configure CI/CD?** → Yes

### Paso 3: Después del Wizard

El wizard habrá:
- ✅ Modificado `next.config.js` con `withSentryConfig`
- ✅ Creado/actualizado `sentry.client.config.ts`
- ✅ Creado/actualizado `sentry.server.config.ts`
- ✅ Creado/actualizado `sentry.edge.config.ts`
- ✅ Agregado el DSN automáticamente
- ✅ Creado `.sentryclirc` con auth token

### Paso 4: Ajustes Post-Wizard

1. **Mover DSN a `.env.dao`:**
```bash
# El wizard habrá agregado el DSN a .env.local o directamente en los archivos
# Muévelo a .env.dao:
SENTRY_DAO_DSN=https://xxxxxx@o4509896599863296.ingest.us.sentry.io/xxxxxx
NEXT_PUBLIC_SENTRY_DAO_DSN=https://xxxxxx@o4509896599863296.ingest.us.sentry.io/xxxxxx
```

2. **Actualizar imports en configs de Sentry:**
```typescript
// En cada archivo sentry.*.config.ts, cambiar:
dsn: process.env.SENTRY_DAO_DSN || process.env.NEXT_PUBLIC_SENTRY_DAO_DSN,
```

3. **Configurar para ambos modos (Next.js y Hardhat):**
```bash
# Renombrar packages para poder cambiar entre modos
mv package.json package-nextjs-final.json
mv package-hardhat.json package.json

# Crear script de cambio
cat > switch-mode.sh << 'EOF'
#!/bin/bash
if [ "$1" = "nextjs" ]; then
    cp package-nextjs-final.json package.json
    cp tsconfig-nextjs.json tsconfig.json
    echo "Switched to Next.js mode"
elif [ "$1" = "hardhat" ]; then
    cp package-hardhat.json package.json
    cp tsconfig-hardhat.json tsconfig.json
    echo "Switched to Hardhat mode"
else
    echo "Usage: ./switch-mode.sh [nextjs|hardhat]"
fi
EOF

chmod +x switch-mode.sh
```

## ESTRUCTURA FINAL

```
/cryptogift-wallets-DAO/
├── /app/                    # Dashboard Next.js
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── /contracts/              # Smart contracts
├── /scripts/                # Automation scripts
├── /lib/                    # Shared libraries
├── sentry.client.config.ts # Sentry client
├── sentry.server.config.ts # Sentry server
├── sentry.edge.config.ts   # Sentry edge
├── next.config.js           # Next.js config (con Sentry)
├── hardhat.config.ts        # Hardhat config
├── package-nextjs.json      # Package para dashboard
├── package-hardhat.json     # Package para contracts
└── .env.dao                 # Todas las variables
```

## VERIFICAR INTEGRACIÓN

### Test local del dashboard:
```bash
# Cambiar a modo Next.js
./switch-mode.sh nextjs
npm install

# Iniciar dashboard
npm run dev

# Abrir http://localhost:3000
# Verificar en Sentry que lleguen eventos
```

### Test de error para Sentry:
```typescript
// Agregar en app/page.tsx temporalmente:
<button onClick={() => {
  throw new Error('Test Sentry DAO Integration');
}}>
  Test Sentry Error
</button>
```

## NOTAS IMPORTANTES

1. **Dos modos de operación:**
   - `nextjs`: Para el dashboard web
   - `hardhat`: Para contratos y scripts

2. **El wizard modifica archivos:**
   - Deja que modifique los archivos
   - Luego ajustamos las variables de entorno

3. **Auth Token de Sentry:**
   - Se guarda en `.sentryclirc`
   - NO lo subas a git (ya está en .gitignore)

4. **DSN vs Auth Token:**
   - DSN: Puede ser público (para enviar errores)
   - Auth Token: SECRETO (para source maps)

---

*Una vez completado el wizard, tendrás Sentry 100% integrado con tu DAO dashboard*