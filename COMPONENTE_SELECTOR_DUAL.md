# Componente Selector Dual de Servicios - Implementación Completada

## 📦 Archivos Creados

### 1. `frontend/src/components/SelectorDualServicios.tsx`
Componente principal que implementa el selector dual de servicios.

**Características:**
- Mapeo visual de servicios financiador → servicios tarifario
- Selector de 5 valores de costo por servicio tarifario
- Cálculo automático de utilidad (precio - costo)
- Soporte para horas nocturnas con recargo configurable
- Soporte para unidades base (servicios combo)
- Tabla de servicios mapeados con edición de cantidad
- Resumen de totales (facturar, costo, utilidad)
- Modo solo lectura para presupuestos históricos

### 2. `frontend/src/hooks/useSelectorDual.ts`
Hook personalizado para manejar la lógica del selector dual.

**Funcionalidades:**
- Carga automática de servicios financiador y tarifario
- Gestión de estado de servicios convenio
- Cálculo de totales (facturar, costo, utilidad, margen)
- Operaciones CRUD sobre servicios (agregar, eliminar, actualizar)
- Validación de contexto (isReady)
- Manejo de errores y loading states

## 🔧 Modificaciones en Archivos Existentes

### 1. `frontend/src/pages/Prestaciones.tsx`
- ✅ Importado `SelectorDualServicios`
- ✅ Agregados estados para sistema dual
- ✅ Agregado tab "Con Convenio (Dual)"
- ✅ Integrado componente en tab panel
- ✅ Agregadas funciones de carga de servicios

### 2. `frontend/src/types/index.ts`
- ✅ Actualizado `ServicioFinanciador` con `id_prestador_servicio`
- ✅ Confirmado `ServicioConvenio` con todas las propiedades necesarias
- ✅ Actualizado `FinanciadorInfo` con porcentajes de recargo

### 3. `frontend/src/api/api.ts`
- ✅ Ya existían las funciones necesarias:
  - `getServiciosFinanciador(financiadorId, zonaFinanciadorId)`
  - `getServiciosTarifario(zonaTarifarioId)`
  - `getFinanciadorZonas(financiadorId)`

## 🎨 Interfaz de Usuario

### Layout del Componente

```
┌─────────────────────────────────────────────────────────────┐
│ Selector de Servicios (Flex horizontal)                    │
├─────────────────────────────────────────────────────────────┤
│ [Tabla Servicios Financiador]  │  [Panel Agregar]          │
│ ☐ Consulta Médica - $5,000     │  Servicio: Consulta...    │
│ ☐ Enfermería - $3,500          │  Servicio Tarifario: [▼]  │
│ ☐ Guardia 4hs - $8,000         │  Cantidad: [1]            │
│                                 │  Valor: [1][2][3][4][5]   │
│                                 │  ☐ Horas Nocturnas (+20%) │
│                                 │  Precio: $8,000           │
│                                 │  Costo: $6,000            │
│                                 │  Utilidad: $2,000         │
│                                 │  [Agregar] [Cancelar]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Servicios Agregados                                         │
├─────────────────────────────────────────────────────────────┤
│ Servicio | Cant | Precio | Costo | Subtotal P | Subtotal C │
│ Consulta │  2   │ $5,000 │$3,500 │  $10,000   │  $7,000    │
│ Guardia  │  1   │ $8,000 │$6,000 │  $8,000    │  $6,000    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Resumen: Total Facturar: $18,000 | Total Costo: $13,000    │
│          Utilidad Total: $5,000 (27.8%)                     │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

```typescript
// 1. Usuario selecciona servicio financiador
setServicioSeleccionado(id) 
  → Carga datos del servicio
  → Muestra precio a facturar

// 2. Usuario selecciona servicio tarifario
setServicioTarifarioId(id)
  → Carga 5 valores disponibles
  → Muestra selector de valores

// 3. Usuario selecciona valor (1-5)
setValorSeleccionado(orden)
  → Calcula costo unitario
  → Calcula utilidad = precio - costo

// 4. Usuario agrega servicio
handleAgregar()
  → Crea ServicioConvenio con todos los datos
  → Actualiza lista de servicios seleccionados
  → Recalcula totales
```

## 📊 Estructura de Datos

### ServicioConvenio (Resultado del Mapeo)
```typescript
{
  id_servicio_financiador: 123,
  nombre: "Consulta Médica",
  precio_facturar: 5000,
  id_servicio_tarifario: 45,
  valor_seleccionado: 3,
  precio_costo: 3500,
  utilidad: 1500,
  cantidad: 2,
  aplicar_horas_nocturnas: false,
  clave_unica: "123_45_1234567890"
}
```

## 🎯 Características Implementadas

### ✅ Funcionalidades Core
- [x] Selector dual de servicios (financiador + tarifario)
- [x] 5 valores de costo por servicio tarifario
- [x] Cálculo automático de utilidad
- [x] Tabla de servicios mapeados
- [x] Edición de cantidad inline
- [x] Eliminación de servicios
- [x] Resumen de totales

### ✅ Funcionalidades Avanzadas
- [x] Soporte para horas nocturnas con recargo
- [x] Soporte para unidades base (servicios combo)
- [x] Modo solo lectura
- [x] Búsqueda de servicios
- [x] Validación de contexto (zonas requeridas)
- [x] Clave única para identificación

### ✅ UX/UI
- [x] Layout responsive con Flex
- [x] Formato monetario argentino
- [x] Indicadores visuales (🌙 para nocturnas)
- [x] Colores semánticos (verde/rojo para utilidad)
- [x] Tooltips informativos
- [x] Estados disabled apropiados

## 🔌 Integración con Backend

### Endpoints Requeridos (Ya Implementados)
```typescript
GET /api/financiador/:id/zonas
GET /api/financiador/:id/servicios?zona_financiador_id=X
GET /api/tarifario/servicios?zona_tarifario_id=X
```

### Endpoints Pendientes (Para Persistencia)
```typescript
POST /api/presupuestos/:id/servicios-convenio
PUT /api/presupuestos/:id/servicios-convenio/:claveUnica
DELETE /api/presupuestos/:id/servicios-convenio/:claveUnica
GET /api/presupuestos/:id/servicios-convenio
```

## 📝 Próximos Pasos

1. **Backend**: Implementar endpoints de persistencia
2. **Integración**: Conectar componente con API de presupuestos
3. **Validaciones**: Agregar reglas de negocio (ej: utilidad mínima)
4. **Alertas**: Integrar sistema de alertas por tipo de servicio
5. **Testing**: Crear tests unitarios y de integración

## 🐛 Notas de Desarrollo

- El componente usa `clave_unica` para identificar servicios (formato: `{idFinanciador}_{idTarifario}_{timestamp}`)
- Los totales se calculan en tiempo real usando `useMemo`
- El hook `useSelectorDual` maneja toda la lógica de estado
- Compatible con sistema de zonas dual (financiador + tarifario)
- Preparado para integración con sistema de auditoría

## 📚 Documentación Relacionada

- `ARQUITECTURA_ZONAS_DUAL.md` - Arquitectura del sistema dual
- `CAMBIOS_ZONAS_DUAL.md` - Cambios implementados
- `database-schema.md` - Esquema de base de datos
