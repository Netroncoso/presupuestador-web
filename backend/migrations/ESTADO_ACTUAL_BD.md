# Estado Actual de la Base de Datos (Después de Cambios)

## ✅ CAMBIOS APLICADOS EXITOSAMENTE

### 1. Tipos de Datos Corregidos
- ✅ `insumos.costo`: INT → **DECIMAL(10,2)** ✓
- ✅ `presupuestos.DNI`: INT → **VARCHAR(20)** ✓
- ✅ `presupuestos.total_insumos`: INT → **DECIMAL(10,2)** ✓
- ✅ `presupuestos.total_prestaciones`: INT → **DECIMAL(10,2)** ✓
- ✅ `presupuestos.costo_total`: INT → **DECIMAL(10,2)** ✓

### 2. Primary Keys Limpias
- ✅ `insumos`: Solo **idInsumos** (PK) + **producto** (UNIQUE)
- ✅ `sucursales_mh`: Solo **ID** (PK) + **Sucursales_mh** (UNIQUE)

### 3. Foreign Keys Agregadas
- ✅ `presupuestos.idobra_social` → `financiador.idobra_social` ✓
- ✅ `presupuestos.usuario_id` → `usuarios.id` ✓
- ✅ `presupuestos.presupuesto_padre` → `presupuestos.idPresupuestos` ✓
- ✅ `usuarios.sucursal_id` → `sucursales_mh.ID` ✓
- ✅ `presupuesto_insumos.id_insumo` → `insumos.idInsumos` ✓

### 4. Nueva Columna
- ✅ `presupuestos.sucursal_id` (INT) creada y poblada con 212 registros

---

## ⚠️ PENDIENTE: Cambios en Código

### Estado Actual de `presupuestos`
```
presupuestos.Sucursal (VARCHAR) ← La app usa esto actualmente
presupuestos.sucursal_id (INT)  ← Nueva columna, poblada pero no usada
```

### Problema: `presupuesto_prestaciones.id_servicio`
```
presupuesto_prestaciones.id_servicio: VARCHAR(50) ← Debería ser INT
```
- ❌ No tiene FK a `servicios.id_servicio`
- ⚠️ Requiere conversión de datos

---

## 📋 CAMBIOS DE CÓDIGO NECESARIOS

### CAMBIO 1: Migrar `Sucursal` → `sucursal_id`

#### Backend (4 archivos)

**1. `backend/src/controllers/presupuestosControllerV2.ts`**

```typescript
// LÍNEA ~15-20: Crear presupuesto
// ❌ ANTES
const { nombre, dni, sucursal, ... } = req.body;
INSERT INTO presupuestos (Nombre_Apellido, DNI, Sucursal, ...)

// ✅ DESPUÉS
const { nombre, dni, sucursal_id, ... } = req.body;
INSERT INTO presupuestos (Nombre_Apellido, DNI, sucursal_id, ...)
```

```typescript
// LÍNEA ~80-85: Cargar para edición
// ❌ ANTES
SELECT suc_porcentaje_insumos FROM sucursales_mh WHERE Sucursales_mh = ?
[original.Sucursal]

// ✅ DESPUÉS
SELECT suc_porcentaje_insumos FROM sucursales_mh WHERE ID = ?
[original.sucursal_id]
```

```typescript
// LÍNEA ~120-125: Nueva versión
// ❌ ANTES
INSERT INTO presupuestos (..., Sucursal, ...)
VALUES (..., original.Sucursal, ...)

// ✅ DESPUÉS
INSERT INTO presupuestos (..., sucursal_id, ...)
VALUES (..., original.sucursal_id, ...)
```

```typescript
// LÍNEA ~200-210: Obtener presupuesto
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

**2. `backend/src/controllers/sseController.ts`**

```typescript
// LÍNEA ~30-35
// ❌ ANTES
SELECT p.Sucursal, p.costo_total, ...

// ✅ DESPUÉS
SELECT 
  p.sucursal_id,
  s.Sucursales_mh as Sucursal,
  p.costo_total, 
  ...
FROM presupuestos p
LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
```

**3. `backend/src/routes/auditoria-simple.ts`**

```typescript
// LÍNEA ~20-25
// Similar al cambio anterior, agregar JOIN
```

**4. `backend/src/controllers/sucursalesController.ts`**

```typescript
// Verificar si necesita cambios (probablemente no)
```

#### Frontend (1 archivo)

**5. `frontend/src/pages/DatosPresupuesto.tsx`**

```typescript
// LÍNEA ~50-60: Estado inicial
// ❌ ANTES
const [formData, setFormData] = useState({
  nombre: '',
  dni: '',
  sucursal: '',  // VARCHAR
  ...
});

// ✅ DESPUÉS
const [formData, setFormData] = useState({
  nombre: '',
  dni: '',
  sucursal_id: null,  // INT
  ...
});
```

```typescript
// LÍNEA ~100-110: Select de sucursal
// ❌ ANTES
<Select
  value={formData.sucursal}
  onChange={(value) => setFormData({...formData, sucursal: value})}
  data={sucursales.map(s => s.Sucursales_mh)}  // Envía nombre
/>

// ✅ DESPUÉS
<Select
  value={formData.sucursal_id?.toString()}
  onChange={(value) => setFormData({...formData, sucursal_id: parseInt(value)})}
  data={sucursales.map(s => ({
    value: s.ID.toString(),
    label: s.Sucursales_mh
  }))}  // Envía ID, muestra nombre
/>
```

---

### CAMBIO 2: Convertir `id_servicio` VARCHAR → INT

⚠️ **ESTE CAMBIO ES MÁS COMPLEJO** porque requiere:

1. Verificar que todos los valores sean numéricos
2. Crear columna temporal
3. Migrar datos
4. Eliminar columna antigua
5. Renombrar columna nueva
6. Agregar FK
7. Modificar código TypeScript

**Recomendación:** Hacer este cambio en una segunda fase.

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: Migrar a `sucursal_id` (HOY)
1. ✅ Base de datos lista (columna creada y poblada)
2. 🔄 Modificar 4 archivos backend
3. 🔄 Modificar 1 archivo frontend
4. 🧪 Probar en desarrollo
5. 🚀 Desplegar a producción
6. ⏳ Esperar 1 semana
7. 🗑️ Eliminar columna `Sucursal` antigua

### FASE 2: Convertir `id_servicio` (DESPUÉS)
1. Verificar datos
2. Crear migración SQL
3. Modificar código
4. Probar
5. Desplegar

---

## 📊 RESUMEN COMPARATIVO

| Campo | Antes | Ahora | Código Usa |
|-------|-------|-------|------------|
| `insumos.costo` | INT | DECIMAL(10,2) ✅ | ✅ Compatible |
| `presupuestos.DNI` | INT | VARCHAR(20) ✅ | ✅ Compatible |
| `presupuestos.Sucursal` | VARCHAR | VARCHAR | ✅ Código actual |
| `presupuestos.sucursal_id` | ❌ No existía | INT ✅ | ❌ No usado aún |
| `presupuestos.idobra_social` FK | ❌ No | ✅ Sí | ✅ Compatible |
| `presupuesto_prestaciones.id_servicio` | VARCHAR | VARCHAR | ⚠️ Necesita cambio |

---

## ✅ SIGUIENTE PASO

Modificar el código para usar `sucursal_id` en lugar de `Sucursal`.

¿Empezamos con el backend o el frontend?
