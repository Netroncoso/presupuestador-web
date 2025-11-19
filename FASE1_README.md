# Fase 1: Sistema de Versiones y Auditoría

## Resumen

Esta fase implementa la base del sistema de versiones y auditoría **sin romper la funcionalidad existente**. Todos los presupuestos actuales seguirán funcionando normalmente.

## Cambios Implementados

### 1. Tabla `presupuestos` - Nuevos Campos
- `version` (INT) - Número de versión (default: 1)
- `presupuesto_padre` (INT) - ID del presupuesto original (NULL para v1)
- `es_ultima_version` (TINYINT) - Marca la versión actual (default: 1)
- `estado` (ENUM) - Estado del presupuesto: borrador, pendiente, en_revision, aprobado, rechazado

### 2. Tabla `usuarios` - Nuevo Rol
- Rol `auditor_medico` agregado a los existentes (admin, user)

### 3. Nuevas Tablas

#### `notificaciones`
```sql
- id (PK)
- usuario_id (FK usuarios)
- presupuesto_id (FK presupuestos)
- version_presupuesto (INT)
- tipo (ENUM: pendiente, aprobado, rechazado, nueva_version)
- mensaje (VARCHAR 512)
- estado (ENUM: nuevo, leido)
- creado_en (DATETIME)
```

#### `auditorias_presupuestos`
```sql
- id (PK)
- presupuesto_id (FK presupuestos)
- version_presupuesto (INT)
- auditor_id (FK usuarios)
- estado_anterior (VARCHAR)
- estado_nuevo (VARCHAR)
- comentario (TEXT)
- fecha (DATETIME)
```

### 4. Índices Optimizados
- `idx_presupuestos_version` - Para búsquedas por versión
- `idx_presupuestos_estado` - Para filtros por estado
- `idx_presupuestos_ultima_version` - Para obtener versiones actuales
- Índices en notificaciones y auditorías para performance

## Ejecución

### Paso 1: Ejecutar Migración
```bash
cd backend
node scripts/ejecutar-fase1.js
```

### Paso 2: Verificar Resultado
```bash
node scripts/verificar-fase1.js
```

### Paso 3: Cambiar Password Auditor
```sql
-- El usuario 'auditor' se crea con password temporal
UPDATE usuarios 
SET password = '$2b$10$tu_hash_seguro_aqui' 
WHERE username = 'auditor';
```

## Compatibilidad

### ✅ Lo que SIGUE funcionando igual:
- Todos los presupuestos existentes
- Creación de nuevos presupuestos
- Edición de presupuestos
- Listado de presupuestos
- Cálculos de costos y rentabilidad
- Sistema de insumos y prestaciones
- Roles admin y user

### 🆕 Lo que se AGREGA:
- Campo `version` en todos los presupuestos (valor: 1)
- Campo `estado` en todos los presupuestos (valor: 'aprobado')
- Tablas para notificaciones y auditoría (vacías)
- Rol `auditor_medico` disponible
- Índices para mejor performance

## Datos Migrados

Todos los presupuestos existentes se configuran automáticamente como:
- `version = 1`
- `es_ultima_version = 1`
- `estado = 'aprobado'`
- `presupuesto_padre = NULL`

Esto significa que **no hay cambios en el comportamiento actual**.

## Verificaciones Post-Migración

El script de verificación confirma:
1. ✅ Todas las columnas nuevas existen
2. ✅ Todos los presupuestos tienen versión y estado
3. ✅ Las tablas nuevas fueron creadas
4. ✅ Los índices están en su lugar
5. ✅ El usuario auditor existe
6. ✅ No se perdieron datos

## Rollback (Si es necesario)

Si algo sale mal, se puede revertir:

```sql
-- Eliminar columnas agregadas
ALTER TABLE presupuestos 
DROP COLUMN version,
DROP COLUMN presupuesto_padre,
DROP COLUMN es_ultima_version,
DROP COLUMN estado;

-- Eliminar tablas nuevas
DROP TABLE notificaciones;
DROP TABLE auditorias_presupuestos;

-- Revertir rol de usuarios (si es necesario)
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('admin','user') DEFAULT 'user';
```

## Próximos Pasos

Una vez completada la Fase 1:

1. **Fase 2**: Implementar lógica de versiones en el backend
2. **Fase 3**: Crear endpoints para auditor y notificaciones
3. **Fase 4**: Integrar reglas automáticas y frontend

## Soporte

Si hay problemas durante la migración:
1. Revisar logs del script de ejecución
2. Ejecutar script de verificación
3. Consultar backup automático: `backup_presupuestos_fase1`

---

**Importante**: Esta migración es **100% segura** y **reversible**. No modifica datos existentes, solo agrega nuevas funcionalidades.