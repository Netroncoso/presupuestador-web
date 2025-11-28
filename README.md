# Sistema Presupuestador Web

Sistema integral de gestión de presupuestos médicos con auditoría automatizada, versionado, valores históricos y notificaciones en tiempo real.

## 🚀 Características Principales

- **Cotizador Inteligente**: Gestión completa de insumos y prestaciones médicas
- **Sistema de Versiones**: Control de cambios con historial completo
- **Valores Históricos (Timelapse)**: Gestión de precios por períodos de vigencia
- **Auditoría Automatizada**: 4 reglas automáticas para validación de presupuestos
- **Notificaciones en Tiempo Real**: SSE (Server-Sent Events) para actualizaciones instantáneas
- **Modo Solo Lectura**: Visualización segura de presupuestos históricos con valores de época
- **Roles de Usuario**: Usuario normal, Auditor médico, Administrador

## 📋 Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Migraciones
```bash
# Ejecutar migración de valores históricos
mysql -u root -p presupuestador < backend/migrations/create_prestador_servicio_valores.sql
```

## 🔑 Variables de Entorno

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=presupuestador
PORT=3000
JWT_SECRET=tu_secret_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 📚 Documentación

- [Manual de Usuario](./MANUAL_USUARIO_V2.md) - Guía completa para usuarios
- [Arquitectura del Sistema](./ARCHITECTURE_V2.md) - Diseño técnico y componentes
- [API REST](./backend/RUTAS_API.md) - Documentación de endpoints
- [Sistema de Notificaciones](./SISTEMA_NOTIFICACIONES.md) - SSE y notificaciones en tiempo real
- [Valores Históricos](./IMPLEMENTACION_VALORES_HISTORICOS.md) - Sistema de precios por períodos

## 🏗️ Arquitectura

```
presupuestador-web/
├── backend/          # API REST + SSE
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── prestadorValoresController.ts  # Valores históricos
│   │   │   ├── prestacionesController.ts      # Prestaciones con histórico
│   │   │   └── presupuestosControllerV2.ts    # Versionado
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── db.ts
│   └── migrations/
│       └── create_prestador_servicio_valores.sql
├── frontend/         # React + TypeScript + Vite + Mantine
│   └── src/
│       ├── pages/
│       │   ├── admin/ServiciosPorPrestador.tsx  # Gestión valores
│       │   └── Prestaciones.tsx                 # Integración histórico
│       ├── components/
│       ├── hooks/
│       └── services/
└── docs/            # Documentación adicional
```

## 🔐 Roles y Permisos

### Usuario Normal
- Crear y editar presupuestos
- Ver historial propio
- Solicitar auditoría manual
- Recibir notificaciones de aprobación/rechazo

### Auditor Médico
- Revisar presupuestos pendientes
- Aprobar/Rechazar presupuestos
- Ver historial completo (solo lectura)
- Recibir notificaciones de presupuestos pendientes

### Administrador
- Gestión de usuarios
- Gestión de financiadores y prestaciones
- **Gestión de valores históricos** (nuevo)
- Acceso completo al sistema

## 📊 Flujo de Trabajo

1. **Crear Presupuesto**: Usuario ingresa datos del paciente
2. **Agregar Insumos/Prestaciones**: Selección con valores vigentes actuales
3. **Finalizar**: Sistema calcula totales y evalúa reglas automáticas
4. **Auditoría** (si aplica): Auditor médico revisa y aprueba/rechaza
5. **Historial**: Registro completo con versionado y valores de época

## 🎯 Reglas de Auditoría Automática

Los presupuestos van a auditoría si cumplen **al menos una** de estas condiciones:

1. **Rentabilidad < 15%** - Rentabilidad muy baja
2. **Costo Total > $150,000** - Monto alto
3. **Difícil Acceso = 'SI'** - Casos especiales
4. **Rentabilidad con Plazo > 25%** - Posible sobreprecio

## 🔄 Sistema de Versiones

