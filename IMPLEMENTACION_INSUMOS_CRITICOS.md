# Implementación: Insumos Críticos

## Resumen
Funcionalidad para marcar insumos como "críticos" que fuerzan auditoría obligatoria en presupuestos que los incluyan, independientemente de las reglas automáticas de negocio.

## Objetivo
Permitir que ciertos insumos sensibles o de alto riesgo (ej: medicamentos controlados, equipos especiales) siempre requieran revisión gerencial, sin importar el monto o rentabilidad del presupuesto.

## Flujo de Negocio

### Escenario 1: Presupuesto con Insumo Crítico
```
Usuario crea presupuesto
  → Agrega insumo marcado como crítico
  → Finaliza presupuesto
  → Sistema detecta insumo crítico
  → Estado: pendiente_administrativa (auditoría obligatoria)
  → Notifica a Gerencia Administrativa
```

### Escenario 2: Presupuesto sin Insumos Críticos
```
Usuario crea presupuesto
  → Agrega insumos normales
  → Finaliza presupuesto
  → Sistema evalúa reglas automáticas
  → Estado: aprobado O pendiente_administrativa (según reglas)
```

## Implementación Técnica

### 1. Migración de Base de Datos

**Archivo**: `backend/migrations/015_add_insumos_criticos.sql`

```sql
-- Agregar columna critico a tabla insumos
ALTER TABLE insumos 
ADD COLUMN critico TINYINT(1) DEFAULT 0 COMMENT 'Insumo crítico que fuerza auditoría obligatoria';

-- Índice para optimizar consultas
CREATE INDEX idx_insumos_critico ON insumos(critico);

-- Actualizar schema documentation
-- RECORDAR: Actualizar .amazonq/rules/database-schema.md
```

**Ejecutar**:
```bash
mysql -u root -p mh_1 < backend/migrations/015_add_insumos_criticos.sql
```

### 2. Repository Layer

**Archivo**: `backend/src/repositories/presupuestoRepository.ts`

```typescript
// Agregar método para verificar insumos críticos
async tieneInsumosCriticos(presupuestoId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
     FROM presupuesto_insumos pi
     INNER JOIN insumos i ON pi.id_insumo = i.idInsumos
     WHERE pi.idPresupuestos = ? AND i.critico = 1`,
    [presupuestoId]
  );
  
  return rows[0].count > 0;
}
```

### 3. Service Layer - Cálculos

**Archivo**: `backend/src/services/calculosService.ts`

```typescript
// Modificar método evaluarEstadoAutomatico
async evaluarEstadoAutomatico(
  presupuestoId: number,
  totales: any,
  tieneInsumosCriticos: boolean = false // Nuevo parámetro
): Promise<string> {
  // Si tiene insumos críticos, forzar auditoría
  if (tieneInsumosCriticos) {
    logger.info('Presupuesto con insumos críticos - auditoría obligatoria', { 
      presupuestoId 
    });
    return 'pendiente_administrativa';
  }

  // Resto de lógica existente (reglas de negocio)
  const rules = await getBusinessRules();
  
  if (totales.rentabilidad < rules.auditoria.rentabilidad_minima ||
      totales.costo_total > rules.auditoria.costo_maximo ||
      totales.rentabilidad_con_plazo > rules.auditoria.rentabilidad_maxima_con_plazo ||
      totales.utilidad > rules.auditoria.utilidad_maxima) {
    return 'pendiente_administrativa';
  }

  return 'aprobado';
}
```

### 4. Service Layer - Presupuestos

**Archivo**: `backend/src/services/presupuestoService.ts`

```typescript
// Modificar método finalizarPresupuesto
async finalizarPresupuesto(presupuestoId: number, userId: number) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // ... código existente de cálculo de totales ...

    // NUEVO: Verificar insumos críticos
    const tieneInsumosCriticos = await presupuestoRepository.tieneInsumosCriticos(presupuestoId);

    // Evaluar estado con flag de insumos críticos
    const estadoFinal = await calculosService.evaluarEstadoAutomatico(
      presupuestoId,
      totales,
      tieneInsumosCriticos // Pasar flag
    );

    // ... resto del código existente ...

    await connection.commit();
    
    // NUEVO: Retornar flag de insumos críticos para mostrar mensaje al usuario
    return { 
      success: true, 
      estado: estadoFinal,
      tieneInsumosCriticos // Informar al frontend
    };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

