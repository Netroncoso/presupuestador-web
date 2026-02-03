# Problemas de Performance y Código Duplicado Identificados

## 📊 1. QUERIES N+1

### ✅ Ya Optimizados (según OPTIMIZACION_N+1.md)
- `backend/src/controllers/presupuestoInsumosController.ts` - ✅ Optimizado con JOINs
- `backend/src/controllers/presupuestoPrestacionesController.ts` - ✅ Optimizado con JOINs

### ⚠️ Posibles N+1 Pendientes

#### `backend/src/controllers/prestacionesController.ts`
**Línea 22-86:** `getPrestacionesPorPrestador`
- **Problema:** Subqueries anidadas complejas que podrían ejecutarse múltiples veces
- **Query:** Múltiples subqueries con `SELECT valor_asignado`, `SELECT valor_facturar`, `SELECT DATEDIFF` dentro del SELECT principal
- **Impacto:** Si se llama desde un loop, cada subquery se ejecuta N veces
- **Recomendación:** Revisar si se usa en loops o considerar JOINs

#### `backend/src/services/auditoriaMultiService.ts`
**Múltiples líneas:** Varias funciones con `SELECT * FROM presupuestos WHERE idPresupuestos = ?`
- **Líneas:** 131, 201, 252, 322, 409, 491, 567
- **Problema:** Si se procesan múltiples presupuestos, cada uno hace una query separada
- **Recomendación:** Si se procesan en batch, usar `WHERE idPresupuestos IN (?)`

#### `backend/src/controllers/equipamientosController.ts`
**Línea 168, 258:** `SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND idobra_social = ?`
- **Problema:** Si se procesan múltiples equipamientos, cada uno hace una query
- **Recomendación:** Si es en batch, usar `WHERE id_equipamiento IN (?)`

---

## 💾 2. CACHE - Estrategias a Verificar

### ✅ Cache Implementado
- `backend/src/services/cacheService.ts` - Servicio de cache con NodeCache
- TTL por defecto: 300 segundos (5 minutos)

### ⚠️ Archivos que Usan Cache (verificar estrategias)

#### `backend/src/controllers/prestacionesController.ts`
**Línea 7-15:** `getPrestadores`
- **Cache:** ✅ Implementado (30 min)
- **Key:** `prestadores:all`
- **Estado:** ✅ Correcto

#### `backend/src/services/reportesFinancierosService.ts`
**Línea 7-58:** `obtenerKPIs`
- **Cache:** ✅ Implementado
- **Key:** `reportes:kpis:${periodo}`
- **Estado:** ✅ Correcto

### ❌ Archivos SIN Cache que Deberían Tenerlo

#### `backend/src/controllers/insumosController.ts`
**Línea 5-16:** `getInsumos`
- **Problema:** No usa cache, se ejecuta en cada request
- **Impacto:** Lista completa de insumos en cada carga
- **Recomendación:** Agregar cache con key `insumos:all`, TTL 30 min

#### `backend/src/controllers/equipamientosController.ts`
**Línea 7-15:** `getAllEquipamientos`
- **Problema:** No usa cache
- **Impacto:** Lista completa en cada request
- **Recomendación:** Agregar cache con key `equipamientos:all`, TTL 30 min

**Línea 18-27:** `getEquipamientos` (catálogo activo)
- **Problema:** No usa cache
- **Recomendación:** Agregar cache con key `equipamientos:activos`, TTL 30 min

#### `backend/src/controllers/adminUsuariosController.ts`
**Línea 7-15:** `getUsuarios`
- **Problema:** No usa cache
- **Impacto:** Lista completa de usuarios en cada request
- **Recomendación:** Cache con invalidación en CREATE/UPDATE/DELETE

#### `backend/src/controllers/prestacionesController.ts`
**Línea 17-86:** `getPrestacionesPorPrestador`
- **Problema:** Query compleja sin cache
- **Impacto:** Query costosa en cada request
- **Recomendación:** Cache con key `prestaciones:${id}:${fecha}:${sucursalId}`, TTL 15 min

