# Implementación: Sistema de Alertas y Umbrales para Utilidad

## Resumen

Se implementó un sistema completo de alertas visuales y umbrales de auditoría para utilidad, siguiendo el patrón existente de rentabilidad.

## Componentes Implementados

### 1. Migración SQL (`013_add_utilidad_rules.sql`)

**Umbrales de Auditoría:**
- `auditoria.utilidadMinimaBaja`: $5,000 (utilidad muy baja → auditoría)
- `auditoria.utilidadMinima`: $50,000 (utilidad muy alta → auditoría) [ya existía]

**Alertas Visuales:**
- `alerta.utilidad.critica`: $1,000 (alerta roja)
- `alerta.utilidad.baja`: $10,000 (alerta naranja)
- `alerta.utilidad.buena`: $30,000 (alerta verde)
- `alerta.utilidad.excelente`: $30,000+ (alerta violeta)

### 2. Backend

#### businessRules.ts
- Agregado `utilidadMinimaBaja: 5000` a DEFAULT_RULES

#### calculosService.ts
- Modificado `evaluarEstadoAutomatico()` para evaluar:
  - Utilidad < $5,000 → Auditoría (muy baja)
  - Utilidad > $50,000 → Auditoría (muy alta)

### 3. Frontend

#### Nuevo Componente: `UtilidadAlert.tsx`
- Componente de alerta visual para utilidad
- 4 tipos: CRITICA, BAJA, BUENA, EXCELENTE
- Formato monetario argentino
- Colores: rojo, naranja, verde, violeta

#### alertaService.ts
- Agregado tipo `TipoAlertaUtilidad`
- Nueva función `evaluarUtilidad(utilidad: number)`
- Valores por defecto en cache

#### useAlertaCotizador.tsx
- Importado `UtilidadAlert` y `evaluarUtilidad`
- Agregado `costoTotal` a interface `AlertaProps`
- Calcula utilidad: `totalFacturar - costoTotal`
- Evalúa y muestra alerta de utilidad

#### UserDashboard.tsx
- Pasa `costoTotal` al hook `useAlertaCotizador`

## Lógica de Evaluación

### Umbrales de Auditoría (Bloquean aprobación automática)

```typescript
const utilidad = totalFacturar - costoTotal;

if (utilidad < 5000) {
  // → AUDITORÍA (utilidad muy baja, posible error)
}

if (utilidad > 50000) {
  // → AUDITORÍA (utilidad muy alta, posible sobreprecio)
}

// Rango válido: $5,000 - $50,000 → Puede aprobar automáticamente
```

### Alertas Visuales (Solo informativas)

```typescript
if (utilidad < 1000) return 'CRITICA';      // Rojo
if (utilidad < 10000) return 'BAJA';        // Naranja
if (utilidad < 30000) return 'BUENA';       // Verde
return 'EXCELENTE';                         // Violeta
```

## Ejemplo de Uso

### Caso 1: Utilidad Muy Baja
```
Costo: $100,000
Precio: $103,000
Utilidad: $3,000

Resultado:
- ❌ Va a AUDITORÍA (< $5,000)
- 🔴 Alerta CRÍTICA visible en dashboard
```

### Caso 2: Utilidad Normal
```
Costo: $100,000
Precio: $120,000
Utilidad: $20,000

Resultado:
- ✅ Aprueba automáticamente ($5,000 - $50,000)
- 🟢 Alerta BUENA visible en dashboard
```

### Caso 3: Utilidad Muy Alta
```
Costo: $100,000
Precio: $170,000
Utilidad: $70,000

Resultado:
- ❌ Va a AUDITORÍA (> $50,000)
- 🟣 Alerta EXCELENTE visible en dashboard
```

## Configuración Admin

Las alertas son configurables desde **Panel Admin > Reglas de Negocio**:

| Regla | Valor Default | Descripción |
|-------|---------------|-------------|
| auditoria.utilidadMinimaBaja | $5,000 | Umbral mínimo para auditoría |
| auditoria.utilidadMinima | $50,000 | Umbral máximo para auditoría |
| alerta.utilidad.critica | $1,000 | Alerta roja |
| alerta.utilidad.baja | $10,000 | Alerta naranja |
| alerta.utilidad.buena | $30,000 | Alerta verde |
| alerta.utilidad.excelente | $30,000 | Alerta violeta |

## Testing

### Ejecutar Migración
```bash
mysql -u root -p mh_1 < backend/migrations/013_add_utilidad_rules.sql
```

### Verificar Configuración
```sql
SELECT * FROM configuracion_sistema WHERE clave LIKE '%utilidad%';
```

### Casos de Prueba

1. **Utilidad $500** → Auditoría + Alerta CRÍTICA
2. **Utilidad $8,000** → Auditoría + Alerta BAJA
3. **Utilidad $25,000** → Aprueba + Alerta BUENA
4. **Utilidad $60,000** → Auditoría + Alerta EXCELENTE

## Integración con Sistema de Grupos

Cuando se implemente el sistema de grupos de sucursales, estas reglas podrán diferenciarse:

| Regla | General | Desarrollo |
|-------|---------|------------|
| utilidadMinimaBaja | $5,000 | $3,000 |
| utilidadMinima | $50,000 | $70,000 |

Sucursales en desarrollo tendrán umbrales más flexibles.

## Archivos Modificados

### Backend
- `backend/migrations/013_add_utilidad_rules.sql` (nuevo)
- `backend/src/config/businessRules.ts`
- `backend/src/services/calculosService.ts`

### Frontend
- `frontend/src/components/alerts/UtilidadAlert.tsx` (nuevo)
- `frontend/src/services/alertaService.ts`
- `frontend/src/hooks/useAlertaCotizador.tsx`
- `frontend/src/pages/UserDashboard.tsx`

## Notas Importantes

1. **Alertas vs Umbrales**: Las alertas son visuales (no bloquean), los umbrales de auditoría sí bloquean la aprobación automática
2. **Cache**: Las reglas se cachean por 1 minuto en backend y frontend
3. **Compatibilidad**: Sistema compatible con reglas existentes de rentabilidad, monto, financiador, etc.
4. **Extensibilidad**: Fácil agregar más tipos de alertas siguiendo este patrón

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Estado:** ✅ Implementado
