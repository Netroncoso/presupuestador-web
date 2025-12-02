# Cambios de Código Requeridos para Migración de BD

## 🔴 CAMBIO 1: Migrar `Sucursal` (VARCHAR) → `sucursal_id` (INT)

### Estado Actual
La app usa el **NOMBRE** de la sucursal (VARCHAR) en lugar del ID.

### Archivos a Modificar

#### 1. `backend/src/controllers/presupuestosControllerV2.ts`

**LÍNEA 15-20 (Crear presupuesto):**
```typescript
// ❌ ANTES
const { nombre, dni, sucursal, dificil_acceso, porcentaje_insumos } = req.body;
await pool.query(`
  INSERT INTO presupuestos 
  (Nombre_Apellido, DNI, Sucursal, dificil_acceso, porcentaje_insumos, usuario_id, version, es_ultima_version, estado) 
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'borrador')
`, [nombre.trim(), dni, sucursal, dificil_acceso || 'no', porcentaje_insumos || 0, usuario_id]);

// ✅ DESPUÉS
const { nombre, dni, sucursal_id, dificil_acceso, porcentaje_insumos } = req.body;
await pool.query(`
  INSERT INTO presupuestos 
  (Nombre_Apellido, DNI, sucursal_id, dificil_acceso, porcentaje_insumos, usuario_id, version, es_ultima_version, estado) 
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, 'borrador')
`, [nombre.trim(), dni, sucursal_id, dificil_acceso || 'no', porcentaje_insumos || 0, usuario_id]);
```

**LÍNEA 80-85 (Cargar para edición):**
```typescript
// ❌ ANTES
const [sucursal] = await pool.query<any[]>(
  'SELECT suc_porcentaje_insumos FROM sucursales_mh WHERE Sucursales_mh = ?',
  [original.Sucursal]
);

// ✅ DESPUÉS
const [sucursal] = await pool.query<any[]>(
  'SELECT suc_porcentaje_insumos FROM sucursales_mh WHERE ID = ?',
  [original.sucursal_id]
);
```

**LÍNEA 120-125 (Nueva versión):**
```typescript
// ❌ ANTES
await pool.query(`
  INSERT INTO presupuestos 
  (Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social, ...)
  VALUES (?, ?, ?, ...)
`, [original.Nombre_Apellido, original.DNI, original.Sucursal, ...]);

// ✅ DESPUÉS
await pool.query(`
  INSERT INTO presupuestos 
  (Nombre_Apellido, DNI, sucursal_id, dificil_acceso, idobra_social, ...)
  VALUES (?, ?, ?, ...)
`, [original.Nombre_Apellido, original.DNI, original.sucursal_id, ...]);
```

**LÍNEA 200-210 (Obtener presupuesto):**
```typescript
// ❌ ANTES
SELECT p.Nombre_Apellido, p.DNI, p.Sucursal, ...

// ✅ DESPUÉS
SELECT 
  p.Nombre_Apellido, 
  p.DNI, 
  p.sucursal_id,
  s.Sucursales_mh as Sucursal,  -- Para compatibilidad con frontend
  ...
FROM presupuestos p
LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
```

#### 2. `backend/src/controllers/sseController.ts`

**LÍNEA 30-35:**
```typescript
// ❌ ANTES
SELECT p.Sucursal, p.costo_total, ...

// ✅ DESPUÉS
SELECT 
  p.sucursal_id,
  s.Sucursales_mh as Sucursal,  -- Para compatibilidad
  p.costo_total, 
  ...
FROM presupuestos p
LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
```

#### 3. `backend/src/routes/auditoria-simple.ts`

**LÍNEA 20-25:**
```typescript
// ❌ ANTES
SELECT p.Nombre_Apellido, p.DNI, p.Sucursal, ...

// ✅ DESPUÉS
SELECT 
  p.Nombre_Apellido, 
  p.DNI, 
  p.sucursal_id,
  s.Sucursales_mh as Sucursal,
  ...
FROM presupuestos p
LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
```

#### 4. `frontend/src/pages/DatosPresupuesto.tsx`

**LÍNEA 50-60 (Estado inicial):**
```typescript
// ❌ ANTES
const [formData, setFormData] = useState({
  nombre: '',
  dni: '',
  sucursal: '',  // VARCHAR
  dificil_acceso: 'no'
});

// ✅ DESPUÉS
const [formData, setFormData] = useState({
  nombre: '',
  dni: '',
  sucursal_id: null,  // INT
  dificil_acceso: 'no'
});
```

**LÍNEA 100-110 (Select de sucursal):**
```typescript
// ❌ ANTES
<Select
  label="Sucursal"
  value={formData.sucursal}
  onChange={(value) => setFormData({...formData, sucursal: value})}
  data={sucursales.map(s => s.Sucursales_mh)}  // Envía nombre
/>

// ✅ DESPUÉS
<Select
  label="Sucursal"
  value={formData.sucursal_id?.toString()}
  onChange={(value) => setFormData({...formData, sucursal_id: parseInt(value)})}
  data={sucursales.map(s => ({
    value: s.ID.toString(),
    label: s.Sucursales_mh
  }))}  // Envía ID, muestra nombre
/>
```

---

## 🔴 CAMBIO 2: Migrar `id_servicio` (VARCHAR) → (INT)

### Estado Actual
El campo `id_servicio` se guarda como STRING cuando debería ser NUMBER.

### Archivos a Modificar

#### 1. `backend/src/controllers/presupuestoPrestacionesController.ts`

**LÍNEA 10-15 (Agregar prestación):**
```typescript
// ❌ ANTES
const { id_servicio, prestacion, cantidad, valor_asignado, valor_facturar } = req.body;
// id_servicio llega como string "123"

await pool.query(`
  INSERT INTO presupuesto_prestaciones 
  (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) 
  VALUES (?, ?, ?, ?, ?, ?)
