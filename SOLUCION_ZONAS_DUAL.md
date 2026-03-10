# SOLUCIÓN: SISTEMA DUAL DE ZONAS

## 🎯 PROBLEMA IDENTIFICADO

Actualmente tienes DOS conceptos de zona mezclados:
1. **Zona Tarifario** (Medihome): Define COSTOS (5 valores por servicio)
2. **Zona Financiador**: Define PRECIOS A FACTURAR por convenio

## 📋 CAMBIOS REQUERIDOS

### 1. BASE DE DATOS (Ya implementado parcialmente en migración 017)

```sql
-- ZONAS FINANCIADOR (nueva tabla)
financiador_zonas (id, nombre, descripcion, activo)

-- MAPEO FINANCIADOR → ZONAS
financiador_zona_mapeo (financiador_id, zona_id, activo)

-- PRESUPUESTOS (modificar)
presupuestos:
  - zona_tarifario_id (FK → tarifario_zonas.id)
  - zona_financiador_id (FK → financiador_zonas.id)

-- CONVENIOS POR ZONA FINANCIADOR
financiador_servicio_valores:
  - zona_financiador_id (FK → financiador_zonas.id)
  - precio_facturar
```

### 2. FRONTEND - DatosPresupuesto.tsx

**ANTES:**
```tsx
<Select label="Zona" /> // Una sola zona
```

**DESPUÉS:**
```tsx
<Select label="Zona Tarifario" /> // Para costos
<Select label="Zona Financiador" /> // Para precios convenio
```

### 3. SERVICIOS CON CONVENIO

**ANTES:**
- Lista servicios del financiador
- Cantidad fija

**DESPUÉS:**
- Lista servicios del financiador para zona_financiador seleccionada
- Selector de servicio tarifario (zona_tarifario) que cubre el costo
- Muestra los 5 valores del tarifario para elegir

### 4. FLUJO COMPLETO

```
1. Usuario selecciona:
   - Sucursal
   - Zona Tarifario (para costos)
   - Zona Financiador (para precios)

2. En Servicios con Convenio:
   - Se listan servicios del financiador para esa zona_financiador
   - Para cada servicio convenio, usuario selecciona:
     * Servicio del tarifario (zona_tarifario)
     * Cuál de los 5 valores usar (1-5)

3. Cálculo:
   - Precio Facturar = Convenio (financiador + zona_financiador)
   - Precio Costo = Tarifario (servicio + zona_tarifario + orden)
   - Utilidad = Precio Facturar - Precio Costo
```

## 🔧 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Completar Backend
- [ ] Servicio para gestionar zonas financiador
- [ ] Endpoint para obtener zonas por financiador
- [ ] Modificar presupuestos para manejar ambas zonas

### Paso 2: Modificar Frontend
- [ ] Agregar selector zona_financiador en DatosPresupuesto
- [ ] Modificar Prestaciones para mostrar selector de servicios tarifario
- [ ] Mostrar los 5 valores del tarifario para selección

### Paso 3: Migración de Datos
- [ ] Asignar zonas financiador a financiadores existentes
- [ ] Migrar presupuestos existentes

## 📊 ESTRUCTURA FINAL

```
presupuestos
├── zona_tarifario_id → tarifario_zonas (CABA, AMBA, etc.)
└── zona_financiador_id → financiador_zonas (Zona 1, Zona 2, etc.)

presupuesto_prestaciones
├── id_servicio_financiador → servicios (convenio)
├── id_servicio_tarifario → servicios (costo)
├── valor_seleccionado (1-5)
├── precio_costo (del tarifario)
└── precio_facturar (del convenio)
```

## ⚠️ CONSIDERACIONES

1. **Compatibilidad**: Mantener funcionamiento actual durante transición
2. **Migración**: Datos existentes deben mapearse correctamente
3. **UX**: Interface clara para distinguir ambos tipos de zona
4. **Validación**: Verificar que ambas zonas estén seleccionadas antes de continuar