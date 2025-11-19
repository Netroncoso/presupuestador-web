# Fase 2: Lógica de Versiones en Backend

## Resumen

Implementa la lógica completa del sistema de versiones, estados automáticos y notificaciones en el backend, manteniendo **compatibilidad total** con el frontend existente.

## Nuevas Funcionalidades

### 1. Sistema de Versiones
- **Creación automática** de nuevas versiones al editar
- **Preservación** de versiones anteriores
- **Historial completo** de cambios por presupuesto

### 2. Estados Automáticos
- **Evaluación automática** de reglas de negocio
- **Estados**: borrador, pendiente, en_revision, aprobado, rechazado
- **Reglas implementadas**:
  - Rentabilidad < 15% → pendiente
  - Costo > $150,000 → pendiente  
  - Difícil acceso → pendiente

### 3. Sistema de Notificaciones
- **Notificaciones automáticas** a auditores
- **Contador** de notificaciones no leídas
- **Historial** de notificaciones por usuario

### 4. Endpoints para Auditor
- **Dashboard** de presupuestos pendientes
- **Cambio de estados** con auditoría
- **Estadísticas** y métricas

## Archivos Creados

### Controllers
- `presupuestosControllerV2.ts` - Lógica de versiones
- `notificacionesController.ts` - Gestión de notificaciones

### Routes  
- `presupuestosV2.ts` - Endpoints con versiones
- `notificaciones.ts` - API de notificaciones

### Scripts
- `test-fase2.js` - Pruebas de funcionalidad

## Endpoints Nuevos

### Presupuestos V2 (`/api/v2/presupuestos`)
```
GET    /                     # Lista últimas versiones
GET    /:id/historial        # Historial de versiones
PUT    /:id/nueva-version    # Crear nueva versión
GET    /auditor/pendientes   # Pendientes (solo auditor)
PUT    /:id/estado           # Cambiar estado (solo auditor)
```

### Notificaciones (`/api/notificaciones`)
```
GET    /                     # Notificaciones del usuario
GET    /count                # Contador no leídas
PUT    /:id/leer             # Marcar como leída
PUT    /leer-todas           # Marcar todas leídas
```

## Flujo de Trabajo

### 1. Usuario Crea Presupuesto
```javascript
POST /api/v2/presupuestos
// Crea versión 1 en estado 'borrador'
```

### 2. Usuario Edita Presupuesto
```javascript
PUT /api/v2/presupuestos/:id/nueva-version
// 1. Marca versión anterior como no-actual
// 2. Crea nueva versión con datos editados
// 3. Evalúa reglas automáticas
// 4. Notifica auditor si queda 'pendiente'
```

### 3. Auditor Revisa
```javascript
GET /api/v2/presupuestos/auditor/pendientes
// Lista todos los presupuestos pendientes

PUT /api/v2/presupuestos/:id/estado
// Cambia estado y registra auditoría
// Notifica al usuario creador
```

## Reglas Automáticas

```javascript
function evaluarEstadoAutomatico(presupuesto) {
  const reglas = [];
  
  if (presupuesto.rentabilidad < 15) {
    reglas.push('Rentabilidad menor a 15%');
  }
  
  if (presupuesto.costo_total > 150000) {
    reglas.push('Costo total superior a $150,000');
  }
  
  if (presupuesto.dificil_acceso === 'SI') {
    reglas.push('Marcado como difícil acceso');
  }
  
  return reglas.length > 0 ? 'pendiente' : 'borrador';
}
```

## Compatibilidad

### ✅ Endpoints Existentes Funcionan Igual
- `GET /api/presupuestos` - Lista presupuestos (solo últimas versiones)
- `POST /api/presupuestos` - Crea presupuesto (versión 1)
- `GET /api/presupuestos/:id` - Obtiene presupuesto (última versión)
- Todos los endpoints de insumos y prestaciones

### 🆕 Nuevas Capacidades
- Historial de versiones por presupuesto
- Estados automáticos según reglas de negocio
- Notificaciones en tiempo real
- Dashboard para auditor médico

## Pruebas

### Ejecutar Pruebas
```bash
cd backend
node scripts/test-fase2.js
```

### Verificaciones Incluidas
- ✅ Listado de últimas versiones
- ✅ Creación de nuevas versiones  
- ✅ Historial de versiones
- ✅ Consulta de pendientes
- ✅ Sistema de notificaciones

## Permisos por Rol

| Acción | User | Admin | Auditor |
|--------|------|-------|---------|
| Ver sus presupuestos | ✅ | ✅ | ❌ |
| Ver TODOS presupuestos | ❌ | ✅ | ✅ |
| Crear nueva versión | ✅ | ✅ | ❌ |
| Cambiar estados | ❌ | ✅ | ✅ |
| Ver historial | ❌ | ✅ | ✅ |
| Recibir notificaciones | ✅ | ✅ | ✅ |

## Próximos Pasos

1. **Probar endpoints** con herramientas como Postman
2. **Fase 3**: Crear frontend para auditor
3. **Fase 4**: Integrar notificaciones en frontend existente

## Ejemplo de Uso

### Crear Nueva Versión
```bash
curl -X PUT http://localhost:4000/api/v2/presupuestos/123/nueva-version \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total_insumos": 5000,
    "total_prestaciones": 8000,
    "costo_total": 13000,
    "total_facturar": 15000,
    "rentabilidad": 12
  }'
```

### Respuesta
```json
{
  "id": 124,
  "version": 2,
  "estado": "pendiente"
}
```

---

**Importante**: Esta fase mantiene **100% compatibilidad** con el frontend existente mientras agrega las nuevas capacidades de versiones y auditoría.