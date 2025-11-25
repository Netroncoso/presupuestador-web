# 📚 Índice de Documentación

## 🎯 Documentación Principal

### Para Usuarios
- **[README.md](./README.md)** - Introducción general al sistema
- **[MANUAL_USUARIO_V2.md](./MANUAL_USUARIO_V2.md)** - Guía completa de uso del sistema

### Para Desarrolladores
- **[ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)** - Arquitectura técnica del sistema
- **[backend/RUTAS_API.md](./backend/RUTAS_API.md)** - Documentación de endpoints REST

### Sistemas Específicos
- **[SISTEMA_NOTIFICACIONES.md](./SISTEMA_NOTIFICACIONES.md)** - Sistema de notificaciones en tiempo real (SSE)
- **[ALERTAS_INTELIGENTES.md](./ALERTAS_INTELIGENTES.md)** - Sistema de alertas automáticas

## 🔧 Documentación Técnica

### Backend
- **[backend/README.md](./backend/README.md)** - Configuración y setup del backend
- **[backend/SECURITY.md](./backend/SECURITY.md)** - Consideraciones de seguridad
- **[backend/LIMPIAR_PRESUPUESTOS_PRUEBA.sql](./backend/LIMPIAR_PRESUPUESTOS_PRUEBA.sql)** - Script de limpieza de datos de prueba

### Frontend
- **[frontend/README.md](./frontend/README.md)** - Configuración y setup del frontend
- **[frontend/MIGRACION_V7.md](./frontend/MIGRACION_V7.md)** - Notas de migración

## 📝 Registros de Cambios

- **[CHANGELOG_LIMPIEZA.md](./CHANGELOG_LIMPIEZA.md)** - Registro de limpieza de código
- **[AGENTS.md](./AGENTS.md)** - Información sobre agentes del sistema

## 🗂️ Archivos de Utilidad

### Scripts SQL
- **[analizar_estructura_bd.sql](./analizar_estructura_bd.sql)** - Análisis de estructura de BD
- **[debug_notificaciones.sql](./debug_notificaciones.sql)** - Debug de notificaciones
- **[ejecutar_migracion.sql](./ejecutar_migracion.sql)** - Ejecución de migraciones
- **[fix_notificaciones_faltantes.sql](./fix_notificaciones_faltantes.sql)** - Fix de notificaciones

### Scripts Node.js
- **[check-backend.js](./check-backend.js)** - Verificación de backend
- **[test-prestador.js](./test-prestador.js)** - Test de prestadores
- **[test-sse.html](./test-sse.html)** - Test de SSE

## 📊 Datos de Referencia

- **[Tablas-full.csv](./Tablas-full.csv)** - Estructura completa de tablas

## 🚀 Guías de Inicio Rápido

### Instalación Completa
```bash
# 1. Clonar repositorio
git clone [repo-url]

# 2. Instalar backend
cd backend
npm install
cp .env.example .env
# Configurar .env
npm run dev

# 3. Instalar frontend
cd ../frontend
npm install
npm run dev
```

### Crear Usuario de Prueba
```sql
INSERT INTO usuarios (username, password, rol, sucursal_id)
VALUES ('test', '$2b$10$...', 'usuario', 1);
```

### Ejecutar Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## 🔍 Búsqueda Rápida

### Por Tema

**Autenticación y Seguridad:**
- [ARCHITECTURE_V2.md - Seguridad](#)
- [backend/SECURITY.md](./backend/SECURITY.md)

**Sistema de Versiones:**
- [ARCHITECTURE_V2.md - Sistema de Versionado](#)
- [MANUAL_USUARIO_V2.md - Historial](#)

**Notificaciones:**
- [SISTEMA_NOTIFICACIONES.md](./SISTEMA_NOTIFICACIONES.md)
- [MANUAL_USUARIO_V2.md - Notificaciones](#)

**Auditoría:**
- [MANUAL_USUARIO_V2.md - Dashboard Auditor](#)
- [ALERTAS_INTELIGENTES.md](./ALERTAS_INTELIGENTES.md)

**API REST:**
- [backend/RUTAS_API.md](./backend/RUTAS_API.md)

## 📞 Soporte

Para preguntas o problemas:
1. Revisar documentación relevante
2. Buscar en issues del repositorio
3. Contactar al equipo de desarrollo

## 🔄 Actualizaciones

Esta documentación se actualiza regularmente. Última revisión: **Enero 2025**

---

## 📋 Checklist de Documentación

- [x] README principal
- [x] Manual de usuario
- [x] Arquitectura del sistema
- [x] Documentación de API
- [x] Sistema de notificaciones
- [x] Guías de instalación
- [x] Scripts de utilidad
- [x] Changelog

## 🎓 Recursos de Aprendizaje

### Para Nuevos Desarrolladores
1. Leer [README.md](./README.md)
2. Revisar [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md)
3. Estudiar [backend/RUTAS_API.md](./backend/RUTAS_API.md)
4. Explorar código fuente

### Para Nuevos Usuarios
1. Leer [MANUAL_USUARIO_V2.md](./MANUAL_USUARIO_V2.md)
2. Practicar con datos de prueba
3. Revisar [Preguntas Frecuentes](#)

---

**Mantenido por:** Equipo de Desarrollo
**Última actualización:** Enero 2025
