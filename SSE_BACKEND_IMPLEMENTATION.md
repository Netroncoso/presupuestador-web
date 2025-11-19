# SSE Backend Implementation

## Endpoint requerido en el backend:

```javascript
// En tu archivo de rutas (ej: routes/stream.js)
app.get('/api/stream/updates', authenticateToken, (req, res) => {
  // Headers SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const userId = req.user.id;
  const userRole = req.user.rol;

  // Función para enviar eventos
  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Enviar datos iniciales
  const sendInitialData = async () => {
    try {
      // Notificaciones
      const notificationCount = await getNotificationCount(userId);
      sendEvent('notifications', { count: notificationCount });

      // Presupuestos pendientes (solo para auditores)
      if (userRole === 'auditor_medico') {
        const pendientes = await getPresupuestosPendientes(userId);
        sendEvent('presupuestos', { pendientes });
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  };

  sendInitialData();

  // Cleanup al cerrar conexión
  req.on('close', () => {
    console.log('SSE connection closed for user:', userId);
    res.end();
  });

  req.on('error', (err) => {
    console.error('SSE connection error:', err);
    res.end();
  });
});

// Funciones helper (implementar según tu DB)
async function getNotificationCount(userId) {
  // Tu lógica actual de /notificaciones/count
  // return count;
}

async function getPresupuestosPendientes(userId) {
  // Tu lógica actual de /v2/presupuestos/auditor/pendientes
  // return pendientes;
}
```

## Triggers para enviar actualizaciones:

```javascript
// Cuando se crea una nueva notificación
function broadcastNotificationUpdate(userId) {
  // Encontrar conexiones SSE activas del usuario
  // sendEvent('notifications', { count: newCount });
}

// Cuando cambia estado de presupuesto
function broadcastPresupuestoUpdate() {
  // Enviar a todos los auditores conectados
  // sendEvent('presupuestos', { pendientes: newPendientes });
}
```

## Notas importantes:
1. Usar middleware de autenticación
2. Manejar múltiples conexiones por usuario
3. Implementar heartbeat cada 30s para mantener conexión
4. Considerar usar Redis para múltiples instancias del servidor