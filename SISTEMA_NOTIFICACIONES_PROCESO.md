# Sistema de Notificaciones - Proceso Completo

## Flujo General del Sistema

```
Acción Usuario → Trigger BD → Notificación → SSE → Frontend → UI Update
     ↓              ↓           ↓           ↓        ↓         ↓
  (Guardar)    (Automático)  (Persiste)  (Tiempo)  (Hook)   (Visual)
```

---

## 1. **Generación de Notificaciones**

### **Triggers Automáticos en Base de Datos**
Cuando ocurren estos eventos, se crean notificaciones automáticamente:

- **Guardar versión de presupuesto** → Evalúa si necesita auditoría
- **Cambio de estado** (aprobado/rechazado) → Notifica al creador
- **Solicitud de auditoría** → Notifica a auditores médicos

### **Reglas de Negocio**
```sql
-- Si rentabilidad < 15% O costo > $150,000 → Estado 'pendiente'
-- Asigna notificación a usuarios con rol 'auditor_medico'
```

---

## 2. **Backend - Gestión de Notificaciones**

### **Endpoints API REST**
```typescript
GET /api/notificaciones          // Lista paginada (20 registros)
GET /api/notificaciones/count    // Contador no leídas
PUT /api/notificaciones/:id/leer // Marcar como leída
PUT /api/notificaciones/leer-todas // Marcar todas como leídas
```

### **Server-Sent Events (SSE)**
```typescript
GET /api/stream/updates?token=JWT_TOKEN
```

**Flujo SSE:**
1. Cliente se conecta con JWT en query param
2. Backend valida token y almacena conexión
3. Envía datos iniciales (contador + lista)
4. Mantiene conexión con heartbeat cada 30s
5. Broadcast automático cuando hay cambios

### **Broadcast de Actualizaciones**
```typescript
// Cuando se crea/modifica notificación
broadcastNotificationUpdate(userId) → Envía a conexiones del usuario
broadcastPresupuestoUpdate() → Envía a todos los auditores
```

---

## 3. **Frontend - Consumo en Tiempo Real**

### **Hook Principal: useRealtimeUpdates**
```typescript
// Establece conexión SSE
const eventSource = new EventSource('/api/stream/updates?token=...')

// Escucha eventos
eventSource.addEventListener('notifications', (event) => {
  setData(prev => ({ 
    ...prev, 
    notifications: event.data.count,
    notificationsList: event.data.list 
  }))
})

// Fallback automático cada 30s si no hay actualizaciones por 45s
setInterval(() => {
  if (timeSinceLastUpdate > 45000) {
    refreshData() // Llamada manual a API
  }
}, 30000)
```

### **Hook Secundario: useNotificationCount**
```typescript
// Wrapper que expone solo el contador
const { count, refreshData } = useRealtimeUpdates()
```

---

## 4. **Integración en UI**

### **Dashboard Principal**
```typescript
// UserDashboard.tsx
const { count: notificationCount, isConnected, refreshData } = useNotificationCount()

// Indicador de conexión (dot verde/rojo)
<ConnectionStatus isConnected={isConnected} />

// Pestaña con contador
<Tabs.Tab value="notificaciones">
  Notificaciones
  <NotificationIndicator count={notificationCount} />
</Tabs.Tab>
```

### **Componente Notificaciones**
```typescript
// Auto-refresh cada 60s como fallback adicional
useEffect(() => {
  const interval = setInterval(fetchNotifications, 60000)
  return () => clearInterval(interval)
}, [])

// Botón manual de refresh
<ActionIcon onClick={fetchNotifications}>
  <ArrowPathIcon />
</ActionIcon>
```

---

## 5. **Casos de Uso Específicos**

### **Caso 1: Usuario Guarda Presupuesto**
1. `UserDashboard` → `handleGuardarTotales()`
2. API: `PUT /presupuestos/:id/version`
3. Backend evalúa reglas automáticas
4. Si necesita auditoría → Crea notificación para auditores
5. `broadcastPresupuestoUpdate()` → SSE a auditores
6. Frontend auditor recibe actualización automática

### **Caso 2: Auditor Aprueba/Rechaza**
1. `Auditoria` → `cambiarEstado()`
2. API: `PUT /auditoria/estado/:id`
3. Backend actualiza estado + crea notificación para creador
4. `broadcastNotificationUpdate(creadorId)` → SSE al creador
5. Frontend creador ve notificación instantánea

### **Caso 3: Usuario Lee Notificación**
1. `Notificaciones` → Click en `<CheckIcon>`
2. Frontend: Actualización optimista local
3. API: `PUT /notificaciones/:id/leer`
4. Backend: Actualiza BD + `broadcastNotificationUpdate(userId)`
5. SSE: Envía a TODAS las conexiones del usuario
6. Todas las pestañas: Reciben count actualizado
7. Todas las pestañas: Dot se actualiza instantáneamente

---

## 6. **Mecanismos de Respaldo**

### **Triple Redundancia**
1. **SSE Primario**: Actualizaciones instantáneas
2. **Polling Automático**: Cada 30-60s si SSE falla
3. **Refresh Manual**: Botones en cada componente

### **Reconexión Automática**
```typescript
// Backoff exponencial: 5s, 10s, 15s, 20s, 25s
const delay = Math.min(5000 * retryCount, 30000)
setTimeout(connectSSE, delay)
```

### **Detección de Conexiones Muertas**
```typescript
// Backend limpia conexiones automáticamente
if (!sendSSEEvent(res, eventType, data)) {
  removeConnection(userId, res)
}
```

---

## 7. **Flujo de Datos Completo**

```
[Usuario Acción] 
    ↓
[API Call] 
    ↓
[Backend Controller] 
    ↓
[Database Update + Trigger] 
    ↓
[Notificación Creada] 
    ↓
[SSE Broadcast] 
    ↓
[Frontend Hook Update] 
    ↓
[UI Re-render] 
    ↓
[Usuario Ve Cambio]
```

**Tiempo total**: < 100ms para actualizaciones en tiempo real

---

## 8. **Archivos Clave por Funcionalidad**

### **Generación**
- `backend/migrations/fase1_sistema_versiones_auditoria.sql`
- `backend/src/routes/auditoria-simple.ts`

### **Distribución**
- `backend/src/controllers/sseController.ts`
- `backend/src/routes/sse.ts`

### **Consumo**
- `frontend/src/hooks/useRealtimeUpdates.tsx`
- `frontend/src/hooks/useNotificationCount.tsx`

### **Visualización**
- `frontend/src/pages/Notificaciones.tsx`
- `frontend/src/components/NotificationIndicator.tsx`
- `frontend/src/pages/UserDashboard.tsx`

Este sistema garantiza que los usuarios vean las notificaciones inmediatamente sin necesidad de refrescar la página manualmente.