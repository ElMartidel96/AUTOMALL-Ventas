#!/bin/bash

echo "🚀 Configurando Sentry para CryptoGift DAO..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm no está instalado. Instalando...${NC}"
    npm install -g pnpm
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias con pnpm...${NC}"
    pnpm install
fi

# Ejecutar el wizard de Sentry
echo -e "${GREEN}🔧 Ejecutando Sentry Wizard...${NC}"
echo -e "${YELLOW}Responde a las preguntas del wizard:${NC}"
echo "  - Continue anyway? → Yes"
echo "  - Route your app? → Yes"
echo "  - Create example? → No"
echo "  - Configure CI/CD? → Yes"
echo ""

npx @sentry/wizard@latest -i nextjs \
  --saas \
  --org cryptogift-wallets \
  --project cryptogift-dao

# Verificar si el wizard fue exitoso
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sentry configurado exitosamente!${NC}"
    
    # Mover DSN a .env.dao si existe
    if grep -q "SENTRY_DSN" .env.local 2>/dev/null; then
        DSN=$(grep "SENTRY_DSN" .env.local | cut -d '=' -f2)
        echo "SENTRY_DAO_DSN=$DSN" >> .env.dao
        echo "NEXT_PUBLIC_SENTRY_DAO_DSN=$DSN" >> .env.dao
        echo -e "${GREEN}✅ DSN movido a .env.dao${NC}"
    fi
    
    # Mostrar siguiente paso
    echo ""
    echo -e "${GREEN}📝 Próximos pasos:${NC}"
    echo "1. Verifica que el DSN esté en .env.dao"
    echo "2. Ejecuta: pnpm dev"
    echo "3. Abre: http://localhost:3000"
    echo "4. Verifica en Sentry que lleguen eventos"
else
    echo -e "${RED}❌ Error al configurar Sentry${NC}"
    echo "Por favor, ejecuta manualmente:"
    echo "npx @sentry/wizard@latest -i nextjs --saas --org cryptogift-wallets --project cryptogift-dao"
fi