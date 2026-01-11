# Mejoras Sistema de Notificaciones y Versionado

## Análisis del Problema Actual

### 1. Pérdida de Trazabilidad en Nuevas Versiones

**Problema**: Al crear una nueva versión, se eliminan notificaciones y auditorías previas:

```typescript
// versioningService.ts - Líneas problemáticas
await connection.query('DELETE FROM notificaciones WHERE presupuesto_id = ?', [presupuestoId]);
await connection.query('DELETE FROM auditorias_presupuestos WHERE presupuesto_id = ?', [presupuestoId]);
```

**Impacto**:
- Se pierde el historial completo de auditoría
- No hay trazabilidad de quién y cuándo se tomaron decisiones
- Imposible hacer análisis de patrones de auditoría

### 2. Limitaciones del Sistema "Observar"

**Problema Actual**: Solo Gerencia Prestacional puede "observar"

```typescript
// auditoriaService.ts
if (accion === 'observar' && gerencia !== 'prestacional') {
  throw new AppError(403, 'Solo la Gerencia Prestacional puede observar presupuestos');
}
```

**Limitaciones**:
- Gerencia Administrativa no puede devolver para correcciones menores
- Fuerza creación de nuevas versiones innecesariamente
- Aumenta complejidad del flujo

### 3. Falta de Contexto Histórico en Modales

**Problema**: Cada versión se ve por separado, gerencias no tienen contexto de versiones anteriores.

## Propuestas de Mejora

### Fase 1: Preservar Trazabilidad Completa

#### 1.1 Modificar Estructura de Auditorías
```sql
-- Agregar campo version_id a auditorias_presupuestos
ALTER TABLE auditorias_presupuestos 
ADD COLUMN version_id INT,
ADD INDEX idx_version_id (version_id);
```

#### 1.2 Eliminar DELETE de Auditorías
```typescript
// versioningService.ts - ELIMINAR estas líneas
// await connection.query('DELETE FROM notificaciones WHERE presupuesto_id = ?', [presupuestoId]);
// await connection.query('DELETE FROM auditorias_presupuestos WHERE presupuesto_id = ?', [presupuestoId]);

// AGREGAR: Actualizar auditorías con version_id
await connection.query(
  'UPDATE auditorias_presupuestos SET version_id = ? WHERE presupuesto_id = ? AND version_id IS NULL',
  [versionAnterior, presupuestoId]
);
```

#### 1.3 Consultas con Historial Completo
```typescript
// Obtener historial completo de todas las versiones
const historialCompleto = await connection.query(`
  SELECT a.*, p.version, u.nombre_usuario
  FROM auditorias_presupuestos a
  LEFT JOIN presupuestos p ON a.presupuesto_id = p.idPresupuestos
  LEFT JOIN usuarios u ON a.usuario_id = u.id
  WHERE a.presupuesto_id = ? OR a.version_id IN (
    SELECT idPresupuestos FROM presupuestos WHERE presupuesto_original_id = ?
  )
  ORDER BY a.fecha_accion DESC
`, [presupuestoId, presupuestoOriginalId]);
```

### Fase 2: Expandir Funcionalidad "Observar"

#### 2.1 Permitir Observar a Gerencia Administrativa
```typescript
// auditoriaService.ts - Modificar validación
if (accion === 'observar' && !['prestacional', 'administrativa'].includes(gerencia)) {
  throw new AppError(403, 'Solo las Gerencias Prestacional y Administrativa pueden observar presupuestos');
}
```

#### 2.2 Agregar Estados Específicos
```sql
-- Nuevos estados para observaciones
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa', 
  'en_revision_administrativa',
  'observado_administrativa',  -- NUEVO
  'pendiente_prestacional',
  'en_revision_prestacional', 
  'observado_prestacional',    -- NUEVO
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'rechazado'
);
```

#### 2.3 Flujo de Observaciones
```typescript
// Lógica para manejar observaciones por gerencia
const manejarObservacion = async (presupuestoId: number, gerencia: string, observaciones: string) => {
  const nuevoEstado = gerencia === 'administrativa' 
    ? 'observado_administrativa' 
    : 'observado_prestacional';
    
  await actualizarEstado(presupuestoId, nuevoEstado);
  await crearNotificacion(presupuestoId, 'observado', observaciones);
};
```

### Fase 3: Modal con Contexto Histórico

