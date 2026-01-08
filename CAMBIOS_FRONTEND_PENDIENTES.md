# Cambios Pendientes en Frontend

## ✅ Completados
- `types/index.ts`: Actualizado `idobra_social` → `id` y `financiador_id`
- `DatosPresupuesto.tsx`: Actualizado para usar `f.id` y enviar `financiador_id`

## ⏳ Pendientes

### Archivos que usan `idobra_social` como propiedad de financiador:
1. `hooks/useFinanciador.tsx` - línea 10
2. `pages/admin/GestionEquipamientos.tsx` - líneas 8, 192, 275
3. `pages/admin/GestionFinanciadores.tsx` - líneas 9, 73, 112, 184
4. `pages/admin/ServiciosPorFinanciador.tsx` - líneas 9, 216, 524
5. `pages/GerenciaFinanciera.tsx` - línea 364
6. `pages/Prestaciones.tsx` - línea 29

### Archivos que usan `idobra_social` como propiedad de presupuesto:
1. `pages/DatosPresupuesto.tsx` - líneas 213, 214, 228, 239 (PARCIALMENTE CORREGIDO)
2. `pages/ListaPresupuestos.tsx` - línea 16
3. `pages/UserDashboard.tsx` - líneas 267, 281, 302, 316, 448, 455

### Cambios Necesarios:

**Para financiadores (mapeo de select/tabla):**
```typescript
// ANTES
financiadores.map(f => ({ value: f.idobra_social.toString(), label: f.Financiador }))

// DESPUÉS
financiadores.map(f => ({ value: f.id.toString(), label: f.Financiador }))
```

**Para presupuestos (propiedad del objeto):**
```typescript
// ANTES
presupuesto.idobra_social

// DESPUÉS
presupuesto.financiador_id
```

**Para envío de datos al backend:**
```typescript
// ANTES
{ idobra_social: value }

// DESPUÉS
{ financiador_id: value }
```

## 🔧 Estrategia de Corrección

Dado que son muchos archivos, la mejor estrategia es:
1. Buscar y reemplazar `idobra_social` por `id` en contextos de financiador
2. Buscar y reemplazar `idobra_social` por `financiador_id` en contextos de presupuesto
3. Verificar manualmente cada cambio para asegurar contexto correcto

## ⚠️ Nota Importante

El backend YA está completamente actualizado y NO acepta `idobra_social`. 
El frontend DEBE actualizarse para que la aplicación funcione correctamente.