#### `backend/src/controllers/equipamientosController.ts`
**Línea 30-119:** `getEquipamientosPorFinanciador`
- **Problema:** Query compleja sin cache
- **Recomendación:** Cache con key `equipamientos:${financiadorId}:${fecha}:${sucursalId}`, TTL 15 min

---

## 📄 3. PAGINACIÓN - Listados Sin Paginación

### ✅ Con Paginación Implementada

#### `backend/src/controllers/presupuestosControllerV2.ts`
**Línea 75-119:** `listarPresupuestos`
- **Paginación:** ✅ Implementada
- **Parámetros:** `limit`, `offset`
- **Estado:** ✅ Correcto

#### `backend/src/controllers/notificacionesController.ts`
**Línea 8-53:** `obtenerNotificaciones`
- **Paginación:** ✅ Implementada
- **Parámetros:** `page`, `limit`
- **Estado:** ✅ Correcto

### ❌ SIN Paginación (Problemas)

#### `backend/src/controllers/insumosController.ts`
**Línea 5-16:** `getInsumos`
- **Problema:** Retorna TODOS los insumos sin límite
- **Impacto:** Si hay 1000+ insumos, carga lenta
- **Recomendación:** Agregar `LIMIT ? OFFSET ?` con parámetros `page` y `limit`

#### `backend/src/controllers/equipamientosController.ts`
**Línea 7-15:** `getAllEquipamientos`
- **Problema:** Retorna TODOS los equipamientos
- **Recomendación:** Agregar paginación

**Línea 18-27:** `getEquipamientos` (activos)
- **Problema:** Retorna TODOS los activos
- **Recomendación:** Agregar paginación

#### `backend/src/controllers/adminUsuariosController.ts`
**Línea 7-15:** `getUsuarios`
- **Problema:** Retorna TODOS los usuarios
- **Impacto:** Si hay muchos usuarios, carga lenta
- **Recomendación:** Agregar paginación con `LIMIT ? OFFSET ?`

#### `backend/src/controllers/prestacionesController.ts`
**Línea 7-15:** `getPrestadores`
- **Problema:** Retorna TODOS los prestadores
- **Recomendación:** Agregar paginación (aunque probablemente sean pocos)

**Línea 17-86:** `getPrestacionesPorPrestador`
- **Problema:** Retorna TODAS las prestaciones de un prestador
- **Impacto:** Si un prestador tiene 500+ servicios, carga lenta
- **Recomendación:** Agregar paginación opcional

#### `backend/src/controllers/equipamientosController.ts`
**Línea 30-119:** `getEquipamientosPorFinanciador`
- **Problema:** Retorna TODOS los equipamientos de un financiador
- **Recomendación:** Agregar paginación opcional

#### `backend/src/controllers/tiposUnidadController.ts`
- **Recomendación:** Verificar si retorna todos sin límite

---

## 🔄 4. CÓDIGO DUPLICADO

### ❌ Función `recalcularTotales` Duplicada

#### `backend/src/controllers/presupuestoInsumosController.ts`
**Línea 6-56:** Función `recalcularTotales`
- **Código:** ~50 líneas de lógica de cálculo

#### `backend/src/controllers/presupuestoPrestacionesController.ts`
**Línea 6-56:** Función `recalcularTotales`
- **Código:** ~50 líneas IDÉNTICAS

**Problema:** Misma función duplicada en 2 archivos
**Solución:** Mover a `backend/src/services/calculosService.ts` o `backend/src/utils/presupuestoUtils.ts`

---

### ❌ Patrones Repetidos en Componentes Admin (Frontend)

#### Patrón CRUD Completo Duplicado

**Archivos con estructura casi idéntica:**