- Cada presupuesto puede tener múltiples versiones
- Solo la última versión está activa (`es_ultima_version = 1`)
- Editar un presupuesto finalizado crea una nueva versión
- Historial completo de cambios con trazabilidad
- **Nueva versión actualiza `valor_facturar` con precios actuales**
- **Mantiene `valor_asignado` original (costo negociado)**

## 💰 Sistema de Valores Históricos (Timelapse)

### Características
- Gestión de precios por períodos de vigencia
- Cierre automático de períodos al agregar nuevos valores
- Consulta de valores vigentes por fecha
- Integración con presupuestos históricos

### Comportamiento
| Escenario | `valor_asignado` | `valor_facturar` |
|-----------|------------------|------------------|
| **Crear presupuesto nuevo** | Usuario elige | Valores actuales |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD |
| **Editar → Nueva versión** | Mantiene original | Actualiza a valores actuales |

### Gestión (Admin)
- Modal unificado con edición rápida
- Agregar múltiples valores futuros
- Tabla de histórico con indicador de vigencia
- Formato monetario argentino ($ 1.234,56)

## 📱 Notificaciones en Tiempo Real

- **SSE (Server-Sent Events)** para actualizaciones instantáneas
- Notificaciones de auditoría (aprobación/rechazo)
- Alertas de presupuestos pendientes
- Indicador visual de conexión

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Scripts Útiles

### Limpiar Presupuestos de Prueba
```bash
mysql -u root -p presupuestador < backend/LIMPIAR_PRESUPUESTOS_PRUEBA.sql
```

### Ejecutar Migraciones
```bash
# Migración de valores históricos
mysql -u root -p presupuestador < backend/migrations/create_prestador_servicio_valores.sql

# Otras migraciones
mysql -u root -p presupuestador < backend/migrations/[archivo].sql
```

### Verificar Valores Históricos
```sql
-- Ver histórico de un servicio
SELECT * FROM prestador_servicio_valores 
WHERE id_prestador_servicio = 123 
ORDER BY fecha_inicio DESC;

-- Ver valores vigentes hoy
SELECT * FROM prestador_servicio_valores 
WHERE CURDATE() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31');
```

## 🐛 Troubleshooting

### Error de Conexión SSE
- Verificar que el backend esté corriendo
- Revisar CORS en backend
- Comprobar firewall/antivirus

### Totales en $0
- Sistema recalcula automáticamente desde insumos/prestaciones
- Verificar que existan insumos/prestaciones asociados

### Problemas de Autenticación
- Verificar JWT_SECRET en .env
- Limpiar localStorage del navegador
- Revisar expiración de tokens

### Valores Históricos no se Muestran
- Verificar que la migración se ejecutó correctamente
- Revisar endpoint: `GET /api/prestaciones/servicio/:id/valores`
- Verificar que existe registro en `prestador_servicio_valores`

### Presupuestos Históricos Muestran Valores Actuales
- **Comportamiento esperado**: En modo solo lectura, muestra valores de la fecha del presupuesto
- Verificar que `soloLectura=true` en componente Prestaciones
- Revisar que se pasa `fecha` al endpoint

## 🚀 Nuevas Funcionalidades (v2.0)

### Sistema de Valores Históricos
- ✅ Tabla `prestador_servicio_valores` con períodos de vigencia
- ✅ Migración automática de valores actuales
- ✅ Cierre automático de períodos
- ✅ Consulta de valores por fecha
- ✅ Modal de gestión con edición rápida
- ✅ Múltiples valores futuros
- ✅ Formato monetario argentino

### Integración con Presupuestos
- ✅ Validación automática de `valor_facturar` según fecha
- ✅ Visualización histórica en modo solo lectura
- ✅ Actualización de precios al crear nueva versión
- ✅ Mantenimiento de costos negociados originales

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Equipo

Desarrollado para gestión interna de presupuestos médicos.

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**Versión:** 2.0  
**Última actualización:** Diciembre 2024  
**Estado:** ✅ Producción
