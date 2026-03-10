# Guía de Implementación - Mejoras Sistema de Presupuestos

**Fecha:** 11 de Febrero de 2025  
**Versión:** 1.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Problema 1: Unidades Base para Combos](#problema-1-unidades-base-para-combos)
3. [Problema 2: Recargos por Horas Nocturnas](#problema-2-recargos-por-horas-nocturnas)
4. [Problema 3: Recargo por Difícil Acceso](#problema-3-recargo-por-difícil-acceso)
5. [Problema 4: Servicios Duplicados con Diferentes Recargos](#problema-4-servicios-duplicados-con-diferentes-recargos)
6. [Plan de Implementación](#plan-de-implementación)
7. [Casos de Uso](#casos-de-uso)

---

## Resumen Ejecutivo

### Problemas Identificados

1. **Unidades Base**: Los servicios "combo" (ej: Guardia 4 hs) no calculan correctamente el costo porque el tarifario es por hora
2. **Horas Nocturnas**: No existe forma de aplicar recargo por horas nocturnas sobre servicios base
3. **Difícil Acceso**: El porcentaje está en sucursal (incorrecto), debería estar en financiador
4. **Duplicados**: No se puede agregar el mismo servicio con diferentes configuraciones (normal + nocturno)

### Solución Propuesta

Sistema de recargos configurables por financiador con soporte para múltiples instancias del mismo servicio.

---

## Problema 1: Unidades Base para Combos

### 🎯 Objetivo

Permitir que servicios "combo" calculen correctamente el costo multiplicando por las unidades del tarifario que componen el servicio.

### 📊 Situación Actual

```
Servicio Financiador: "Guardia 4 hs Adulto" → Precio: $20,000
Servicio Tarifario: "Hora cuidador" → Costo: $1,500/hora

❌ Cálculo Incorrecto:
Costo = $1,500 × 1 = $1,500
Utilidad = $20,000 - $1,500 = $18,500 (INCORRECTO)
```

### ✅ Solución

Agregar campo `unidades_base` que indica cuántas unidades del tarifario componen el servicio.

```
Servicio Financiador: "Guardia 4 hs Adulto"
- Precio: $20,000
- unidades_base: 4

✅ Cálculo Correcto:
Costo = $1,500 × 4 = $6,000
Utilidad = $20,000 - $6,000 = $14,000 (CORRECTO)
```

### 🗄️ Cambios en Base de Datos

```sql
-- Migración 018: Agregar unidades_base
ALTER TABLE financiador_servicio
ADD COLUMN unidades_base DECIMAL(10,2) DEFAULT 1 
COMMENT 'Cantidad de unidades del tarifario que componen este servicio';

-- Ejemplos de datos
UPDATE financiador_servicio SET unidades_base = 4 WHERE nombre LIKE '%4 hs%';
UPDATE financiador_servicio SET unidades_base = 8 WHERE nombre LIKE '%8 hs%';
UPDATE financiador_servicio SET unidades_base = 12 WHERE nombre LIKE '%12 hs%';
```

### 💻 Cambios en Código

**Backend - Tipos TypeScript:**
```typescript
interface ServicioFinanciador {
  id_financiador_servicio: number;
  servicio_id: number;
  nombre: string;
  precio_facturar: number;
  unidades_base: number;  // NUEVO
}
```

**Frontend - Cálculo de Costo:**
```typescript
// En SelectorDualServicios.tsx
const costoTotal = precioCosto * servicioFinanciador.unidades_base * cantidad;
```

### 👤 Experiencia de Usuario

**Panel de Administración:**
```
Gestión de Servicios por Financiador

Servicio: Guardia 4 hs Adulto
Precio: $20,000
Unidades Base: [4] ← Admin configura aquí
```

**Al Crear Presupuesto:**
```
Usuario selecciona: "Guardia 4 hs Adulto"
Sistema calcula automáticamente:
- Precio: $20,000
- Costo: $1,500/hora × 4 horas = $6,000
- Utilidad: $14,000
```

---

## Problema 2: Recargos por Horas Nocturnas

### 🎯 Objetivo

Permitir aplicar recargo porcentual por horas nocturnas sobre servicios específicos.

### 📊 Situación Actual

```
❌ No existe forma de aplicar recargo nocturno
Usuario debe crear servicio separado "Cuidador Hora Nocturna"
```

### ✅ Solución

Agregar campo `porcentaje_horas_nocturnas` por servicio y checkbox en UI para aplicarlo.

### 🗄️ Cambios en Base de Datos

```sql
-- Migración 018: Agregar recargo nocturno

-- 1. Porcentaje global en financiador
ALTER TABLE financiador
ADD COLUMN porcentaje_horas_nocturnas DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por horas nocturnas (aplica a servicios que lo permitan)';

-- 2. Flag por servicio: ¿admite recargo nocturno?
ALTER TABLE financiador_servicio
ADD COLUMN admite_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si este servicio admite recargo por horas nocturnas';

-- 3. Histórico en presupuestos
ALTER TABLE presupuesto_prestaciones
ADD COLUMN aplicar_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si se aplicó recargo por horas nocturnas',
ADD COLUMN porcentaje_aplicado DECIMAL(5,2) DEFAULT 0 
COMMENT 'Porcentaje de recargo aplicado (para histórico)';
```

### 💻 Cambios en Código

**Backend - Tipos TypeScript:**
```typescript
interface Financiador {
  id: number;
  Financiador: string;
  porcentaje_horas_nocturnas: number;  // NUEVO: % global
  porcentaje_dificil_acceso: number;
}

interface ServicioFinanciador {
  // ... campos existentes
  admite_horas_nocturnas: boolean;     // NUEVO: flag si admite
}

interface ServicioConvenio {
  // ... campos existentes
  aplicar_horas_nocturnas: boolean;     // NUEVO
  porcentaje_horas_nocturnas: number;   // NUEVO: copiado del financiador
  precio_base: number;                  // NUEVO
  clave_unica: string;                  // NUEVO: "id_nocturno"
}
```

**Frontend - Cálculo con Recargo:**
```typescript
// En SelectorDualServicios.tsx
let precioFinal = servicioFinanciador.precio_facturar;

// Usar porcentaje del FINANCIADOR, no del servicio
if (aplicarHorasNocturnas && financiador.porcentaje_horas_nocturnas > 0) {
  precioFinal *= (1 + financiador.porcentaje_horas_nocturnas / 100);
}

const costoTotal = precioCosto * servicioFinanciador.unidades_base * cantidad;
const utilidad = precioFinal * cantidad - costoTotal;
```

### 👤 Experiencia de Usuario

**Panel de Administración:**

**1. Configuración del Financiador:**
```
Gestión de Financiadores

Financiador: Swiss Medical
% Horas Nocturnas: [30] ← Admin configura % GLOBAL aquí
% Difícil Acceso: [15]
```

**2. Configuración del Servicio:**
```
Gestión de Servicios por Financiador

Servicio: Cuidador Hora
Precio: $5,000
☑ Admite Horas Nocturnas ← Admin marca si aplica
```

**Al Crear Presupuesto:**
```
┌─────────────────────────────────────┐
│ Servicio: Cuidador Hora             │
│ Cantidad: [6]                       │
│ ☑ Horas Nocturnas (+30%)            │
│    ↑ Checkbox habilitado porque     │
│      servicio admite_horas_nocturnas│
│    ↑ Porcentaje viene del financiador│
│                                     │
│ Precio: $6,500 × 6 = $39,000       │
│ Costo: $3,200 × 6 = $19,200        │
│ Utilidad: $19,800                   │
└─────────────────────────────────────┘
```

**Si servicio NO admite nocturno:**
```
┌─────────────────────────────────────┐
│ Servicio: Guardia 4 hs              │
│ Cantidad: [2]                       │
│ ☐ Horas Nocturnas (deshabilitado)  │
│    ↑ Checkbox deshabilitado porque  │
│      servicio NO admite nocturno    │
└─────────────────────────────────────┘
```

---

## Problema 3: Recargo por Difícil Acceso

### 🎯 Objetivo

Mover el porcentaje de difícil acceso de sucursal a financiador (donde corresponde).

### 📊 Situación Actual

```
❌ Tabla sucursales_mh:
   - suc_porcentaje_dificil_acceso (INCORRECTO)

❌ Tabla presupuestos:
   - dificil_acceso VARCHAR(2) → Solo "si"/"no"
   - No se aplica ningún porcentaje
```

### ✅ Solución

Agregar campo `porcentaje_dificil_acceso` en tabla `financiador`.

### 🗄️ Cambios en Base de Datos

```sql
-- Migración 018: Agregar recargo difícil acceso
ALTER TABLE financiador 
ADD COLUMN porcentaje_dificil_acceso DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por zona desfavorable (aplica a todos los servicios)';

-- Opcional: Eliminar columna obsoleta
-- ALTER TABLE sucursales_mh DROP COLUMN suc_porcentaje_dificil_acceso;
```

### 💻 Cambios en Código

**Backend - Cálculo de Totales:**
```typescript
// En presupuestoCalculosService.ts
if (presupuesto.dificil_acceso === 'si' && financiador.porcentaje_dificil_acceso > 0) {
  totalPrestaciones *= (1 + financiador.porcentaje_dificil_acceso / 100);
}
```

**Frontend - Mostrar Recargo:**
```typescript
// En DatosPresupuesto.tsx
<Checkbox
  label={`Zona Desfavorable ${financiador?.porcentaje_dificil_acceso > 0 ? `(+${financiador.porcentaje_dificil_acceso}%)` : ''}`}
  checked={dificilAcceso}
  onChange={(e) => setDificilAcceso(e.target.checked)}
/>
```

### 👤 Experiencia de Usuario

**Panel de Administración:**
```
Gestión de Financiadores

Financiador: Swiss Medical
% Difícil Acceso: [15] ← Admin configura aquí
```

**Al Crear Presupuesto:**
```
Datos del Paciente:
☑ Zona Desfavorable (+15%)

Efecto:
- Todos los servicios del presupuesto se multiplican por 1.15
```

---

## Problema 4: Servicios Duplicados con Diferentes Recargos

### 🎯 Objetivo

Permitir agregar el mismo servicio múltiples veces con diferentes configuraciones (normal + nocturno).

### 📊 Situación Actual

```
❌ No se puede agregar "Enfermería" dos veces:
   - Una sin recargo nocturno
   - Otra con recargo nocturno
```

### ✅ Solución

Cambiar lógica de identificación única usando clave compuesta: `id_servicio + aplicar_nocturno`.

### 💻 Cambios en Código

**Frontend - Clave Única:**
```typescript
// En SelectorDualServicios.tsx
const claveUnica = `${servicioFinanciador.id_financiador_servicio}_${aplicarHorasNocturnas}`;

const yaExiste = serviciosSeleccionados.some(s => s.clave_unica === claveUnica);

// Deshabilitar checkbox solo si existe esa combinación específica
disabled={serviciosSeleccionados.some(s => 
  s.id_servicio_financiador === servicio.id_financiador_servicio &&
  s.aplicar_horas_nocturnas === aplicarHorasNocturnas
)}
```

**Frontend - Mostrar en Tabla:**
```typescript
// Agregar indicador visual
<Table.Td>
  {servicio.nombre}
  {servicio.aplicar_horas_nocturnas && ' 🌙'}
</Table.Td>
```

### 👤 Experiencia de Usuario

**Flujo Completo:**

1. Usuario selecciona "Enfermería" → Cantidad: 6 → ☐ Nocturno → [Agregar]
2. Usuario selecciona "Enfermería" → Cantidad: 6 → ☑ Nocturno → [Agregar]

**Resultado en Tabla:**
```
┌────────────────────────────────────────────────────┐
│ Servicio           │ Cant │ Total P │ Total C     │
├────────────────────────────────────────────────────┤
│ Enfermería         │  6   │ $30,000 │ $19,200     │
│ Enfermería 🌙      │  6   │ $39,000 │ $19,200     │
│                    │      │ (+30%)  │             │
└────────────────────────────────────────────────────┘
```

---

## Plan de Implementación

### Fase 1: Base de Datos (1 día)

**Migración 018: Mejoras Sistema de Servicios**

```sql
-- 1. Unidades base para combos
ALTER TABLE financiador_servicio
ADD COLUMN unidades_base DECIMAL(10,2) DEFAULT 1 
COMMENT 'Cantidad de unidades del tarifario que componen este servicio';

-- 2. Recargo por horas nocturnas (global por financiador)
ALTER TABLE financiador
ADD COLUMN porcentaje_horas_nocturnas DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por horas nocturnas (aplica a servicios que lo permitan)';

-- 2b. Flag por servicio: ¿admite recargo nocturno?
ALTER TABLE financiador_servicio
ADD COLUMN admite_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si este servicio admite recargo por horas nocturnas';

-- 3. Recargo por difícil acceso (global por financiador)
ALTER TABLE financiador 
ADD COLUMN porcentaje_dificil_acceso DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por zona desfavorable (aplica a todos los servicios)';

-- 4. Histórico de recargos aplicados
ALTER TABLE presupuesto_prestaciones
ADD COLUMN aplicar_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si se aplicó recargo por horas nocturnas',
ADD COLUMN porcentaje_aplicado DECIMAL(5,2) DEFAULT 0 
COMMENT 'Porcentaje de recargo aplicado (para histórico)';

-- 5. Índices para performance
CREATE INDEX idx_financiador_servicio_unidades ON financiador_servicio(unidades_base);
CREATE INDEX idx_prestaciones_nocturnas ON presupuesto_prestaciones(aplicar_horas_nocturnas);
```

**Ejecutar:**
```bash
mysql -u root -p mh_1 < backend/migrations/018_mejoras_sistema_servicios.sql
```

### Fase 2: Backend (2 días)

**2.1. Actualizar Tipos TypeScript**

Archivo: `backend/src/types/database.ts`
```typescript
interface ServicioFinanciador {
  id_financiador_servicio: number;
  servicio_id: number;
  nombre: string;
  precio_facturar: number;
  unidades_base: number;
  admite_horas_nocturnas: boolean;  // NUEVO
}

interface Financiador {
  id: number;
  Financiador: string;
  porcentaje_horas_nocturnas: number;  // NUEVO
  porcentaje_dificil_acceso: number;
  // ... otros campos
}
```

**2.2. Actualizar Queries**

Archivo: `backend/src/services/financiadoresService.ts`
```typescript
// Incluir nuevos campos en SELECT
SELECT 
  fs.id,
  fs.financiador_id,
  fs.servicio_id,
  s.nombre,
  fsv.precio_facturar,
  fs.unidades_base,
  fs.admite_horas_nocturnas,
  f.porcentaje_horas_nocturnas
FROM financiador_servicio fs
JOIN financiador_servicio_valores fsv ON fs.id = fsv.financiador_servicio_id
JOIN servicios s ON fs.servicio_id = s.id
JOIN financiador f ON fs.financiador_id = f.id
WHERE fs.financiador_id = ? AND fsv.zona_financiador_id = ?
```

**2.3. Actualizar Cálculos**

Archivo: `backend/src/services/presupuestoCalculosService.ts`
```typescript
// Aplicar recargo por difícil acceso
if (presupuesto.dificil_acceso === 'si' && financiador.porcentaje_dificil_acceso > 0) {
  totalPrestaciones *= (1 + financiador.porcentaje_dificil_acceso / 100);
}
```

### Fase 3: Frontend (3 días)

**3.1. Actualizar Tipos**

Archivo: `frontend/src/types/index.ts`
```typescript
export interface ServicioFinanciador {
  id_financiador_servicio: number;
  servicio_id: number;
  nombre: string;
  precio_facturar: number;
  unidades_base: number;
  admite_horas_nocturnas: boolean;  // NUEVO
}

export interface Financiador {
  id: number;
  Financiador: string;
  porcentaje_horas_nocturnas: number;  // NUEVO
  porcentaje_dificil_acceso: number;
}

export interface ServicioConvenio {
  id_servicio_financiador: number;
  servicio_id: number;
  nombre: string;
  cantidad: number;
  precio_facturar: number;
  precio_costo: number;
  utilidad: number;
  aplicar_horas_nocturnas: boolean;
  porcentaje_horas_nocturnas: number;
  precio_base: number;
  clave_unica: string;
}
```

**3.2. Actualizar SelectorDualServicios**

Archivo: `frontend/src/components/SelectorDualServicios.tsx`

Agregar:
- Estado `aplicarHorasNocturnas`
- Checkbox para horas nocturnas (habilitado solo si `servicio.admite_horas_nocturnas`)
- Usar `financiador.porcentaje_horas_nocturnas` para cálculo
- Lógica de clave única
- Indicador visual en tabla (🌙)

**3.3. Actualizar DatosPresupuesto**

Archivo: `frontend/src/pages/DatosPresupuesto.tsx`

Modificar checkbox:
```typescript
<Checkbox
  label={`Zona Desfavorable ${financiador?.porcentaje_dificil_acceso > 0 ? `(+${financiador.porcentaje_dificil_acceso}%)` : ''}`}
  checked={dificilAcceso}
  onChange={(e) => setDificilAcceso(e.target.checked)}
/>
```

**3.4. Panel de Administración**

Crear/Actualizar:
- `GestionServiciosFinanciador.tsx`: Agregar campos `unidades_base` y `porcentaje_horas_nocturnas`
- `GestionFinanciadores.tsx`: Agregar campo `porcentaje_dificil_acceso`

### Fase 4: Testing (1 día)

**4.1. Tests Unitarios**
- Cálculo de costo con unidades_base
- Cálculo de precio con recargo nocturno
- Cálculo de total con difícil acceso
- Clave única para duplicados

**4.2. Tests de Integración**
- Crear presupuesto con combo (4 hs)
- Agregar servicio con recargo nocturno
- Agregar mismo servicio sin recargo
- Aplicar difícil acceso

**4.3. Tests de UI**
- Checkbox nocturno habilitado/deshabilitado
- Indicador visual 🌙 en tabla
- Cálculos en tiempo real
- Edición de cantidad con recargos

### Fase 5: Documentación (0.5 días)

- Actualizar `database-schema.md`
- Actualizar `MANUAL_USUARIO_V2.md`
- Crear ejemplos de uso
- Documentar casos edge

---

## Casos de Uso

### Caso 1: Guardia 4 Horas

**Configuración Admin:**
```
Servicio: "Guardia 4 hs Adulto"
- Precio: $20,000
- Unidades Base: 4
- % Horas Nocturnas: 0
```

**Usuario Crea Presupuesto:**
```
Selecciona: "Guardia 4 hs Adulto"
Cantidad: 2
Servicio Tarifario: "Hora cuidador" (Valor 2: $1,500)

Cálculo:
- Precio: $20,000 × 2 = $40,000
- Costo: $1,500 × 4 × 2 = $12,000
- Utilidad: $28,000
```

### Caso 2: Enfermería Normal + Nocturna

**Configuración Admin:**

**Financiador:**
```
Financiador: "Swiss Medical"
- % Horas Nocturnas: 30
```

**Servicio:**
```
Servicio: "Enfermería"
- Precio: $5,000
- Unidades Base: 1
- ☑ Admite Horas Nocturnas
```

**Usuario Crea Presupuesto:**

**Primera vez (sin nocturno):**
```
Selecciona: "Enfermería"
Cantidad: 6
☐ Horas Nocturnas
→ Total: $30,000
```

**Segunda vez (con nocturno):**
```
Selecciona: "Enfermería"
Cantidad: 6
☑ Horas Nocturnas (+30%)
→ Total: $39,000
```

**Resultado:**
```
Enfermería (6 hs)          $30,000
Enfermería (6 hs) 🌙       $39,000
                           --------
Total:                     $69,000
```

### Caso 3: Zona Desfavorable

**Configuración Admin:**
```
Financiador: "Swiss Medical"
- % Difícil Acceso: 15
```

**Usuario Crea Presupuesto:**
```
Datos del Paciente:
☑ Zona Desfavorable

Servicios:
- Enfermería: $30,000
- Cuidador: $25,000

Subtotal: $55,000
Con recargo 15%: $63,250
```

### Caso 4: Combo + Nocturno + Difícil Acceso

**Configuración:**

**Financiador:**
```
Financiador: "OSDE"
- % Horas Nocturnas: 25
- % Difícil Acceso: 10
```

**Servicio:**
```
Servicio: "Guardia 8 hs"
- Precio: $35,000
- Unidades Base: 8
- ☑ Admite Horas Nocturnas
```

**Usuario:**
```
Selecciona: "Guardia 8 hs"
Cantidad: 1
☑ Horas Nocturnas (+25%)
☑ Zona Desfavorable (+10%)

Cálculo:
1. Precio base: $35,000
2. Con nocturno: $35,000 × 1.25 = $43,750
3. Con difícil acceso: $43,750 × 1.10 = $48,125

Costo: $1,500 × 8 = $12,000
Utilidad: $48,125 - $12,000 = $36,125
```

---

## Checklist de Implementación

### Base de Datos
- [x] Ejecutar migración 018
- [x] Verificar columnas creadas
- [ ] Poblar datos de ejemplo
- [ ] Actualizar `database-schema.md`

### Backend
- [x] Actualizar tipos TypeScript
- [x] Modificar queries de servicios
- [x] Actualizar cálculos de totales
- [x] Agregar validaciones
- [ ] Tests unitarios

### Frontend
- [x] Actualizar tipos
- [x] Modificar SelectorDualServicios
- [x] Agregar checkbox nocturno
- [x] Implementar clave única
- [x] Agregar indicador visual 🌙
- [x] Actualizar DatosPresupuesto
- [x] Panel de administración
- [ ] Tests de componentes

### Documentación
- [ ] Actualizar schema
- [ ] Actualizar manual de usuario
- [ ] Crear ejemplos
- [ ] Documentar API

### Testing
- [ ] Tests unitarios backend
- [ ] Tests integración
- [ ] Tests UI
- [ ] Tests E2E
- [ ] Validación con usuarios

---

**Fin del Documento**
