#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Renombrando gerencias en frontend...${NC}"

# PASO 1: Roles (agnóstico a comillas)
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/gerencia_administrativa/gerencia_prestacional_TEMP/g" \
  -e "s/gerencia_prestacional/gerencia_comercial_TEMP/g" \
  {} +

find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/gerencia_prestacional_TEMP/gerencia_prestacional/g" \
  -e "s/gerencia_comercial_TEMP/gerencia_comercial/g" \
  {} +

# PASO 2: Estados
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/pendiente_administrativa/pendiente_prestacional_TEMP/g" \
  -e "s/en_revision_administrativa/en_revision_prestacional_TEMP/g" \
  -e "s/pendiente_prestacional/pendiente_comercial_TEMP/g" \
  -e "s/en_revision_prestacional/en_revision_comercial_TEMP/g" \
  {} +

find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/pendiente_prestacional_TEMP/pendiente_prestacional/g" \
  -e "s/en_revision_prestacional_TEMP/en_revision_prestacional/g" \
  -e "s/pendiente_comercial_TEMP/pendiente_comercial/g" \
  -e "s/en_revision_comercial_TEMP/en_revision_comercial/g" \
  {} +

# PASO 3: Textos UI
find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/Gerencia Administrativa/Gerencia Prestacional_TEMP/g" \
  -e "s/G\. Administrativa/G. Prestacional_TEMP/g" \
  -e "s/Gerencia Prestacional/Gerencia Comercial_TEMP/g" \
  -e "s/G\. Prestacional/G. Comercial_TEMP/g" \
  {} +

find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/Gerencia Prestacional_TEMP/Gerencia Prestacional/g" \
  -e "s/G\. Prestacional_TEMP/G. Prestacional/g" \
  -e "s/Gerencia Comercial_TEMP/Gerencia Comercial/g" \
  -e "s/G\. Comercial_TEMP/G. Comercial/g" \
  {} +

# PASO 4: Renombrar archivos de componentes
if [ -f "frontend/src/pages/GerenciaAdministrativaDashboard.tsx" ]; then
  mv frontend/src/pages/GerenciaAdministrativaDashboard.tsx frontend/src/pages/GerenciaPrestacionalDashboard_NEW.tsx
fi

if [ -f "frontend/src/pages/GerenciaPrestacionalDashboard.tsx" ]; then
  mv frontend/src/pages/GerenciaPrestacionalDashboard.tsx frontend/src/pages/GerenciaComercialDashboard.tsx
fi

if [ -f "frontend/src/pages/GerenciaPrestacionalDashboard_NEW.tsx" ]; then
  mv frontend/src/pages/GerenciaPrestacionalDashboard_NEW.tsx frontend/src/pages/GerenciaPrestacionalDashboard.tsx
fi

echo -e "${GREEN}✓ Frontend actualizado${NC}"
