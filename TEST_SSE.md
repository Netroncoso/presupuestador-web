# Test SSE Implementation

## Cómo probar que funciona:

### 1. Iniciar el backend:
```bash
cd backend
npm run dev
```

### 2. Iniciar el frontend:
```bash
cd frontend
npm run dev
```

### 3. Pruebas a realizar:

#### Test 1: Notificaciones en tiempo real
1. Abrir 2 pestañas del navegador con usuarios diferentes
2. Verificar que aparece "Tiempo real" (punto verde) en el header
3. En una pestaña, crear una notificación (ej: pedir auditoría)
4. En la otra pestaña, verificar que:
   - El contador en el tab "Notificaciones" se actualiza instantáneamente
   - Aparece un badge rojo con el número de notificaciones
   - Al marcar como leída, el badge se actualiza automáticamente

#### Test 2: Dashboard Auditor en tiempo real
1. Abrir dashboard de auditor
2. Verificar que aparece "Tiempo real activo" (punto verde)
3. Desde otra pestaña, cambiar estado de un presupuesto
4. Verificar que la lista se actualiza automáticamente

#### Test 3: Reconexión automática
1. Detener el backend
2. Verificar que aparece "Desconectado" (punto rojo)
3. Reiniciar el backend
4. Verificar que se reconecta automáticamente

### 4. Verificar en consola del navegador:
- Debe aparecer: "SSE connected"
- NO debe haber errores de conexión
- Cada 30s debe aparecer un heartbeat

### 5. Verificar en logs del backend:
- Debe aparecer: "SSE connection established for user X"
- Al cerrar pestaña: "SSE connection closed for user X"

## Si algo falla:
1. Verificar que el endpoint `/api/stream/updates` responde
2. Verificar que no hay errores CORS
3. Usar el rollback: `ROLLBACK_SSE.md`