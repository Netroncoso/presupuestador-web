# Scripts de Backend

Scripts de utilidad para desarrollo, testing y verificación de migraciones.

## 📁 Estructura

```
scripts/
├── migrations/     # Scripts de verificación de migraciones
├── utils/          # Scripts de utilidad para desarrollo
└── deprecated/     # Scripts obsoletos (mantener para historial)
```

## 🔍 Scripts de Migraciones

### Verificar Fase 1 (Versionado)
```bash
node backend/scripts/migrations/verificar-fase1.js
```
Verifica que la migración de versionado de presupuestos se haya ejecutado correctamente.

**Verifica:**
- Columnas agregadas (version, presupuesto_padre, es_ultima_version, estado)
- Datos migrados correctamente
- Tablas nuevas (notificaciones, auditorias_presupuestos)
- Índices creados
- Roles de usuario

### Test Fase 2
```bash
node backend/scripts/migrations/test-fase2.js
```
Prueba funcionalidades de la fase 2 del sistema.

## 🛠️ Scripts de Utilidad

### Verificar Conexión a Base de Datos
```bash
node backend/scripts/utils/check-db.js
```
Verifica que la conexión a MySQL esté funcionando correctamente.

### Verificar Tabla Específica
```bash
node backend/scripts/utils/check-table.js
```
Muestra información detallada de una tabla específica.

### Test de Conexión TypeScript
```bash
npx ts-node backend/scripts/utils/test-db-connection.ts
```
Prueba de conexión usando TypeScript.

## 📦 Scripts Deprecados

Los scripts en la carpeta `deprecated/` son versiones antiguas que se mantienen para historial pero **NO deben usarse**:

- `ejecutar-fase1.js` - Reemplazado por migración SQL
- `ejecutar-fase1-simple.js` - Reemplazado por migración SQL
- `completar-fase1.js` - Reemplazado por migración SQL
- `apply-indexes.js` - Índices ahora en migraciones SQL
- `apply-usuario-migration.js` - Migración de usuarios obsoleta
- `create-tables.js` - Tablas creadas en migraciones SQL
- `fix-decimal-types.js` - Tipos corregidos en migraciones SQL
- `update-database.js` - Actualizaciones en migraciones SQL

## ⚙️ Configuración

Todos los scripts usan variables de entorno del archivo `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=mh_1
```

## 📝 Notas

- Los scripts de verificación son **seguros** (solo lectura)
- Los scripts deprecados **NO deben ejecutarse** en producción
- Siempre usar migraciones SQL oficiales en `backend/migrations/`
