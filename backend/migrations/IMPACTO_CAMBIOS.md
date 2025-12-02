# Análisis de Impacto de Cambios en la Aplicación

## ✅ CAMBIOS SEGUROS (No afectan funcionalidad)

### 1. `insumos.costo`: INT → DECIMAL(10,2)
**Impacto:** ✅ NINGUNO
- MySQL convierte automáticamente INT a DECIMAL en queries
- La app ya maneja decimales en otros campos
- **Beneficio:** Permite guardar centavos (ej: $10.50)

### 2. `presupuestos.DNI`: INT → VARCHAR(20)
**Impacto:** ✅ MÍNIMO
- MySQL convierte automáticamente números a strings
- Queries con `WHERE DNI = 12345678` seguirán funcionando
- **Beneficio:** Soporta DNI extranjeros (ej: "A1234567B")
- **Acción requerida:** Ninguna, compatible hacia atrás

### 3. Limpiar PKs compuestas (insumos, sucursales_mh)
**Impacto:** ✅ NINGUNO
- Solo afecta estructura interna de MySQL
- Los queries siguen funcionando igual
- **Beneficio:** Mejora performance y facilita backups

### 4. Agregar índices
**Impacto:** ✅ POSITIVO
- Solo mejora velocidad de queries
- No cambia comportamiento
- **Beneficio:** App más rápida

## ⚠️ CAMBIOS QUE REQUIEREN VERIFICACIÓN

### 5. Agregar FK: `presupuestos.idobra_social` → `financiador`
**Impacto:** ⚠️ PUEDE FALLAR si hay datos huérfanos

**Verificar ANTES de aplicar:**
```sql
-- Ver si hay presupuestos con financiador inexistente
SELECT 
  p.idPresupuestos,
  p.idobra_social,
  p.Nombre_Apellido
FROM presupuestos p
WHERE p.idobra_social IS NOT NULL 
  AND p.idobra_social NOT IN (SELECT idobra_social FROM financiador);
```

**Si hay registros huérfanos:**
- Opción 1: Crear el financiador faltante
- Opción 2: Poner `idobra_social = NULL` en esos presupuestos

**Después de agregar FK:**
- ✅ La app seguirá funcionando normal
- ✅ Evita crear presupuestos con financiador inválido
- ⚠️ No podrás eliminar un financiador si tiene presupuestos (ON DELETE SET NULL lo maneja)

### 6. Migrar `presupuestos.Sucursal` → `sucursal_id`
**Impacto:** ⚠️ REQUIERE CAMBIOS EN CÓDIGO

**Problema actual:**
```typescript
// Backend usa el NOMBRE de la sucursal
presupuesto.Sucursal = "Sede Central"  // VARCHAR
```

**Después del cambio:**
```typescript
// Debería usar el ID
presupuesto.sucursal_id = 1  // INT con FK
```

**Archivos a revisar:**
- `backend/src/controllers/presupuestosControllerV2.ts`
- `frontend/src/pages/DatosPresupuesto.tsx`

**Solución temporal:**
- Mantener AMBAS columnas (`Sucursal` y `sucursal_id`)
- Migrar gradualmente el código
- Eliminar `Sucursal` cuando todo use `sucursal_id`

### 7. `presupuesto_prestaciones.id_servicio`: VARCHAR → INT
**Impacto:** ⚠️ REQUIERE CAMBIOS EN CÓDIGO

**Problema actual:**
```typescript
// Backend guarda como string
prestacion.id_servicio = "123"  // VARCHAR
```

**Después del cambio:**
```typescript
// Debe ser número
prestacion.id_servicio = 123  // INT
```

**Archivos a revisar:**
- `backend/src/controllers/presupuestosControllerV2.ts`
- `frontend/src/pages/Prestaciones.tsx`

**Verificar:**
```sql
-- Ver si hay valores no numéricos
SELECT * FROM presupuesto_prestaciones 
WHERE id_servicio NOT REGEXP '^[0-9]+$';
```

## 🎯 RECOMENDACIÓN DE EJECUCIÓN

### FASE 1: Cambios Seguros (Ejecutar YA)
```sql
-- Estos NO afectan la app
ALTER TABLE insumos MODIFY COLUMN costo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE presupuestos MODIFY COLUMN DNI VARCHAR(20) NOT NULL;

-- Limpiar PKs
ALTER TABLE insumos DROP PRIMARY KEY;
ALTER TABLE insumos ADD PRIMARY KEY (idInsumos);
ALTER TABLE insumos ADD UNIQUE KEY unique_producto (producto);

ALTER TABLE sucursales_mh DROP PRIMARY KEY;
ALTER TABLE sucursales_mh ADD PRIMARY KEY (ID);
ALTER TABLE sucursales_mh ADD UNIQUE KEY unique_sucursal_nombre (Sucursales_mh);

-- Agregar índices
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);
-- ... resto de índices
```

### FASE 2: Verificar Datos (Antes de FKs)
```sql
-- Verificar huérfanos en idobra_social
SELECT COUNT(*) FROM presupuestos 
WHERE idobra_social IS NOT NULL 
  AND idobra_social NOT IN (SELECT idobra_social FROM financiador);

-- Verificar sucursal_id
SELECT COUNT(*) FROM presupuestos WHERE sucursal_id IS NULL;

-- Verificar id_servicio numérico
SELECT COUNT(*) FROM presupuesto_prestaciones 
WHERE id_servicio NOT REGEXP '^[0-9]+$';
```

### FASE 3: Agregar FKs (Si verificación OK)
```sql
-- Solo si NO hay huérfanos
ALTER TABLE presupuestos 
  ADD CONSTRAINT fk_presupuestos_financiador 
  FOREIGN KEY (idobra_social) REFERENCES financiador(idobra_social)
  ON DELETE SET NULL ON UPDATE CASCADE;
```

### FASE 4: Cambios de Código (Requiere desarrollo)
- Migrar uso de `Sucursal` a `sucursal_id`
- Cambiar `id_servicio` de string a number en TypeScript
- Probar en desarrollo
- Desplegar a producción

## 📋 CHECKLIST ANTES DE EJECUTAR

- [ ] Backup completo de la base de datos
- [ ] Ejecutar queries de verificación
- [ ] Revisar si hay registros huérfanos
- [ ] Probar en base de datos de desarrollo primero
- [ ] Verificar que la app funciona después de FASE 1
- [ ] Planificar cambios de código para FASE 4

## 🚨 ROLLBACK (Si algo sale mal)

```sql
-- Restaurar desde backup
mysql -u root -p presupuestador < backup_antes_cambios.sql

-- O revertir cambios específicos:
ALTER TABLE insumos MODIFY COLUMN costo INT;
ALTER TABLE presupuestos MODIFY COLUMN DNI INT;
ALTER TABLE presupuestos DROP FOREIGN KEY fk_presupuestos_financiador;
```

## ✅ CONCLUSIÓN

**Cambios seguros para ejecutar HOY:**
- ✅ INT → DECIMAL en costos
- ✅ INT → VARCHAR en DNI
- ✅ Limpiar PKs compuestas
- ✅ Agregar índices

**Cambios que requieren planificación:**
- ⚠️ Agregar FKs (verificar datos primero)
- ⚠️ Migrar Sucursal → sucursal_id (cambios en código)
- ⚠️ VARCHAR → INT en id_servicio (cambios en código)

**Recomendación:** Ejecutar FASE 1 ahora, planificar FASE 4 para próxima iteración.