1. **`frontend/src/pages/admin/GestionInsumos.tsx`**
   - Líneas 15-267: CRUD completo
   - Patrón: `useState` → `cargarDatos` → `handleSubmit` → `handleEdit` → `confirmDelete`

2. **`frontend/src/pages/admin/GestionEquipamientosBase.tsx`**
   - Líneas 23-419: CRUD completo
   - **Mismo patrón** que GestionInsumos

3. **`frontend/src/pages/admin/GestionServicios.tsx`**
   - Líneas 14-364: CRUD completo
   - **Mismo patrón** con pequeñas variaciones

4. **`frontend/src/pages/admin/GestionAlertasServicios.tsx`**
   - Líneas 26-421: CRUD completo
   - **Mismo patrón** con validaciones adicionales

**Código Duplicado Identificado:**

```typescript
// Patrón repetido en TODOS los archivos:
const [items, setItems] = useState<Item[]>([]);
const [filtro, setFiltro] = useState('');
const [modalOpen, setModalOpen] = useState(false);
const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [formData, setFormData] = useState({ ... });
const [loading, setLoading] = useState(false);

const cargarItems = async () => { /* mismo patrón */ };
const handleSubmit = async () => { /* mismo patrón */ };
const handleEdit = (item: Item) => { /* mismo patrón */ };
const openDeleteModal = (item: Item) => { /* mismo patrón */ };
const confirmDelete = async () => { /* mismo patrón */ };
```

**Solución Recomendada:**
- Crear hook personalizado: `frontend/src/hooks/useCrudAdmin.tsx`
- O componente genérico: `frontend/src/components/AdminCrud.tsx`

---

### ❌ Validaciones Repetidas

#### Validación de Campos Obligatorios

**Archivos con validación similar:**

1. **`frontend/src/pages/admin/GestionInsumos.tsx`**
   - Línea 53: `if (!formData.producto || formData.costo <= 0)`
   - Mensaje: "Complete todos los campos correctamente"

2. **`frontend/src/pages/admin/GestionEquipamientosBase.tsx`**
   - Línea 85: `if (!formData.nombre || !formData.tipo || formData.precio_referencia <= 0)`
   - Mensaje: "Complete todos los campos"

3. **`frontend/src/pages/admin/GestionAlertasServicios.tsx`**
   - Línea 104: `if (!formData.tipo_unidad || formData.cantidad_maxima <= 0)`
   - Mensaje: "Complete todos los campos correctamente"

4. **`frontend/src/pages/admin/GestionServicios.tsx`**
   - Línea 66: `if (!formData.nombre)`
   - Mensaje: "Complete el nombre del servicio"

5. **`frontend/src/pages/Prestaciones.tsx`**
   - Línea 290: `if (!prestacionSeleccionada || !cantidad || !valorAsignado)`
   - Mensaje: "Complete todos los campos"

6. **`frontend/src/components/Equipamiento.tsx`**
   - Línea 115: Validación similar
   - Mensaje: "Complete todos los campos"

**Solución Recomendada:**
- Crear utilidad: `frontend/src/utils/validations.ts`
- O hook: `frontend/src/hooks/useFormValidation.tsx`

---

### ❌ Manejo de Notificaciones Repetido

**Patrón repetido en múltiples archivos:**

```typescript
// Patrón repetido:
notifications.show({
  title: 'Error',
  message: 'Error al cargar...',
  color: 'red'
});

notifications.show({
  title: 'Éxito',
  message: '... actualizado correctamente',
  color: 'green'
});
```

**Archivos afectados:**
- `GestionInsumos.tsx` (líneas 44-48, 66-70, 74-77, 85-89, 113-116, 122-125)
- `GestionEquipamientosBase.tsx` (líneas 67-71, 99-102, 106-109, 117-121, 149-153, 159-163)
- `GestionServicios.tsx` (similar)
- `GestionAlertasServicios.tsx` (similar)
- `Prestaciones.tsx` (líneas 291-296, 303-308, 330-338)

