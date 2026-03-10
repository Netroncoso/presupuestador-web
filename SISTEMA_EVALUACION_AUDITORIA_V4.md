# Sistema de Evaluación de Auditoría v4.0

## Resumen de Cambios

### Problema Identificado
- El sistema actual evalúa reglas de auditoría de forma secuencial y se detiene en la primera violación
- Los servicios con orden 5 (valor más alto) no fuerzan auditoría automáticamente
- Los usuarios y auditores no ven todas las razones por las que un presupuesto requiere auditoría

### Solución Implementada
- **Evaluación completa**: Se evalúan TODAS las reglas antes de determinar el estado
- **Múltiples razones**: Se almacenan y muestran todas las violaciones encontradas
- **Orden 5 obligatorio**: Servicios con valor más alto fuerzan auditoría
- **Transparencia total**: Usuario y auditor ven todas las razones

## Reglas de Evaluación

### 1. Reglas Automáticas (Evaluadas al Finalizar)

#### A. Insumos Críticos (Prioridad Máxima)
```
SI: Contiene insumos con critico = 1
ENTONCES: pendiente_prestacional
RAZÓN: "Contiene insumos críticos: [lista de insumos]"
```

#### B. Servicios Orden 5 (NUEVO)
```
SI: Contiene servicios del tarifario con orden_costo = 5
ENTONCES: pendiente_prestacional  
RAZÓN: "Servicios con valor más alto: [lista de servicios]"
```

#### C. Servicios Fuera de Tarifario (NUEVO)
```
SI: Contiene servicios del tarifario con fuera_tarifario = 1
ENTONCES: pendiente_prestacional  
RAZÓN: "Servicios con costo editado manualmente: [lista de servicios]"
```

#### D. Rentabilidad Muy Baja
```
SI: rentabilidad < 15%
ENTONCES: pendiente_prestacional
RAZÓN: "Rentabilidad {valor}% < 15%"
```

#### E. Rentabilidad Muy Alta
```
SI: rentabilidad > 25%
ENTONCES: pendiente_prestacional
RAZÓN: "Rentabilidad {valor}% > 25% (posible sobreprecio)"
```

#### F. Costo Total Alto
```
SI: costo_total > $150,000
ENTONCES: pendiente_prestacional
RAZÓN: "Costo ${valor:,} > $150,000"
```

#### G. Utilidad Muy Baja
```
SI: utilidad < $5,000
ENTONCES: pendiente_prestacional
RAZÓN: "Utilidad ${valor:,} < $5,000"
```

#### H. Utilidad Muy Alta
```
SI: utilidad > $50,000
ENTONCES: pendiente_prestacional
RAZÓN: "Utilidad ${valor:,} > $50,000"
```

### 2. Auditoría Manual

#### Cuando el Usuario Solicita Auditoría Manual:
```
RAZÓN: "Auditoría solicitada manualmente por el usuario"
ESTADO: pendiente_prestacional
EVALUACIÓN: Se ejecutan las mismas reglas automáticas para contexto
```

## Estructura de Datos

### Tabla presupuestos (Nuevas Columnas)
```sql
ALTER TABLE presupuestos ADD COLUMN razones_auditoria JSON;
ALTER TABLE presupuestos ADD COLUMN tiene_orden_5 TINYINT DEFAULT 0;
ALTER TABLE presupuestos ADD COLUMN tiene_insumos_criticos TINYINT DEFAULT 0;
```

### Formato JSON de razones_auditoria
```json
{
  "razones": [
    {
      "tipo": "rentabilidad_baja",
      "valor": 8.5,
      "umbral": 15,
      "mensaje": "Rentabilidad 8.5% < 15%"
    },
    {
      "tipo": "orden_5",
      "servicios": ["Cuidador nocturno", "Oxígeno domiciliario"],
      "mensaje": "Servicios con valor más alto requieren autorización"
    },
    {
      "tipo": "utilidad_alta", 
      "valor": 75000,
      "umbral": 50000,
      "mensaje": "Utilidad $75,000 > $50,000"
    }
  ],
  "evaluado_en": "2025-01-06T10:30:00Z",
  "total_violaciones": 3,
  "tipo_evaluacion": "automatica" | "manual"
}
```

## Flujo de Evaluación

### 1. Finalizar Presupuesto
```
1. Calcular totales (insumos, prestaciones, equipamientos)
2. Verificar insumos críticos
3. Verificar servicios orden 5
4. Evaluar TODAS las reglas numéricas
5. Almacenar TODAS las razones encontradas
6. Determinar estado final:
   - Si razones.length > 0: pendiente_prestacional
   - Si razones.length = 0: pendiente_carga
7. Notificar según corresponda
```

### 2. Auditoría Manual
```
1. Usuario hace clic en "Solicitar Auditoría Manual"
2. Se ejecuta la misma evaluación automática
3. Se agrega razón manual al inicio del array
4. Estado: pendiente_prestacional
5. Notificar auditores
```

## Interfaz de Usuario

### 1. Respuesta al Finalizar
```json
{
  "estadoFinal": "pendiente_prestacional",
  "razones": [
    "Rentabilidad 8.5% < 15%",
    "Servicios con valor más alto: Cuidador nocturno",
    "Utilidad $75,000 > $50,000"
  ],
  "totales": { ... }
}
```

### 2. Modal de Detalle (Usuario y Auditor)
```
📋 Razones de Auditoría:
• Rentabilidad muy baja: 8.5% (mínimo: 15%)
• Servicios valor alto: Cuidador nocturno, Oxígeno
• Utilidad excesiva: $75,000 (máximo: $50,000)

Evaluado el: 06/01/2025 10:30
```

### 3. Notificaciones a Auditores
```
🔍 Nuevo presupuesto requiere auditoría
Paciente: Juan Pérez
Razones: 3 violaciones detectadas
- Rentabilidad baja (8.5%)
- Servicios valor alto
- Utilidad excesiva
```

## Archivos Modificados

### Backend
- `backend/migrations/011_add_audit_reasons.sql` (NUEVO)
- `backend/src/services/calculosService.ts` (MODIFICADO)
- `backend/src/services/presupuestoService.ts` (MODIFICADO)
- `backend/src/repositories/presupuestoRepository.ts` (MODIFICADO)

### Frontend
- `frontend/src/services/presupuestoService.ts` (MODIFICADO)
- `frontend/src/components/ModalDetallePresupuesto.tsx` (MODIFICADO)
- `frontend/src/pages/UserDashboard.tsx` (MODIFICADO)

## Beneficios

### Para Usuarios
- **Transparencia**: Ven exactamente por qué va a auditoría
- **Eficiencia**: Pueden corregir todos los problemas de una vez
- **Educación**: Aprenden las reglas del sistema

### Para Auditores
- **Contexto completo**: Ven todas las razones de auditoría
- **Priorización**: Casos con más violaciones = mayor urgencia
- **Mejor decisión**: Información completa para aprobar/rechazar

### Para el Sistema
- **Trazabilidad**: Historial completo de evaluaciones
- **Reportes**: Estadísticas de reglas más violadas
- **Mejora continua**: Datos para optimizar umbrales

## Compatibilidad

- ✅ **Backward compatible**: Presupuestos existentes siguen funcionando
- ✅ **Migración suave**: Nuevas columnas con valores por defecto
- ✅ **API estable**: Endpoints existentes mantienen formato
- ✅ **UI progresiva**: Nuevas funciones se agregan sin romper existentes

---

**Versión:** 4.0  
**Fecha:** Enero 2025  
**Estado:** En implementación