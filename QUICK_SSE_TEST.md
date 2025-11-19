# Quick SSE Test

## Verificación rápida:

### 1. Abrir DevTools (F12) → Network tab

### 2. Iniciar sesión en la app

### 3. Buscar en Network:
- Debe aparecer: `updates?token=...` 
- Status: `200` (no 401)
- Type: `eventsource`

### 4. En Console debe aparecer:
```
SSE connected
```

### 5. Si sigue dando 401:
- Verificar que `localStorage.getItem('token')` tiene valor
- Verificar que el backend está corriendo en puerto correcto
- Verificar que JWT_SECRET está configurado en .env

### 6. Test rápido de notificaciones:
1. Ir a tab "Notificaciones" 
2. Debe aparecer punto verde "Tiempo real"
3. Crear una notificación desde otra pestaña
4. El badge debe actualizarse instantáneamente

## Troubleshooting:
- **401 Error**: Token no se está enviando correctamente
- **CORS Error**: Verificar configuración CORS en backend
- **Connection refused**: Backend no está corriendo
- **No reconnection**: Token no está en localStorage