`, [presupuestoId, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar_final]);

// ✅ DESPUÉS
const { id_servicio, prestacion, cantidad, valor_asignado, valor_facturar } = req.body;
const id_servicio_int = parseInt(id_servicio);  // Convertir a número

await pool.query(`
  INSERT INTO presupuesto_prestaciones 
  (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) 
  VALUES (?, ?, ?, ?, ?, ?)
`, [presupuestoId, id_servicio_int, prestacion, cantidad, valor_asignado, valor_facturar_final]);
```

**LÍNEA 50-55 (Eliminar prestación):**
```typescript
// ❌ ANTES
const { id_servicio } = req.body;
await pool.query(
  'DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND id_servicio = ?',
  [presupuestoId, id_servicio]
);

// ✅ DESPUÉS
const { id_servicio } = req.body;
const id_servicio_int = parseInt(id_servicio);
await pool.query(
  'DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND id_servicio = ?',
  [presupuestoId, id_servicio_int]
);
```

#### 2. `backend/src/controllers/presupuestosControllerV2.ts`

**LÍNEA 150-155 (Copiar prestaciones):**
```typescript
// ❌ ANTES
const prestacionesValues = prestaciones.map(p => [
  nuevoId, 
  p.id_servicio,  // String
  p.prestacion, 
  p.cantidad, 
  p.valor_asignado, 
  p.valor_facturar
]);

// ✅ DESPUÉS
const prestacionesValues = prestaciones.map(p => [
  nuevoId, 
  parseInt(p.id_servicio),  // Convertir a número
  p.prestacion, 
  p.cantidad, 
  p.valor_asignado, 
  p.valor_facturar
]);
```

**LÍNEA 200-205 (Query con JOIN):**
```typescript
// ❌ ANTES (Workaround actual)
LEFT JOIN servicios s ON CAST(pp.id_servicio AS UNSIGNED) = s.id_servicio

// ✅ DESPUÉS (Ya no necesita CAST)
LEFT JOIN servicios s ON pp.id_servicio = s.id_servicio
```

#### 3. `frontend/src/pages/Prestaciones.tsx`

**LÍNEA 80-90 (Agregar prestación):**
```typescript
// ❌ ANTES
const handleAgregarPrestacion = async () => {
  await api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
    id_servicio: selectedServicio,  // String "123"
    prestacion: nombrePrestacion,
    cantidad,
    valor_asignado,
    valor_facturar
  });
};

// ✅ DESPUÉS
const handleAgregarPrestacion = async () => {
  await api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
    id_servicio: parseInt(selectedServicio),  // Number 123
    prestacion: nombrePrestacion,
    cantidad,
    valor_asignado,
    valor_facturar
  });
};
```

**LÍNEA 120-125 (Eliminar prestación):**
```typescript
// ❌ ANTES
const handleEliminarPrestacion = async (id_servicio: string) => {
  await api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
    data: { id_servicio }  // String
  });
};

// ✅ DESPUÉS
const handleEliminarPrestacion = async (id_servicio: string) => {
  await api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
    data: { id_servicio: parseInt(id_servicio) }  // Number
  });
};
```

---

## 📋 RESUMEN DE CAMBIOS

### Cambio 1: Sucursal → sucursal_id

| Archivo | Líneas Aprox | Cambio |
|---------|--------------|--------|
| `presupuestosControllerV2.ts` | 15-20, 80-85, 120-125, 200-210 | Usar `sucursal_id` en lugar de `Sucursal` |
| `sseController.ts` | 30-35 | Agregar JOIN con sucursales_mh |
| `auditoria-simple.ts` | 20-25 | Agregar JOIN con sucursales_mh |
| `DatosPresupuesto.tsx` | 50-60, 100-110 | Cambiar Select para enviar ID |

**Total:** ~8 cambios en 4 archivos

### Cambio 2: id_servicio VARCHAR → INT

| Archivo | Líneas Aprox | Cambio |
|---------|--------------|--------|
| `presupuestoPrestacionesController.ts` | 10-15, 50-55 | Agregar `parseInt()` |
| `presupuestosControllerV2.ts` | 150-155, 200-205 | Agregar `parseInt()` y quitar CAST |
| `Prestaciones.tsx` | 80-90, 120-125 | Agregar `parseInt()` |

**Total:** ~6 cambios en 3 archivos

---

## ✅ ESTRATEGIA RECOMENDADA

### Opción 1: Migración Gradual (RECOMENDADA)
1. Ejecutar `cambios_seguros.sql` (ya pobla `sucursal_id`)
2. Mantener AMBAS columnas (`Sucursal` y `sucursal_id`)
3. Modificar código para usar `sucursal_id`
4. Probar en desarrollo
5. Desplegar a producción
6. Después de 1 semana, eliminar columna `Sucursal` antigua

### Opción 2: Migración Completa
1. Hacer todos los cambios de código
2. Ejecutar script SQL completo
3. Probar todo junto
4. Desplegar

**Recomiendo Opción 1** porque es más segura y permite rollback fácil.

---

## 🧪 TESTING REQUERIDO

Después de hacer los cambios, probar:

- [ ] Crear presupuesto nuevo
- [ ] Editar presupuesto existente
- [ ] Agregar prestaciones
- [ ] Eliminar prestaciones
- [ ] Ver historial de presupuestos
- [ ] Dashboard de auditor
- [ ] Filtros por sucursal

---

## 🔄 ROLLBACK

Si algo falla:
```sql
-- Restaurar backup
mysql -u root -p presupuestador < backup_antes_cambios.sql

-- O revertir código a commit anterior
git revert HEAD
```
