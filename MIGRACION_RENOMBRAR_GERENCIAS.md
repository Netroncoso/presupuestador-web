# Migración: Renombrar Gerencias (Administrativa ↔ Prestacional)

## Resumen
Renombrar roles y estados en base de datos para alinear nomenclatura del sistema con la terminología del cliente.

## Problema Actual
Los nombres en el código están invertidos respecto a las responsabilidades reales:

| Nombre Actual | Responsabilidad Real | Nombre Correcto |
|---------------|---------------------|-----------------|
| `gerencia_administrativa` | Revisa aspectos técnicos/médicos | `gerencia_prestacional` |
| `gerencia_prestacional` | Revisa márgenes, rentabilidad, precios | `gerencia_comercial` |

## Migración SQL

**Archivo**: `backend/migrations/016_renombrar_gerencias.sql`

```sql
-- ============================================================================
-- MIGRACIÓN: Renombrar Gerencias
-- Fecha: Enero 2025
-- Descripción: Alinear nomenclatura con terminología del cliente
-- ============================================================================

-- PASO 1: Expandir ENUM de usuarios.rol (agregar nuevos valores)
-- ============================================================================
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_comercial',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 2: Migrar datos de usuarios
-- ============================================================================
UPDATE usuarios SET rol = 'gerencia_comercial' WHERE rol = 'gerencia_prestacional';
UPDATE usuarios SET rol = 'gerencia_prestacional' WHERE rol = 'gerencia_administrativa';

-- PASO 3: Eliminar valor viejo del ENUM de usuarios.rol
-- ============================================================================
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_prestacional',
  'gerencia_comercial',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 4: Expandir ENUM de presupuestos.estado
-- ============================================================================
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_comercial',
  'en_revision_comercial',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 5: Migrar datos de presupuestos
-- ============================================================================
UPDATE presupuestos SET estado = 'pendiente_comercial' WHERE estado = 'pendiente_prestacional';
UPDATE presupuestos SET estado = 'en_revision_comercial' WHERE estado = 'en_revision_prestacional';
UPDATE presupuestos SET estado = 'pendiente_prestacional' WHERE estado = 'pendiente_administrativa';
UPDATE presupuestos SET estado = 'en_revision_prestacional' WHERE estado = 'en_revision_administrativa';

-- PASO 6: Eliminar valores viejos del ENUM de presupuestos.estado
-- ============================================================================
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_comercial',
  'en_revision_comercial',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 7: Migrar auditorias_presupuestos (estado_anterior)
-- ============================================================================
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_comercial' WHERE estado_anterior = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_comercial' WHERE estado_anterior = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_prestacional' WHERE estado_anterior = 'pendiente_administrativa';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_prestacional' WHERE estado_anterior = 'en_revision_administrativa';

-- PASO 8: Migrar auditorias_presupuestos (estado_nuevo)
-- ============================================================================
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_comercial' WHERE estado_nuevo = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_comercial' WHERE estado_nuevo = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_prestacional' WHERE estado_nuevo = 'pendiente_administrativa';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_prestacional' WHERE estado_nuevo = 'en_revision_administrativa';

-- PASO 9: Verificación
-- ============================================================================
SELECT 'Usuarios por rol:' as verificacion;
SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol;

SELECT 'Presupuestos por estado:' as verificacion;
SELECT estado, COUNT(*) as cantidad FROM presupuestos GROUP BY estado;

SELECT 'Auditorías - Estados anteriores únicos:' as verificacion;
SELECT DISTINCT estado_anterior FROM auditorias_presupuestos WHERE estado_anterior IS NOT NULL ORDER BY estado_anterior;

SELECT 'Auditorías - Estados nuevos únicos:' as verificacion;
SELECT DISTINCT estado_nuevo FROM auditorias_presupuestos WHERE estado_nuevo IS NOT NULL ORDER BY estado_nuevo;

SELECT 'Notificaciones - Tipos únicos:' as verificacion;
SELECT DISTINCT tipo FROM notificaciones ORDER BY tipo;
```

**Ejecutar**:
```bash
mysql -u root -p mh_1 < backend/migrations/016_renombrar_gerencias.sql
```

## Actualizar Schema Documentation

**Archivo**: `.amazonq/rules/database-schema.md`

Buscar y reemplazar:
- `gerencia_administrativa` → `gerencia_prestacional`
- `gerencia_prestacional` → `gerencia_comercial`
- `pendiente_administrativa` → `pendiente_prestacional`
- `en_revision_administrativa` → `en_revision_prestacional`
- `pendiente_prestacional` → `pendiente_comercial`
- `en_revision_prestacional` → `en_revision_comercial`

## Cambios en Backend

### Script Automatizado

**Archivo**: `backend/scripts/renombrar_gerencias.sh`