**Solución Recomendada:**
- Crear helper: `frontend/src/utils/notifications.ts`
- Funciones: `showError()`, `showSuccess()`, `showWarning()`

---

### ❌ Formato de Moneda Repetido

**Archivos con formato similar:**

1. **`frontend/src/pages/admin/GestionEquipamientosBase.tsx`**
   - Línea 45-51: `formatPeso(value: number)`
   - Formato: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`

2. **`frontend/src/pages/admin/GestionInsumos.tsx`**
   - Probablemente tiene formato similar (verificar)

**Solución Recomendada:**
- Crear utilidad: `frontend/src/utils/format.ts`
- Función: `formatCurrency(value: number): string`

---

## 📋 Resumen de Archivos Afectados

### Backend

#### Queries N+1 Potenciales:
- `backend/src/controllers/prestacionesController.ts` (línea 22-86)
- `backend/src/services/auditoriaMultiService.ts` (múltiples líneas)
- `backend/src/controllers/equipamientosController.ts` (líneas 168, 258)

#### Cache Faltante:
- `backend/src/controllers/insumosController.ts`
- `backend/src/controllers/equipamientosController.ts` (2 funciones)
- `backend/src/controllers/adminUsuariosController.ts`
- `backend/src/controllers/prestacionesController.ts` (getPrestacionesPorPrestador)
- `backend/src/controllers/equipamientosController.ts` (getEquipamientosPorFinanciador)

#### Paginación Faltante:
- `backend/src/controllers/insumosController.ts`
- `backend/src/controllers/equipamientosController.ts` (2 funciones)
- `backend/src/controllers/adminUsuariosController.ts`
- `backend/src/controllers/prestacionesController.ts` (2 funciones)
- `backend/src/controllers/equipamientosController.ts` (getEquipamientosPorFinanciador)

#### Código Duplicado:
- `backend/src/controllers/presupuestoInsumosController.ts` (recalcularTotales)
- `backend/src/controllers/presupuestoPrestacionesController.ts` (recalcularTotales)

### Frontend

#### Código Duplicado (CRUD):
- `frontend/src/pages/admin/GestionInsumos.tsx`
- `frontend/src/pages/admin/GestionEquipamientosBase.tsx`
- `frontend/src/pages/admin/GestionServicios.tsx`
- `frontend/src/pages/admin/GestionAlertasServicios.tsx`

#### Validaciones Repetidas:
- `frontend/src/pages/admin/GestionInsumos.tsx`
- `frontend/src/pages/admin/GestionEquipamientosBase.tsx`
- `frontend/src/pages/admin/GestionAlertasServicios.tsx`
- `frontend/src/pages/admin/GestionServicios.tsx`
- `frontend/src/pages/Prestaciones.tsx`
- `frontend/src/components/Equipamiento.tsx`

#### Notificaciones Repetidas:
- Todos los archivos de admin mencionados
- `frontend/src/pages/Prestaciones.tsx`

#### Formato Repetido:
- `frontend/src/pages/admin/GestionEquipamientosBase.tsx` (formatPeso)

---

## 🎯 Prioridad de Corrección

### 🔴 Alta Prioridad
1. **Código duplicado `recalcularTotales`** - Backend (fácil de corregir)
2. **Cache en listados grandes** - Backend (insumos, equipamientos, usuarios)
3. **Paginación en listados** - Backend (mismo impacto que cache)

### 🟡 Media Prioridad
4. **Hook CRUD genérico** - Frontend (reduce duplicación significativa)
5. **Utilidades de validación** - Frontend
6. **Helper de notificaciones** - Frontend

### 🟢 Baja Prioridad
7. **Queries N+1 potenciales** - Backend (verificar si realmente ocurren)
8. **Formato de moneda** - Frontend (duplicación menor)

---

**Fecha de análisis:** Enero 2025
**Versión analizada:** v3.2






