# Migración Sucursal → sucursal_id - COMPLETADA ✅

**Fecha:** Diciembre 2024  
**Estado:** ✅ Completada y en producción

## 📋 Resumen

Migración exitosa de la columna `Sucursal` (VARCHAR) a `sucursal_id` (INT) con Foreign Key a `sucursales_mh.ID`.

## ✅ Cambios Aplicados en Base de Datos

### 1. Nueva Columna y FK
```sql
-- Agregar columna sucursal_id
ALTER TABLE presupuestos 
ADD COLUMN sucursal_id INT NULL AFTER DNI;

-- Poblar datos desde Sucursal
UPDATE presupuestos p
INNER JOIN sucursales_mh s ON p.Sucursal = s.Sucursales_mh
SET p.sucursal_id = s.ID;
-- Resultado: 212 registros actualizados

-- Agregar Foreign Key
ALTER TABLE presupuestos
ADD CONSTRAINT fk_presupuestos_sucursal 
FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID);
```

### 2. Eliminar Columna Antigua
```sql
-- Eliminar columna Sucursal antigua
ALTER TABLE presupuestos DROP COLUMN Sucursal;
-- Ejecutado: 2024-12-XX 12:53:53
```

## ✅ Cambios Aplicados en Código

### Backend (4 archivos modificados)

#### 1. `presupuestosControllerV2.ts`
- ✅ INSERT usa `sucursal_id` (INT)
- ✅ SELECT con JOIN: `s.Sucursales_mh as Sucursal` (alias para frontend)
- ✅ Queries de edición usan `sucursal_id`

#### 2. `sseController.ts`
- ✅ Query con JOIN a `sucursales_mh` usando `sucursal_id`

#### 3. `auditoria-simple.ts`
- ✅ Query con JOIN a `sucursales_mh` usando `sucursal_id`

#### 4. `sucursalesController.ts`
- ✅ Devuelve `ID, Sucursales_mh, suc_porcentaje_insumos`

### Frontend (1 archivo modificado)

#### 1. `DatosPresupuesto.tsx`
- ✅ Estado `sucursalId` (number)
- ✅ Select envía `sucursal_id` (INT) al backend
- ✅ Mapeo correcto: `value: s.ID, label: s.Sucursales_mh`

## 📊 Estado Final

### Base de Datos
```
presupuestos
├── sucursal_id (INT, NOT NULL, FK → sucursales_mh.ID) ✅
└── Sucursal (eliminada) ✅
```

### Flujo de Datos
```
Frontend → sucursal_id: number
Backend INSERT → sucursal_id (INT)
Backend SELECT → s.Sucursales_mh as Sucursal (alias)
Frontend ← Sucursal: string (del alias)
```

## 🎯 Ventajas de la Solución

1. **Integridad Referencial**: FK garantiza que solo existan sucursales válidas
2. **Normalización**: Elimina duplicación de nombres
3. **Performance**: JOIN con INT es más rápido que con VARCHAR
4. **Compatibilidad**: Frontend sigue recibiendo `Sucursal` via alias
5. **Mantenibilidad**: Cambios en nombres de sucursales se reflejan automáticamente

## 📝 Otros Cambios Aplicados en la Misma Sesión

### Tipos de Datos Corregidos
- ✅ `insumos.costo`: INT → DECIMAL(10,2)
- ✅ `presupuestos.DNI`: INT → VARCHAR(20)
- ✅ `presupuestos.total_insumos`: INT → DECIMAL(10,2)
- ✅ `presupuestos.total_prestaciones`: INT → DECIMAL(10,2)
- ✅ `presupuestos.costo_total`: INT → DECIMAL(10,2)

### Primary Keys Limpiadas
- ✅ `insumos`: Solo `idInsumos` (PK) + `producto` (UNIQUE)
- ✅ `sucursales_mh`: Solo `ID` (PK) + `Sucursales_mh` (UNIQUE)

### Foreign Keys Agregadas
- ✅ `presupuestos.idobra_social` → `financiador.idobra_social`
- ✅ `presupuestos.sucursal_id` → `sucursales_mh.ID`

## ✅ Verificación

```sql
-- Verificar estructura
DESCRIBE presupuestos;
-- sucursal_id | int | NO | MUL | NULL | 

-- Verificar FK
SHOW CREATE TABLE presupuestos;
-- CONSTRAINT `fk_presupuestos_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales_mh` (`ID`)

-- Verificar datos
SELECT COUNT(*) FROM presupuestos WHERE sucursal_id IS NOT NULL;
-- 212 registros

-- Verificar que columna Sucursal no existe
SELECT Sucursal FROM presupuestos LIMIT 1;
-- Error: Unknown column 'Sucursal'
```

## 🚀 Próximos Pasos (Opcional)

### Pendiente: Convertir `id_servicio` VARCHAR → INT
```sql
-- presupuesto_prestaciones.id_servicio: VARCHAR(50) → INT
-- Requiere verificación de datos y migración cuidadosa
```

## 📚 Documentos Relacionados

- `cambios_seguros.sql` - Script con todos los cambios aplicados
- `README.md` - Documentación general actualizada
- `CONFIGURACION_OTRA_PC.md` - Guía de setup

---

**Migración completada exitosamente** ✅  
**Sin rollback necesario** ✅  
**Sistema funcionando correctamente** ✅