```bash
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Renombrando gerencias en backend...${NC}"

# PASO 1: Roles (agnóstico a comillas)
find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/gerencia_administrativa/gerencia_prestacional_TEMP/g" \
  -e "s/gerencia_prestacional/gerencia_comercial_TEMP/g" \
  {} +

find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/gerencia_prestacional_TEMP/gerencia_prestacional/g" \
  -e "s/gerencia_comercial_TEMP/gerencia_comercial/g" \
  {} +

# PASO 2: Estados
find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/pendiente_administrativa/pendiente_prestacional_TEMP/g" \
  -e "s/en_revision_administrativa/en_revision_prestacional_TEMP/g" \
  -e "s/pendiente_prestacional/pendiente_comercial_TEMP/g" \
  -e "s/en_revision_prestacional/en_revision_comercial_TEMP/g" \
  {} +

find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/pendiente_prestacional_TEMP/pendiente_prestacional/g" \
  -e "s/en_revision_prestacional_TEMP/en_revision_prestacional/g" \
  -e "s/pendiente_comercial_TEMP/pendiente_comercial/g" \
  -e "s/en_revision_comercial_TEMP/en_revision_comercial/g" \
  {} +

# PASO 3: Textos legibles
find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/Gerencia Administrativa/Gerencia Prestacional_TEMP/g" \
  -e "s/G\. Administrativa/G. Prestacional_TEMP/g" \
  -e "s/Gerencia Prestacional/Gerencia Comercial_TEMP/g" \
  -e "s/G\. Prestacional/G. Comercial_TEMP/g" \
  {} +

find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/Gerencia Prestacional_TEMP/Gerencia Prestacional/g" \
  -e "s/G\. Prestacional_TEMP/G. Prestacional/g" \
  -e "s/Gerencia Comercial_TEMP/Gerencia Comercial/g" \
  -e "s/G\. Comercial_TEMP/G. Comercial/g" \
  {} +

# PASO 4: Nombres de funciones (camelCase)
find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/requireGerenciaAdministrativa/requireGerenciaPrestacional_TEMP/g" \
  -e "s/requireGerenciaPrestacional/requireGerenciaComercial_TEMP/g" \
  {} +

find backend/src -type f -name "*.ts" -exec sed -i \
  -e "s/requireGerenciaPrestacional_TEMP/requireGerenciaPrestacional/g" \
  -e "s/requireGerenciaComercial_TEMP/requireGerenciaComercial/g" \
  {} +

echo -e "${GREEN}✓ Backend actualizado${NC}"
```

**Ejecutar**:
```bash
chmod +x backend/scripts/renombrar_gerencias.sh
./backend/scripts/renombrar_gerencias.sh
```

### Archivos Clave a Revisar Manualmente

1. **backend/src/types/database.ts** - Tipos TypeScript
2. **backend/src/middleware/auth.ts** - Middleware de autorización
3. **backend/src/services/auditoriaMultiService.ts** - Lógica de auditoría
4. **backend/src/controllers/auditoriaController.ts** - Endpoints de auditoría

## Cambios en Frontend

### Script Automatizado

**Archivo**: `frontend/scripts/renombrar_gerencias.sh`

```bash
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
```

**Ejecutar**:
```bash
chmod +x frontend/scripts/renombrar_gerencias.sh
./frontend/scripts/renombrar_gerencias.sh
```

### Archivos Clave a Revisar Manualmente

1. **frontend/src/types/index.ts** - Tipos TypeScript
2. **frontend/src/utils/estadoPresupuesto.ts** - Labels y colores
3. **frontend/src/App.tsx** - Rutas y componentes
4. **frontend/src/pages/GerenciaPrestacionalDashboard.tsx** - Dashboard renombrado
5. **frontend/src/pages/GerenciaComercialDashboard.tsx** - Dashboard renombrado

## Actualizar Documentación

### Archivos a Modificar

1. **README.md**
   - Sección "Roles de Usuario"
   - Sección "Flujo de Trabajo"
   - Tabla de roles y permisos

2. **MANUAL_USUARIO_V2.md**
   - Referencias a gerencias
   - Capturas de pantalla (si aplica)

3. **SISTEMA_MULTI_GERENCIAL_V3.md**
   - Flujo de auditoría
   - Diagramas de estados

4. **.amazonq/rules/memory-bank/product.md**
   - Sección "Target Users"
   - Sección "Primary Workflows"

## Testing

### Tests Automatizados

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Tests Manuales