### 5. Controller - Admin Insumos

**Archivo**: `backend/src/controllers/insumosController.ts`

```typescript
// Agregar endpoint para marcar/desmarcar como crítico
export const toggleCritico = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const id = parseInt(req.params.id);
  const { critico } = req.body; // true o false

  if (isNaN(id) || typeof critico !== 'boolean') {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    await pool.query(
      'UPDATE insumos SET critico = ? WHERE idInsumos = ?',
      [critico ? 1 : 0, id]
    );

    logger.info('Insumo crítico actualizado', { 
      id, 
      critico, 
      usuario: req.user.id 
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
```

### 6. Routes - Admin Insumos

**Archivo**: `backend/src/routes/insumos.ts`

```typescript
// Agregar ruta para toggle crítico
router.patch(
  '/admin/:id/critico',
  authenticateToken,
  requireAdmin,
  asyncHandler(toggleCritico)
);
```

### 7. Frontend - Gestión de Insumos

**Archivo**: `frontend/src/pages/admin/GestionInsumos.tsx`

```typescript
// Agregar columna en tabla de insumos
{
  accessorKey: 'critico',
  header: 'Crítico',
  size: 80,
  Cell: ({ row }) => (
    <Checkbox
      checked={row.original.critico === 1}
      onChange={(e) => handleToggleCritico(row.original.idInsumos, e.currentTarget.checked)}
      disabled={!isSuperAdmin}
      color="red"
      label=""
    />
  ),
}

// Agregar handler
const handleToggleCritico = async (id: number, critico: boolean) => {
  try {
    await api.patch(`/admin/insumos/${id}/critico`, { critico });
    
    notifications.show({
      title: 'Actualizado',
      message: `Insumo ${critico ? 'marcado' : 'desmarcado'} como crítico`,
      color: 'green',
      position: 'top-center',
    });

    // Recargar datos
    fetchInsumos();
  } catch (error) {
    console.error('Error al actualizar insumo crítico:', error);
    notifications.show({
      title: 'Error',
      message: 'No se pudo actualizar el insumo',
      color: 'red',
      position: 'top-center',
    });
  }
};
```

### 8. Frontend - Notificación al Usuario

**Archivo**: `frontend/src/pages/UserDashboard.tsx`

**Modificar función `ejecutarFinalizacion`** (línea ~220):

```typescript
const ejecutarFinalizacion = useCallback(async () => {
  try {
    const totales = {
      totalInsumos,
      totalPrestaciones,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo,
    };

    const resultado = await finalizarPresupuesto(totales);
    setRecargarHistorial((prev) => prev + 1);
    setValidacionCompletada(false);

    // Si requiere auditoría, abrir modal y marcar como automática
    if (resultado.estado === 'pendiente_administrativa') {
      // NUEVO: Mostrar notificación según motivo
      if (resultado.tieneInsumosCriticos) {
        notifications.show({
          title: '⚠️ Auditoría por Insumos Críticos',
          message: 'El presupuesto contiene insumos críticos que requieren revisión gerencial obligatoria.',
          color: 'orange',
          position: 'top-center',
          autoClose: false, // Usuario cierra con X
        });
      } else {
        notifications.show({
          title: '📋 Auditoría por Reglas de Negocio',
          message: 'El presupuesto requiere revisión gerencial según las reglas automáticas configuradas.',
          color: 'blue',
          position: 'top-center',
          autoClose: false, // Usuario cierra con X
        });
      }
      
      setAuditoriaAutomatica(true);
      abrirModalAuditoria();
      return; // IMPORTANTE: No limpiar ni ir al historial
    }

    // Si fue aprobado automáticamente
    if (resultado.estado === 'aprobado') {
      notifications.show({
        title: '✅ Presupuesto Aprobado',
        message: 'El presupuesto cumple con las reglas de negocio y fue aprobado automáticamente',
        color: 'green',
        position: 'top-center',
        autoClose: false, // Usuario cierra con X
      });
    }

    // Solo ir al historial y limpiar si NO requiere auditoría
    setActiveTab('historial');
    setTimeout(() => {
      handleNuevoPresupuesto();
    }, 500);
  } catch (error) {
    console.error("Error al finalizar presupuesto:", error);
    setValidacionCompletada(false);
  }
}, [
  finalizarPresupuesto,
  totalInsumos,
  totalPrestaciones,
  costoTotal,
  totalFacturar,
  rentabilidad,
  rentabilidadConPlazo,
  handleNuevoPresupuesto,
  abrirModalAuditoria,
]);
```

