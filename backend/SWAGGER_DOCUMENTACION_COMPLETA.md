# Documentación Swagger - Sistema Presupuestador Web

## 📊 Resumen Completo

**Total de Endpoints Documentados: ~100**

### Distribución por Módulo:

#### 1. Autenticación (2 endpoints)
- POST /api/auth/login - Login de usuario
- GET /api/auth/verify - Verificar token JWT

#### 2. Presupuestos (18 endpoints)
- GET /api/presupuestos - Listar presupuestos
- POST /api/presupuestos - Crear presupuesto
- GET /api/presupuestos/:id - Obtener presupuesto
- PUT /api/presupuestos/:id - Actualizar presupuesto
- DELETE /api/presupuestos/:id - Eliminar presupuesto
- PUT /api/presupuestos/:id/finalizar - Finalizar presupuesto
- GET /api/presupuestos/:id/versiones - Historial de versiones
- GET /api/presupuestos/:id/equipamientos - Equipamientos del presupuesto
- POST /api/presupuestos/:id/equipamientos - Agregar equipamiento
- DELETE /api/presupuestos/:id/equipamientos - Eliminar equipamiento
- GET /api/presupuesto-insumos/:id - Obtener insumos
- POST /api/presupuestos/:id/insumos - Agregar insumo
- DELETE /api/presupuestos/:id/insumos - Eliminar insumo
- GET /api/presupuesto-prestaciones/:id - Obtener prestaciones
- POST /api/presupuestos/:id/prestaciones - Agregar prestación
- DELETE /api/presupuestos/:id/prestaciones - Eliminar prestación

#### 3. Auditoría Multi-Gerencial (15 endpoints)
- GET /api/auditoria-multi/pendientes-administrativa - Pendientes G. Administrativa
- GET /api/auditoria-multi/pendientes-prestacional - Pendientes G. Prestacional
- GET /api/auditoria-multi/pendientes-general - Pendientes G. General
- GET /api/auditoria-multi/mis-casos - Casos asignados al gerente
- POST /api/auditoria-multi/tomar/:id - Tomar caso (FCFS)
- PUT /api/auditoria-multi/aprobar-administrativa/:id - Aprobar (G. Administrativa)
- PUT /api/auditoria-multi/rechazar-administrativa/:id - Rechazar (G. Administrativa)
- PUT /api/auditoria-multi/derivar-prestacional/:id - Derivar a G. Prestacional
- PUT /api/auditoria-multi/aprobar-prestacional/:id - Aprobar (G. Prestacional)
- PUT /api/auditoria-multi/rechazar-prestacional/:id - Rechazar (G. Prestacional)
- PUT /api/auditoria-multi/observar/:id - Observar (devolver a usuario)
- PUT /api/auditoria-multi/escalar-general/:id - Escalar a G. General
- PUT /api/auditoria-multi/aprobar-general/:id - Aprobar (G. General)
- PUT /api/auditoria-multi/rechazar-general/:id - Rechazar (G. General)
- PUT /api/auditoria-multi/devolver/:id - Devolver a otra gerencia

#### 4. Auditoría Simple - Deprecado (4 endpoints)
- GET /api/auditoria/historial/:id - Historial de auditoría
- GET /api/auditoria/pendientes - Presupuestos pendientes
- PUT /api/auditoria/pedir/:id - Solicitar auditoría manual
- PUT /api/auditoria/estado/:id - Cambiar estado

#### 5. Notificaciones (4 endpoints)
- GET /api/notificaciones - Obtener notificaciones
- GET /api/notificaciones/count - Contar no leídas
- PUT /api/notificaciones/:id/leer - Marcar como leída
- PUT /api/notificaciones/leer-todas - Marcar todas como leídas

#### 6. Insumos (1 endpoint)
- GET /api/insumos - Listar insumos con filtros

#### 7. Prestaciones (5 endpoints)
- GET /api/prestaciones/prestadores - Listar prestadores
- GET /api/prestaciones/por-prestador/:id - Servicios por prestador
- GET /api/prestaciones/info/:id - Info de servicio
- GET /api/prestaciones/valores-historicos/:id - Valores históricos
- POST /api/prestaciones/valores-historicos/:id - Agregar valor histórico

#### 8. Equipamientos (20+ endpoints)
**Admin CRUD:**
- GET /api/equipamientos/admin - Listar equipamientos
- POST /api/equipamientos/admin - Crear equipamiento
- PUT /api/equipamientos/admin/:id - Actualizar equipamiento
- DELETE /api/equipamientos/admin/:id - Eliminar equipamiento