#### 3.1 Componente de Historial Expandido
```typescript
// HistorialVersiones.tsx
interface HistorialVersionesProps {
  presupuestoId: number;
  mostrarTodasVersiones?: boolean;
}

const HistorialVersiones: React.FC<HistorialVersionesProps> = ({ 
  presupuestoId, 
  mostrarTodasVersiones = false 
}) => {
  const [historial, setHistorial] = useState([]);
  
  useEffect(() => {
    const endpoint = mostrarTodasVersiones 
      ? `/api/presupuestos/${presupuestoId}/historial-completo`
      : `/api/presupuestos/${presupuestoId}/historial`;
      
    fetchHistorial(endpoint);
  }, [presupuestoId, mostrarTodasVersiones]);
  
  return (
    <Timeline>
      {historial.map(evento => (
        <Timeline.Item key={evento.id} title={evento.accion}>
          <Text size="sm">{evento.descripcion}</Text>
          <Text size="xs" color="dimmed">
            {evento.usuario} - {formatearFecha(evento.fecha)}
          </Text>
          {evento.version && (
            <Badge size="xs">Versión {evento.version}</Badge>
          )}
        </Timeline.Item>
      ))}
    </Timeline>
  );
};
```

#### 3.2 Modal de Auditoría Mejorado
```typescript
// Agregar toggle para ver historial completo
const [verHistorialCompleto, setVerHistorialCompleto] = useState(false);

<Modal size="xl" opened={modalOpened} onClose={closeModal}>
  <Stack>
    <Group justify="space-between">
      <Title order={3}>Auditar Presupuesto</Title>
      <Switch
        label="Ver historial completo"
        checked={verHistorialCompleto}
        onChange={(e) => setVerHistorialCompleto(e.currentTarget.checked)}
      />
    </Group>
    
    <HistorialVersiones 
      presupuestoId={modalData?.idPresupuestos}
      mostrarTodasVersiones={verHistorialCompleto}
    />
    
    {/* Resto del modal */}
  </Stack>
</Modal>
```

### Fase 4: Prevención de Aprobaciones Obsoletas

#### 4.1 Validación de Versión Activa
```typescript
// Antes de aprobar, verificar que sea la última versión
const validarVersionActiva = async (presupuestoId: number) => {
  const [rows] = await pool.query(
    'SELECT es_ultima_version FROM presupuestos WHERE idPresupuestos = ?',
    [presupuestoId]
  );
  
  if (!rows[0]?.es_ultima_version) {
    throw new AppError(400, 'No se puede aprobar una versión obsoleta. Existe una versión más reciente.');
  }
};
```

#### 4.2 Notificación de Versión Obsoleta
```typescript
// En el frontend, verificar antes de mostrar acciones
const verificarVersionActiva = async (presupuestoId: number) => {
  try {
    await api.get(`/api/presupuestos/${presupuestoId}/verificar-activa`);
    return true;
  } catch (error) {
    notifications.show({
      title: 'Versión Obsoleta',
      message: 'Este presupuesto tiene una versión más reciente. Recargando...',
      color: 'orange'
    });
    // Recargar dashboard
    return false;
  }
};
```

## Plan de Implementación

### Semana 1: Preservar Trazabilidad
- [ ] Migración BD: Agregar `version_id` a `auditorias_presupuestos`
- [ ] Modificar `versioningService.ts`: Eliminar DELETEs
- [ ] Actualizar consultas de historial
- [ ] Testing de nueva lógica

### Semana 2: Expandir "Observar"
- [ ] Migración BD: Nuevos estados de observación
- [ ] Modificar `auditoriaService.ts`: Permitir observar a G. Administrativa
- [ ] Actualizar frontend: Botones y flujos
- [ ] Testing de observaciones

### Semana 3: Modal con Contexto
- [ ] Componente `HistorialVersiones`
- [ ] Modificar modales de auditoría
- [ ] Endpoint `/historial-completo`
- [ ] Testing de UI

### Semana 4: Prevención Obsoletas
- [ ] Validación de versión activa
- [ ] Notificaciones de versión obsoleta
- [ ] Auto-refresh de dashboards
- [ ] Testing integral

## Riesgos y Mitigaciones

### Riesgo 1: Migración de Datos Existentes
**Mitigación**: Script de migración que preserve datos actuales:
```sql
-- Backup antes de migración
CREATE TABLE auditorias_presupuestos_backup AS SELECT * FROM auditorias_presupuestos;

-- Migración gradual con rollback plan
```

### Riesgo 2: Performance con Historial Completo
**Mitigación**: 
- Índices optimizados en `version_id`
- Paginación en historial
- Cache de consultas frecuentes

### Riesgo 3: Complejidad de Estados
**Mitigación**:
- Documentación clara de transiciones
- Tests exhaustivos de flujos
- Rollback plan para estados anteriores

## Beneficios Esperados

1. **Trazabilidad Completa**: Historial íntegro de todas las decisiones
2. **Flexibilidad de Flujo**: Menos creaciones innecesarias de versiones
3. **Mejor UX**: Gerencias con contexto completo para decisiones
4. **Consistencia**: Prevención de aprobaciones de versiones obsoletas
5. **Auditoría**: Capacidad de análisis de patrones y métricas

## Métricas de Éxito

- **Reducción 50%** en creaciones de nuevas versiones
- **100%** de trazabilidad preservada
- **Tiempo de auditoría** reducido por mejor contexto
- **0 aprobaciones** de versiones obsoletas
- **Satisfacción de gerencias** mejorada por mejor información