**Comportamiento**:
- Si `tieneInsumosCriticos = true`: Muestra notificación naranja 🟠 + abre modal de auditoría
- Si va a auditoría por reglas normales: Muestra notificación azul 🔵 + abre modal de auditoría
- Si se aprueba: Muestra notificación verde 🟢 + va al historial
- **Todas las notificaciones requieren cierre manual** (autoClose: false)

**Resumen de Notificaciones**:

| Escenario | Color | Título | Mensaje | autoClose |
|-----------|-------|--------|---------|----------|
| **Insumos críticos** | 🟠 Naranja | ⚠️ Auditoría por Insumos Críticos | El presupuesto contiene insumos críticos que requieren revisión gerencial obligatoria. | false |
| **Reglas automáticas** | 🔵 Azul | 📋 Auditoría por Reglas de Negocio | El presupuesto requiere revisión gerencial según las reglas automáticas configuradas. | false |
| **Aprobado** | 🟢 Verde | ✅ Presupuesto Aprobado | El presupuesto cumple con las reglas de negocio y fue aprobado automáticamente | false |storial
- **Todas las notificaciones requieren cierre manual** (autoClose: false)

### 9. Hook usePresupuesto

**Archivo**: `frontend/src/hooks/usePresupuesto.ts`

**Modificar retorno de `finalizarPresupuesto`** para incluir `tieneInsumosCriticos`:

```typescript
const finalizarPresupuesto = async (totales: any) => {
  // ... código existente ...
  
  const response = await api.post(`/presupuestos/${presupuestoId}/finalizar`, totales);
  
  // Retornar estado Y flag de insumos críticos
  return {
    estado: response.data.estado,
    tieneInsumosCriticos: response.data.tieneInsumosCriticos || false
  };
};
```

### 10. TypeScript Types

**Archivo**: `backend/src/types/database.ts`

```typescript
// Agregar campo a interfaz Insumo
export interface Insumo extends RowDataPacket {
  idInsumos: number;
  producto: string;
  costo: number;
  codigo_producto?: string;
  fecha_actualizacion?: Date;
  critico?: number; // NUEVO: 0 = normal, 1 = crítico
}
```

**Archivo**: `frontend/src/types/insumo.ts`

```typescript
// Agregar campo a interfaz Insumo
export interface Insumo {
  idInsumos: number;
  producto: string;
  costo: number;
  codigo_producto?: string;
  fecha_actualizacion?: string;
  critico?: number; // NUEVO: 0 = normal, 1 = crítico
  precio_facturar?: number;
}
```

## Validaciones y Reglas

### Reglas de Negocio
1. **Insumo crítico = Auditoría obligatoria**: Si un presupuesto contiene al menos 1 insumo crítico, va a auditoría sin importar monto/rentabilidad
2. **Prioridad**: Verificación de insumos críticos se ejecuta ANTES de evaluar reglas automáticas
3. **Estado inicial**: Todos los insumos existentes tienen `critico = 0` (no críticos)
4. **Permisos**: Solo super admin puede marcar/desmarcar insumos como críticos

### Validaciones Técnicas
- Campo `critico` es TINYINT(1): 0 = normal, 1 = crítico
- Índice en columna `critico` para optimizar consultas
- JOIN con `insumos` para verificar flag en tiempo de finalización
- Log de auditoría cuando presupuesto va a auditoría por insumo crítico