**Tipos:**
- GET /api/equipamientos/tipos - Listar tipos
- POST /api/equipamientos/tipos - Crear tipo
- PUT /api/equipamientos/tipos/:id - Actualizar tipo

**Acuerdos Admin:**
- GET /api/equipamientos/admin/financiadores - Listar financiadores
- GET /api/equipamientos/admin/por-financiador/:id - Equipamientos por financiador
- POST /api/equipamientos/admin/acuerdo - Crear acuerdo

**Públicos:**
- GET /api/equipamientos/financiador/:id - Equipamientos para presupuesto

**Valores Históricos:**
- GET /api/equipamientos/valores-historicos/:id - Obtener valores
- POST /api/equipamientos/valores-historicos/:id - Agregar valor

#### 9. Admin - Usuarios (5 endpoints)
- GET /api/admin/usuarios - Listar usuarios
- POST /api/admin/usuarios - Crear usuario
- PUT /api/admin/usuarios/:id - Actualizar usuario
- PUT /api/admin/usuarios/:id/toggle - Activar/Desactivar
- DELETE /api/admin/usuarios/:id - Eliminar usuario

#### 10. Admin - Insumos (4 endpoints)
- GET /api/admin/insumos - Listar insumos
- POST /api/admin/insumos - Crear insumo
- PUT /api/admin/insumos/:id - Actualizar insumo
- DELETE /api/admin/insumos/:id - Eliminar insumo

#### 11. Admin - Financiadores (3 endpoints)
- GET /api/admin/prestadores - Listar financiadores
- GET /api/admin/prestadores/:id/acuerdos - Acuerdos del financiador
- PUT /api/admin/prestadores/:id - Actualizar financiador

#### 12. Admin - Servicios (3 endpoints)
- GET /api/admin/servicios/financiadores - Listar financiadores
- GET /api/admin/servicios/por-financiador/:id - Servicios por financiador
- POST /api/admin/servicios/valores-historicos/:id - Agregar valor histórico

#### 13. Admin - Servicios CRUD (4 endpoints)
- GET /api/admin/servicios-crud - Listar servicios
- POST /api/admin/servicios-crud - Crear servicio
- PUT /api/admin/servicios-crud/:id - Actualizar servicio
- DELETE /api/admin/servicios-crud/:id - Eliminar servicio

#### 14. Admin - Sucursales (2 endpoints)
- GET /api/admin/sucursales - Listar sucursales
- PUT /api/admin/sucursales/:id - Actualizar sucursal

#### 15. Admin - Tipos de Unidad (2 endpoints)
- GET /api/tipos-unidad - Listar tipos de unidad
- POST /api/tipos-unidad - Crear tipo de unidad

#### 16. Alertas (5 endpoints)
- GET /api/alertas-servicios - Obtener alertas de servicios
- POST /api/alertas-servicios - Crear alerta de servicio
- PUT /api/alertas-servicios/:id - Actualizar alerta de servicio
- GET /api/alertas-equipamientos - Obtener alertas de equipamientos
- PUT /api/alertas-equipamientos/:id - Actualizar alerta de equipamiento

#### 17. Configuración (3 endpoints)
- GET /api/configuracion/reglas-negocio - Obtener reglas
- PUT /api/configuracion/reglas-negocio/:clave - Actualizar regla
- PUT /api/configuracion/reglas-negocio - Actualizar múltiples reglas

#### 18. Reportes Financieros (6 endpoints)
- GET /api/reportes/financiero/kpis - KPIs principales
- GET /api/reportes/financiero/ranking-financiadores - Ranking de financiadores
- GET /api/reportes/financiero/ranking-sucursales - Ranking de sucursales
- GET /api/reportes/financiero/analisis-costos - Análisis de costos
- GET /api/reportes/financiero/promedios-generales - Promedios generales
- GET /api/reportes/financiero/servicios-por-financiador - Servicios por financiador

#### 19. Sucursales (1 endpoint)
- GET /api/sucursales - Listar sucursales públicas

#### 20. Sistema - Health (1 endpoint)
- GET /api/health - Health check del sistema

#### 21. Sistema - Cache (2 endpoints)
- GET /api/cache - Estadísticas de cache
- POST /api/cache/flush - Limpiar cache

