# Sistema de Formateo Numérico Centralizado

## 📋 Objetivo

Centralizar el formateo de números en toda la aplicación para:
- ✅ Soportar decimales de forma consistente
- ✅ Usar formato argentino (1.234,56)
- ✅ Cambiar formato desde un solo lugar
- ✅ Evitar inconsistencias entre componentes

## 🚀 Estado Actual

**INFRAESTRUCTURA CREADA - NO MIGRADO**

Los archivos están listos pero **NO se han aplicado** a la aplicación existente.

## 📁 Archivos Creados

### 1. `frontend/src/utils/numberFormat.ts`
Utilidades de formateo centralizadas:

```typescript
import { numberFormat } from '@/utils/numberFormat';

// Formatear a moneda
numberFormat.formatCurrency(1234.56); // "$ 1.234,56"

// Formatear número sin símbolo
numberFormat.formatNumber(1234.56, 2); // "1.234,56"

// Parsear string a número
numberFormat.parseNumber("1.234,56"); // 1234.56

// Validar número
numberFormat.isValidNumber("1.234,56"); // true
```

### 2. `frontend/src/components/NumberInput.tsx`
Componente reutilizable para inputs numéricos:

```tsx
import { NumberInput } from '@/components/NumberInput';

<NumberInput
  label="Precio"
  value={precio}
  onChange={setPrecio}
  decimals={2}
  prefix="$"
/>
```

## 🎯 Configuración Global

Para cambiar el formato en toda la app, modificar `numberFormat.ts`:

```typescript
// Cambiar decimales por defecto
formatNumber: (value, decimals = 0) // Sin decimales

// Cambiar formato de moneda
return new Intl.NumberFormat('en-US', { // Formato US
  style: 'currency',
  currency: 'USD',
})
```

## 📊 Lugares Donde Aplicar (Futuro)

### Frontend - Inputs de Precios
- ❌ `GestionInsumos.tsx` - Input de costo
- ❌ `GestionEquipamientos.tsx` - Input de precio_referencia
- ❌ `ServiciosPorFinanciador.tsx` - Inputs de valores
- ❌ `GestionEquipamientos.tsx` - Inputs de valores
- ❌ `Insumos.tsx` - Display de precios
- ❌ `Prestaciones.tsx` - Display de valores
- ❌ `Equipamiento.tsx` - Display de precios

### Frontend - Display de Totales
- ❌ `UserDashboard.tsx` - Totales de presupuesto
- ❌ `GerenciaAdministrativa.tsx` - Totales en tabla
- ❌ `GerenciaPrestacional.tsx` - Totales en tabla
- ❌ `GerenciaGeneral.tsx` - Totales en tabla
- ❌ `ListaPresupuestos.tsx` - Totales en tabla

### Backend - Validación
- ❌ Validar que decimales se guarden correctamente en BD
- ❌ Asegurar que cálculos usen precisión decimal
- ❌ Actualizar tipos TypeScript si es necesario

## 🔄 Plan de Migración (Cuando se decida)

### Fase 1: Inputs de Admin (Bajo Riesgo)
1. Migrar inputs de gestión de insumos
2. Migrar inputs de gestión de equipamientos
3. Migrar inputs de valores por financiador
4. Testing exhaustivo

### Fase 2: Display de Valores (Medio Riesgo)
1. Migrar componentes de selección (Insumos, Prestaciones, Equipamiento)
2. Migrar displays de totales en dashboards
3. Testing de cálculos

### Fase 3: Tablas y Reportes (Alto Riesgo)
1. Migrar tablas de gerencias
2. Migrar generación de PDF
3. Testing completo end-to-end

## ⚠️ Consideraciones

### Compatibilidad con BD
- Verificar que columnas `DECIMAL(10,2)` soporten decimales
- Confirmar que cálculos en backend usen precisión correcta

### Testing Necesario
- Probar entrada de decimales (1234,56)
- Probar entrada de enteros (1234)
- Probar copia/pega de valores
- Probar cálculos con decimales
- Probar generación de PDF con decimales

### Rollback
- Mantener código anterior comentado durante migración
- Hacer migración por componente, no todo junto
- Tener plan de rollback si algo falla

## 📝 Ejemplo de Uso Futuro

### Antes (Actual)
```tsx
<TextInput
  label="Precio"
  type="number"
  value={precio}
  onChange={(e) => setPrecio(Number(e.target.value))}
/>
```

### Después (Con NumberInput)
```tsx
<NumberInput
  label="Precio"
  value={precio}
  onChange={setPrecio}
  decimals={2}
  prefix="$"
/>
```

## 🎨 Ventajas del Sistema

1. **Centralizado**: Cambiar formato desde un solo archivo
2. **Consistente**: Mismo formato en toda la app
3. **Flexible**: Configurar decimales por input
4. **Validado**: Parsing robusto de diferentes formatos
5. **UX Mejorada**: Formato automático al perder foco

## 📅 Estado

- ✅ Infraestructura creada
- ⏳ Migración pendiente (decisión futura)
- 📋 Documentación completa

## 🔗 Referencias

- Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Formato argentino: es-AR locale
- Mantine TextInput: https://mantine.dev/core/text-input/