## Casos de Uso

### Caso 1: Medicamento Controlado
```
Insumo: "Morfina 10mg" → critico = 1
Presupuesto: $50,000 (bajo monto)
Rentabilidad: 20% (buena)
Resultado: pendiente_administrativa (por insumo crítico)
```

### Caso 2: Equipo Especial
```
Insumo: "Ventilador Mecánico Invasivo" → critico = 1
Presupuesto: $80,000
Rentabilidad: 18%
Resultado: pendiente_administrativa (por insumo crítico)
```

### Caso 3: Insumo Normal
```
Insumo: "Gasas estériles" → critico = 0
Presupuesto: $30,000
Rentabilidad: 22%
Resultado: aprobado (no cumple reglas automáticas ni tiene críticos)
```

## Testing

### Test Unitario - Repository
```typescript
describe('presupuestoRepository.tieneInsumosCriticos', () => {
  it('debe retornar true si presupuesto tiene insumo crítico', async () => {
    const resultado = await presupuestoRepository.tieneInsumosCriticos(123);
    expect(resultado).toBe(true);
  });

  it('debe retornar false si presupuesto no tiene insumos críticos', async () => {
    const resultado = await presupuestoRepository.tieneInsumosCriticos(456);
    expect(resultado).toBe(false);
  });
});
```

### Test Integración - Finalizar Presupuesto
```typescript
describe('POST /api/presupuestos/:id/finalizar', () => {
  it('debe ir a auditoría si tiene insumo crítico', async () => {
    const response = await request(app)
      .post('/api/presupuestos/123/finalizar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.estado).toBe('pendiente_administrativa');
  });
});
```

## Impacto en Sistema Existente

### Cambios Mínimos
- ✅ No afecta presupuestos existentes (todos tienen `critico = 0` por defecto)
- ✅ No modifica flujo de auditoría multi-gerencial
- ✅ No cambia reglas automáticas existentes
- ✅ Solo agrega verificación adicional ANTES de evaluar reglas

### Compatibilidad
- ✅ Backward compatible: insumos sin flag crítico funcionan igual que antes
- ✅ No requiere migración de datos históricos
- ✅ No afecta presupuestos finalizados previamente

## Documentación a Actualizar

### 1. Schema Documentation
**Archivo**: `.amazonq/rules/database-schema.md`

Agregar a tabla `insumos`:
```markdown
| critico | tinyint(1) | YES | 0 | | | Insumo crítico que fuerza auditoría obligatoria |
```

### 2. README.md
Agregar en sección "Reglas de Auditoría Automática":
```markdown
5. **Insumos Críticos** - Presupuesto contiene insumo marcado como crítico
```

### 3. Manual de Usuario
Agregar sección en gestión de insumos explicando funcionalidad de insumos críticos.

## Checklist de Implementación

- [ ] Crear migración SQL `015_add_insumos_criticos.sql`
- [ ] Ejecutar migración en BD local
- [ ] Actualizar `database-schema.md`
- [ ] Agregar método `tieneInsumosCriticos()` en repository
- [ ] Modificar `evaluarEstadoAutomatico()` en calculosService
- [ ] Modificar `finalizarPresupuesto()` en presupuestoService
- [ ] Agregar endpoint `toggleCritico()` en insumosController
- [ ] Agregar ruta PATCH en insumos.ts
- [ ] Actualizar tipos TypeScript (backend y frontend)
- [ ] Agregar columna "Crítico" en GestionInsumos.tsx
- [ ] Agregar handler `handleToggleCritico()` en frontend
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Actualizar README.md
- [ ] Actualizar manual de usuario
- [ ] Testing en ambiente local
- [ ] Code review
- [ ] Deploy a producción

## Estimación
- **Tiempo de desarrollo**: 3-4 horas
- **Complejidad**: Baja-Media
- **Riesgo**: Bajo (cambios aislados, no afecta funcionalidad existente)

---

**Versión**: 1.0  
**Fecha**: Enero 2025  
**Estado**: 📋 Propuesta
