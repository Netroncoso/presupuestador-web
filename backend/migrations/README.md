# Migraciones de Base de Datos

## 📋 Índice

- [Estado Actual](#estado-actual)
- [Migraciones Aplicadas](#migraciones-aplicadas)
- [Orden de Ejecución](#orden-de-ejecución)
- [Troubleshooting](#troubleshooting)

## ✅ Estado Actual

**Base de Datos:** `mh_1` (presupuestador)  
**Última Migración:** Sucursal → sucursal_id (Diciembre 2024)  
**Estado:** ✅ Producción

### Estructura Actual

```
presupuestos
├── idPresupuestos (PK)
├── Nombre_Apellido (VARCHAR)
├── DNI (VARCHAR(20)) ✅ Corregido
├── sucursal_id (INT, FK → sucursales_mh.ID) ✅ Nueva
├── idobra_social (INT, FK → financiador) ✅ FK agregada
├── total_insumos (DECIMAL(10,2)) ✅ Corregido
├── total_prestaciones (DECIMAL(10,2)) ✅ Corregido
├── costo_total (DECIMAL(10,2)) ✅ Corregido
└── ...

insumos
├── idInsumos (PK) ✅ Limpiada
├── producto (UNIQUE) ✅ Limpiada
├── costo (DECIMAL(10,2)) ✅ Corregido
└── ...

sucursales_mh
├── ID (PK) ✅ Limpiada
├── Sucursales_mh (UNIQUE) ✅ Limpiada
└── ...
```

## 📚 Migraciones Aplicadas

### ✅ Completadas

| Archivo | Descripción | Fecha | Estado |
|---------|-------------|-------|--------|
| `cambios_seguros.sql` | Tipos de datos + FKs + PKs | Dic 2024 | ✅ Aplicada |
| `create_prestador_servicio_valores.sql` | Sistema valores históricos | Dic 2024 | ✅ Aplicada |
| `add_sucursal_to_usuarios.sql` | FK usuarios → sucursales | Dic 2024 | ✅ Aplicada |
| `add_precio_facturar_to_presupuesto_insumos.sql` | Campo precio_facturar | Dic 2024 | ✅ Aplicada |
| `add_valor_facturar_to_presupuesto_prestaciones.sql` | Campo valor_facturar | Dic 2024 | ✅ Aplicada |

### 📝 Documentación

| Archivo | Descripción |
|---------|-------------|
| `MIGRACION_SUCURSAL_COMPLETADA.md` | Resumen completo de migración Sucursal → sucursal_id |
| `README.md` | Este archivo |

### 🗑️ Archivos Obsoletos (Eliminados)

- ~~`ANALISIS_BASE_DATOS.md`~~ - Reemplazado por `MIGRACION_SUCURSAL_COMPLETADA.md`
- ~~`ESTADO_ACTUAL_BD.md`~~ - Información integrada en este README
- ~~`ANALISIS_ACTUALIZADO.md`~~ - Ya no necesario
- ~~`IMPACTO_CAMBIOS.md`~~ - Cambios ya aplicados

## 🔄 Orden de Ejecución para Nueva Instalación

Si necesitas recrear la BD desde cero:

```bash
# 1. Crear estructura base
mysql -u root -p presupuestador < setup_database.sql

# 2. Aplicar cambios de tipos de datos y FKs
mysql -u root -p presupuestador < cambios_seguros.sql

# 3. Sistema de valores históricos
mysql -u root -p presupuestador < create_prestador_servicio_valores.sql

# 4. Campos adicionales
mysql -u root -p presupuestador < add_precio_facturar_to_presupuesto_insumos.sql
mysql -u root -p presupuestador < add_valor_facturar_to_presupuesto_prestaciones.sql
mysql -u root -p presupuestador < add_sucursal_to_usuarios.sql

# 5. Índices (opcional, mejora performance)
mysql -u root -p presupuestador < add_indexes.sql
```

## 📊 Orden de Backup/Restore

Para hacer backup o restore, respetar este orden:

### Tablas Maestras (sin FK)
1. `usuarios`
2. `sucursales_mh`
3. `financiador_acuerdo`
4. `financiador`
5. `servicios`
6. `insumos`

### Tablas con FK Simples
7. `prestador_servicio`
8. `prestador_servicio_valores`

### Tabla Principal
9. `presupuestos`

### Tablas Dependientes
10. `presupuesto_insumos`
11. `presupuesto_prestaciones`
12. `auditorias_presupuestos`
13. `notificaciones`

Ver: `backup_restore_orden_correcto.sql`

## 🐛 Troubleshooting

### Error: Cannot add foreign key constraint

**Causa:** Datos huérfanos en la tabla

**Solución:**
```sql
-- Verificar registros huérfanos
SELECT p.* FROM presupuestos p
LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
WHERE p.sucursal_id IS NOT NULL AND s.ID IS NULL;

-- Limpiar o corregir datos antes de agregar FK
```

### Error: Duplicate entry for key 'PRIMARY'

**Causa:** PK compuesta mal configurada

**Solución:**
```sql
-- Verificar estructura actual
SHOW CREATE TABLE nombre_tabla;

-- Eliminar PK compuesta
ALTER TABLE nombre_tabla DROP PRIMARY KEY;

-- Agregar PK simple
ALTER TABLE nombre_tabla ADD PRIMARY KEY (id);
```

### Error: Data truncated for column

**Causa:** Tipo de dato incompatible

**Solución:**
```sql
-- Verificar datos antes de cambiar tipo
SELECT MAX(LENGTH(columna)) FROM tabla;

-- Cambiar tipo con suficiente espacio
ALTER TABLE tabla MODIFY columna VARCHAR(50);
```

## 🔍 Verificación de Integridad

```sql
-- Verificar FKs
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'mh_1'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar tipos de datos
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1'
  AND TABLE_NAME IN ('presupuestos', 'insumos', 'presupuesto_insumos');

-- Verificar registros huérfanos
SELECT COUNT(*) FROM presupuestos 
WHERE sucursal_id NOT IN (SELECT ID FROM sucursales_mh);
-- Debe retornar 0
```

## 📞 Soporte

Para problemas con migraciones, consultar:
- `MIGRACION_SUCURSAL_COMPLETADA.md` - Detalles de última migración
- `CONFIGURACION_OTRA_PC.md` - Setup completo en nueva PC
- Equipo de desarrollo

---

**Última actualización:** Diciembre 2024  
**Mantenido por:** Equipo de Desarrollo