**Checklist**:
- [ ] Login con rol `gerencia_prestacional` funciona
- [ ] Login con rol `gerencia_comercial` funciona
- [ ] Dashboard G. Prestacional carga correctamente
- [ ] Dashboard G. Comercial carga correctamente
- [ ] Crear presupuesto → Finalizar → Va a auditoría
- [ ] G. Prestacional puede tomar caso
- [ ] G. Prestacional puede aprobar/rechazar/derivar
- [ ] G. Comercial puede tomar caso
- [ ] G. Comercial puede aprobar/rechazar/observar/escalar
- [ ] Estados se muestran correctamente en ListaPresupuestos
- [ ] Notificaciones llegan a roles correctos
- [ ] Historial de auditorías muestra estados correctos
- [ ] Filtros por estado funcionan
- [ ] Permisos de rutas funcionan (403 si no autorizado)

## Rollback

**Archivo**: `backend/migrations/016_rollback_renombrar_gerencias.sql`

```sql
-- ============================================================================
-- ROLLBACK: Renombrar Gerencias
-- ============================================================================

-- PASO 1: Expandir ENUM de usuarios.rol
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_comercial',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 2: Revertir datos de usuarios
UPDATE usuarios SET rol = 'gerencia_administrativa' WHERE rol = 'gerencia_prestacional';
UPDATE usuarios SET rol = 'gerencia_prestacional' WHERE rol = 'gerencia_comercial';

-- PASO 3: Eliminar valor nuevo del ENUM
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 4: Expandir ENUM de presupuestos.estado
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_comercial',
  'en_revision_comercial',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 5: Revertir datos de presupuestos
UPDATE presupuestos SET estado = 'pendiente_administrativa' WHERE estado = 'pendiente_prestacional';
UPDATE presupuestos SET estado = 'en_revision_administrativa' WHERE estado = 'en_revision_prestacional';
UPDATE presupuestos SET estado = 'pendiente_prestacional' WHERE estado = 'pendiente_comercial';
UPDATE presupuestos SET estado = 'en_revision_prestacional' WHERE estado = 'en_revision_comercial';

-- PASO 6: Eliminar valores nuevos del ENUM
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 7: Revertir auditorias (estado_anterior)
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_administrativa' WHERE estado_anterior = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_administrativa' WHERE estado_anterior = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_prestacional' WHERE estado_anterior = 'pendiente_comercial';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_prestacional' WHERE estado_anterior = 'en_revision_comercial';

-- PASO 8: Revertir auditorias (estado_nuevo)
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_administrativa' WHERE estado_nuevo = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_administrativa' WHERE estado_nuevo = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_prestacional' WHERE estado_nuevo = 'pendiente_comercial';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_prestacional' WHERE estado_nuevo = 'en_revision_comercial';

-- Verificación
SELECT 'Rollback completado' as status;
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;
SELECT estado, COUNT(*) FROM presupuestos GROUP BY estado;
```

## Checklist de Implementación

### Preparación
- [ ] Backup completo de BD: `mysqldump -u root -p mh_1 > backup_pre_migracion.sql`
- [ ] Commit actual: `git add . && git commit -m "Pre-migración: Estado actual"`
- [ ] Crear rama: `git checkout -b feature/renombrar-gerencias`

### Base de Datos
- [ ] Ejecutar `016_renombrar_gerencias.sql`
- [ ] Verificar queries de verificación
- [ ] Actualizar `database-schema.md`

### Backend
- [ ] Ejecutar script `renombrar_gerencias.sh`
- [ ] Revisar archivos clave manualmente
- [ ] Compilar: `npm run build`
- [ ] Tests: `npm test`

### Frontend
- [ ] Ejecutar script `renombrar_gerencias.sh`
- [ ] Revisar archivos clave manualmente
- [ ] Compilar: `npm run build`
- [ ] Tests: `npm test`

### Documentación
- [ ] Actualizar README.md
- [ ] Actualizar MANUAL_USUARIO_V2.md
- [ ] Actualizar SISTEMA_MULTI_GERENCIAL_V3.md
- [ ] Actualizar memory-bank/product.md

### Testing
- [ ] Tests automatizados (backend + frontend)
- [ ] Tests manuales (checklist completo)
- [ ] Verificar SSE y notificaciones
- [ ] Verificar permisos de rutas

### Deploy
- [ ] Commit: `git add . && git commit -m "Migración: Renombrar gerencias"`
- [ ] Merge a main
- [ ] Deploy a staging
- [ ] Validación final
- [ ] Deploy a producción

## Estimación

| Fase | Tiempo |
|------|--------|
| Preparación | 30 min |
| Migración BD | 30 min |
| Scripts backend/frontend | 1 hora |
| Revisión manual | 2 horas |
| Testing | 2 horas |
| Documentación | 1 hora |
| **TOTAL** | **7 horas** |

---

**Versión**: 2.0  
**Fecha**: Enero 2025  
**Estado**: ✅ Listo para implementar
