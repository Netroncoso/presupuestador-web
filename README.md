# Sistema Presupuestador Web

Sistema integral de gestión de presupuestos médicos con auditoría automatizada, versionado y notificaciones en tiempo real.

## 🚀 Características Principales

- **Cotizador Inteligente**: Gestión completa de insumos y prestaciones médicas
- **Sistema de Versiones**: Control de cambios con historial completo
- **Auditoría Automatizada**: 4 reglas automáticas para validación de presupuestos
- **Notificaciones en Tiempo Real**: SSE (Server-Sent Events) para actualizaciones instantáneas
- **Modo Solo Lectura**: Visualización segura de presupuestos históricos
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

## 🏗️ Arquitectura

```
presupuestador-web/
├── backend/          # API REST + SSE
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── db.ts
│   └── migrations/
├── frontend/         # React + TypeScript + Vite
│   └── src/
│       ├── pages/
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
- Acceso completo al sistema

## 📊 Flujo de Trabajo

1. **Crear Presupuesto**: Usuario ingresa datos del paciente
2. **Agregar Insumos/Prestaciones**: Selección y configuración de servicios
3. **Finalizar**: Sistema calcula totales y evalúa reglas automáticas
4. **Auditoría** (si aplica): Auditor médico revisa y aprueba/rechaza
5. **Historial**: Registro completo con versionado

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
mysql -u root -p presupuestador < backend/migrations/[archivo].sql
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