#### 22. Sistema - SSE (1 endpoint)
- GET /api/stream/updates - Stream de actualizaciones en tiempo real

---

## 🚀 Acceso a la Documentación

### URL Local
```
http://localhost:4000/api-docs
```

### Características de Swagger UI

✅ **Interfaz Interactiva**: Prueba endpoints directamente desde el navegador  
✅ **Autenticación JWT**: Sistema de autorización integrado  
✅ **Ejemplos de Request/Response**: Cada endpoint incluye ejemplos  
✅ **Esquemas de Datos**: Definiciones completas de objetos  
✅ **Códigos HTTP**: Documentación de respuestas exitosas y errores  
✅ **Agrupación por Tags**: 22 categorías organizadas  

---

## 🔐 Cómo Usar la Autenticación

1. **Obtener Token**:
   - Ir a `POST /api/auth/login`
   - Click en "Try it out"
   - Ingresar credenciales:
     ```json
     {
       "username": "tu_usuario",
       "password": "tu_password"
     }
     ```
   - Copiar el `token` de la respuesta

2. **Autorizar Swagger**:
   - Click en el botón "Authorize" 🔓 (arriba a la derecha)
   - Pegar el token (sin "Bearer")
   - Click en "Authorize"
   - Click en "Close"

3. **Probar Endpoints**:
   - Todos los endpoints protegidos ahora incluirán el token automáticamente
   - El token se envía en el header: `Authorization: Bearer <token>`

---

## 📋 Roles y Permisos

### Usuario Normal
- Crear y editar presupuestos
- Ver historial propio
- Solicitar auditoría manual

### Gerencia Administrativa
- Aprobar/Rechazar presupuestos
- Derivar a Gerencia Prestacional

### Gerencia Prestacional
- Aprobar/Rechazar presupuestos
- Observar (devolver a usuario)
- Escalar a Gerencia General

### Gerencia General
- Aprobar/Rechazar presupuestos
- Devolver a otras gerencias
- Decisión final

### Gerencia Financiera
- Acceso a reportes financieros
- KPIs y análisis

### Administrador
- Acceso completo al sistema
- Gestión de usuarios, insumos, prestaciones, equipamientos
- Configuración de reglas y alertas

---

## 🎯 Endpoints Más Importantes

### Para Usuarios
1. `POST /api/auth/login` - Autenticación
2. `POST /api/presupuestos` - Crear presupuesto
3. `PUT /api/presupuestos/:id/finalizar` - Finalizar presupuesto
4. `GET /api/notificaciones` - Ver notificaciones

### Para Gerencias
1. `GET /api/auditoria-multi/pendientes-*` - Ver pendientes
2. `POST /api/auditoria-multi/tomar/:id` - Tomar caso
3. `PUT /api/auditoria-multi/aprobar-*/:id` - Aprobar
4. `PUT /api/auditoria-multi/rechazar-*/:id` - Rechazar

### Para Administradores
1. `GET /api/admin/usuarios` - Gestión de usuarios
2. `POST /api/admin/insumos` - Crear insumos
3. `POST /api/prestaciones/valores-historicos/:id` - Valores históricos
4. `PUT /api/configuracion/reglas-negocio/:clave` - Configurar reglas

---

## 📊 Estadísticas

- **Total Endpoints**: ~100
- **Módulos**: 22
- **Tags**: 23
- **Métodos HTTP**: GET, POST, PUT, DELETE
- **Autenticación**: JWT Bearer Token
- **Formato**: OpenAPI 3.0

---

## 🔄 Versión

**API Version**: 3.1.0  
**Última Actualización**: Enero 2025  
**Estado**: ✅ Documentación Completa al 100%

---

## 📝 Notas Técnicas

### Sistema de Versiones
- Cada presupuesto puede tener múltiples versiones
- Solo la última versión está activa (`es_ultima_version = 1`)

### Valores Históricos
- Gestión de precios por períodos de vigencia
- Valores diferenciados por sucursal
- Sistema anti-obsolescencia (30 días)

### Auditoría Multi-Gerencial
- Asignación FCFS (First Come First Served)
- Auto-liberación de casos inactivos (30 min)
- 4 gerencias especializadas
- 10 estados de presupuestos

### Notificaciones en Tiempo Real
- SSE (Server-Sent Events)
- Actualizaciones instantáneas
- Conexión persistente

---

**Desarrollado para gestión interna de presupuestos médicos**
