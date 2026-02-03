# Sistema Presupuestador Web

Sistema integral de gestión de presupuestos médicos con auditoría automatizada, versionado, valores históricos y notificaciones en tiempo real.

## 🚀 Características Principales

- **Cotizador Inteligente**: Gestión completa de insumos, prestaciones y equipamientos médicos
- **Sistema de Versiones**: Control de cambios con historial completo
- **Valores Históricos (Timelapse)**: Gestión de precios por períodos de vigencia y sucursal
- **Auditoría Automatizada**: 4 reglas automáticas para validación de presupuestos
- **Notificaciones en Tiempo Real**: SSE (Server-Sent Events) para actualizaciones instantáneas
- **Modo Solo Lectura**: Visualización segura de presupuestos históricos con valores de época
- **Sistema Multi-Gerencial**: 4 gerencias especializadas con flujo FCFS y auto-liberación
- **Alertas Inteligentes**: Alertas de valores desactualizados y configurables por tipo
- **Roles de Usuario**: Usuario normal, Gerencias (Administrativa, Prestacional, General, Financiera), Administrador
- **Generación de PDF**: Exportación de presupuestos en cualquier estado (borrador, aprobado, rechazado)
- **Manejo de Sesión**: Sistema automático de detección y notificación de sesión expirada (401)

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
# Migración de valores históricos
mysql -u root -p mh_1 < backend/migrations/create_prestador_servicio_valores.sql

# Migración de valores por sucursal
mysql -u root -p mh_1 < backend/migrations/add_sucursal_to_valores.sql

# Migración de índices de performance
mysql -u root -p mh_1 < backend/migrations/add_performance_indexes.sql

# Migración sistema multi-gerencial v3.0
mysql -u root -p mh_1 < backend/migrations/001_migrate_multi_gerencial.sql

# Migración tipos de equipamiento
mysql -u root -p mh_1 < backend/migrations/006_create_tipos_equipamiento.sql

# Migración alertas a tipos
mysql -u root -p mh_1 < backend/migrations/007_move_alertas_to_tipos.sql

# Estandarización nombres de alertas
mysql -u root -p mh_1 < backend/migrations/008_estandarizar_nombres_alertas.sql

# Migraciones del tarifario interno
mysql -u root -p mh_1 < backend/migrations/001_crear_tarifario_zonas.sql
mysql -u root -p mh_1 < backend/migrations/002_crear_tarifario_servicio.sql
mysql -u root -p mh_1 < backend/migrations/003_importar_valores_manual.sql
mysql -u root -p mh_1 < backend/migrations/004_crear_presupuesto_prestaciones_tarifario.sql
mysql -u root -p mh_1 < backend/migrations/005_agregar_markup_tarifario.sql
```

## 🔑 Variables de Entorno

### Backend (.env)
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=mh_1
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=tu_session_secret
JWT_SECRET=tu_jwt_secret
```

**Nota**: El nombre de la base de datos es `mh_1`. El backend corre en puerto **4000** (no 3000).

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
```

## 📚 Documentación

- [Manual de Usuario](./MANUAL_USUARIO_V2.md) - Guía completa para usuarios
- [Arquitectura del Sistema](./ARCHITECTURE_V2.md) - Diseño técnico y componentes
- [API REST](./backend/RUTAS_API.md) - Documentación de endpoints
- [Sistema de Notificaciones](./SISTEMA_NOTIFICACIONES.md) - SSE y notificaciones en tiempo real
- [Valores Históricos](./IMPLEMENTACION_VALORES_HISTORICOS.md) - Sistema de precios por períodos y sucursales
- [Sistema Multi-Gerencial](./SISTEMA_MULTI_GERENCIAL_V3.md) - Auditoría con 4 gerencias y FCFS
- [Módulo Equipamiento](./MODULO_EQUIPAMIENTO_ESPECIFICACION.md) - Especificación de equipamientos
- [Módulo Tarifario](./MODULO_SERVICIOS_PRESUPUESTO.md) - Servicios por presupuesto con tarifario interno

## 🏗️ Arquitectura

```
presupuestador-web/
├── backend/          # API REST + SSE
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── prestadorValoresController.ts     # Valores históricos servicios
│   │   │   ├── equipamientosController.ts        # Equipamientos y valores
│   │   │   ├── prestacionesController.ts         # Prestaciones con histórico
│   │   │   ├── presupuestosControllerV2.ts       # Versionado
│   │   │   └── alertasEquipamientosController.ts # Alertas equipamientos
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── db.ts
│   └── migrations/
│       ├── create_prestador_servicio_valores.sql
│       ├── 006_create_tipos_equipamiento.sql
│       ├── 007_move_alertas_to_tipos.sql
│       └── 008_estandarizar_nombres_alertas.sql
├── frontend/         # React + TypeScript + Vite + Mantine
│   └── src/
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── ServiciosPorPrestador.tsx      # Gestión valores servicios
│       │   │   ├── GestionEquipamientos.tsx       # Acuerdos equipamientos
│       │   │   ├── GestionEquipamientosBase.tsx   # CRUD equipamientos
│       │   │   ├── GestionAlertasServicios.tsx    # Alertas por tipo
│       │   │   └── GestionInsumos.tsx             # Gestión insumos
│       │   └── Prestaciones.tsx                   # Integración histórico
│       ├── components/
│       │   ├── Equipamiento.tsx                   # Selector equipamientos
│       │   └── Insumos.tsx                        # Selector insumos
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

### Gerencia Administrativa
- Primera línea de auditoría
- Aprobar/Rechazar presupuestos
- Derivar a Gerencia Prestacional
- Aprobación condicional para casos estratégicos

### Gerencia Prestacional
- Segunda línea de auditoría
- Aprobar/Rechazar presupuestos
- Observar (devolver a usuario para correcciones)
- Escalar a Gerencia General
- Aprobación condicional

### Gerencia General
- Última línea de auditoría
- Aprobar/Rechazar presupuestos
- Devolver a otras gerencias
- Aprobación condicional
- Decisión final en casos complejos

### Gerencia Financiera
- Dashboard de solo lectura
- Visualización de casos sin capacidad de auditar
- Usa mismo dashboard que G. General pero sin acciones

### Administrador
- Gestión de usuarios
- Gestión de financiadores, prestaciones, equipamientos e insumos
- Gestión de valores históricos por sucursal
- Configuración de alertas por tipo
- Configuración de reglas de negocio
- Acceso completo al sistema

## 📊 Flujo de Trabajo

1. **Crear Presupuesto**: Usuario ingresa datos del paciente y selecciona financiador
2. **Agregar Items**: Selección de insumos, prestaciones y equipamientos con valores vigentes
3. **Finalizar**: Sistema calcula totales y evalúa reglas automáticas
4. **Auditoría Multi-Gerencial** (si aplica):
   - G. Administrativa: Primera revisión, puede aprobar o derivar
   - G. Prestacional: Revisión técnica, puede aprobar, observar o escalar
   - G. General: Decisión final en casos complejos
5. **Asignación FCFS**: Primer gerente disponible toma el caso
6. **Auto-liberación**: Casos inactivos > 30 min vuelven a disponibles
7. **Historial**: Registro completo con versionado, trazabilidad y valores de época

## 🎯 Reglas de Auditoría Automática

Los presupuestos van a auditoría si cumplen **al menos una** de estas condiciones:

1. **Rentabilidad < 15%** - Rentabilidad muy baja
2. **Costo Total > $150,000** - Monto alto
3. **Rentabilidad con Plazo > 25%** - Posible sobreprecio
4. **Utilidad > $50,000** - Alta utilidad

**Nota**: Todos los umbrales son configurables por el super admin desde Panel Admin > Reglas de Negocio.

## 🔄 Sistema de Versiones

- Cada presupuesto puede tener múltiples versiones
- Solo la última versión está activa (`es_ultima_version = 1`)
- Editar un presupuesto finalizado crea una nueva versión
- Historial completo de cambios con trazabilidad
- Nueva versión actualiza `valor_facturar` con precios actuales
- Mantiene `valor_asignado` original (costo negociado)

## 💰 Sistema de Valores Históricos (Timelapse)

### Características
- Gestión de precios por períodos de vigencia
- Valores diferenciados por sucursal (general o específico)
- Cierre automático de períodos al agregar nuevos valores
- Consulta de valores vigentes por fecha y sucursal
- Integración con presupuestos históricos
- Prioridad: Valor específico > Valor general
- Sistema anti-obsolescencia (30 días)

### Comportamiento de Prestaciones
| Escenario | `valor_asignado` | `valor_facturar` |
|-----------|------------------|------------------|
| **Crear presupuesto nuevo** | Usuario elige | Valores actuales |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD |
| **Editar → Nueva versión** | Mantiene original | Actualiza a valores actuales |

### Comportamiento de Insumos
| Escenario | `costo` | `precio_facturar` |
|-----------|---------|-------------------|
| **Crear presupuesto nuevo** | Precio actual tabla insumos | costo * (1 + porcentaje%) |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD |
| **Editar → Nueva versión** | Actualiza a precio actual | Recalcula con porcentaje original |

### Comportamiento de Equipamientos
| Escenario | `costo` | `precio_facturar` |
|-----------|---------|-------------------|
| **Crear presupuesto nuevo** | Valor acuerdo o precio_referencia | Valor acuerdo o precio_referencia |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD |
| **Editar → Nueva versión** | Actualiza a valores actuales | Actualiza a valores actuales |

### Gestión (Admin)
- Modal unificado para gestión de valores históricos
- Selector de sucursal ("Todas" o específica)
- Agregar múltiples valores futuros (con sucursal por fila)
- Tabla de histórico con columna "Sucursal"
- Formato monetario argentino ($ 1.234,56)
- Sistema anti-obsolescencia: Limpieza automática de valores específicos con > 30 días de antigüedad

### Valores por Sucursal
| Configuración | Comportamiento |
|----------------|----------------|
| **Valor general** (`sucursal_id = NULL`) | Aplica a todas las sucursales |
| **Valor específico** (`sucursal_id = X`) | Solo para esa sucursal |
| **General + Específico reciente** | Específico tiene prioridad (≤ 30 días diferencia) |
| **General + Específico obsoleto** | General tiene prioridad (> 30 días diferencia) |
| **Solo específicos** | Sucursales sin valor no ven el servicio |

**Sistema Anti-Obsolescencia (Ventana de 30 días):**
- Al guardar valor general, cierra automáticamente valores específicos con > 30 días de antigüedad
- En consultas, valores específicos obsoletos (> 30 días diferencia con general) pierden prioridad
- Garantiza que actualizaciones de precios generales se apliquen a todas las sucursales

## 🚨 Sistema de Alertas

### Alertas de Valores Desactualizados
- Se disparan al seleccionar items con > 45 días sin actualizar
- Alertas persistentes (autoClose=false) con botón X
- Posición top-center
- Muestran nombre específico del item y días sin actualizar

### Alertas Configurables por Tipo
- **Alertas por Tipo de Unidad (Servicios)**: Configurables desde tipos_unidad
- **Alertas por Tipo de Equipamiento**: Configurables desde tipos_equipamiento
- Parámetros: cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta
- Gestión centralizada desde Panel Admin > Alertas/ Tipo

## 📊 Módulo de Tarifario Interno

### Características
- **Servicios Independientes**: Prestaciones sin convenio con financiadores
- **Sistema de Zonas**: 10 zonas geográficas (CABA, AMBA, Centro, etc.)
- **5 Niveles de Costo**: Cada servicio tiene 5 costos por zona (orden 1-5)
- **Markup Configurable**: 50% por defecto aplicado a todos los costos
- **Valores Históricos**: Sistema timelapse con fecha_inicio/fecha_fin
- **Alertas Inteligentes**: Valores desactualizados (>45 días) y valor más alto (orden 5)

### Flujo de Uso
1. **Seleccionar Zona**: En "Datos del Presupuesto", elegir zona geográfica
2. **Agregar Servicios**: Tab "Por Presupuesto (Tarifario)" en Prestaciones
3. **Elegir Costo**: Seleccionar uno de los 5 costos disponibles
4. **Cálculo Automático**: Sistema aplica markup y suma a total_prestaciones

### Reglas de Auditoría
- **Orden 5 (Más Alto)**: Alerta persistente + Requiere autorización G. Prestacional
- **Fuera de Tarifario**: Usuario editó costo manualmente, se registra para auditoría

### Tablas de Base de Datos
- `tarifario_zonas`: Catálogo de zonas geográficas
- `tarifario_servicio`: Catálogo de servicios del tarifario
- `tarifario_servicio_valores`: Valores históricos (5 costos por zona)
- `presupuesto_prestaciones_tarifario`: Servicios agregados a presupuestos
- `sucursales_tarifario_zonas`: Relación N:M sucursales-zonas

### Fórmula de Cálculo
```
valor_facturar = costo_seleccionado * (1 + markup/100)
total_prestaciones = SUM(presupuesto_prestaciones) + SUM(presupuesto_prestaciones_tarifario)
```



### Características
- CRUD completo de insumos desde Panel Admin
- Campo opcional `codigo_producto` (EAN/SKU)
- Filtrado por nombre O código de producto
- Precio de referencia actualizable
- Estado activo/inactivo
- Integración con presupuestos (cálculo automático con porcentaje)

## 🛠️ Gestión de Equipamientos

### Dos Paneles de Gestión

#### 1. Equipamientos (Gestión Base)
- CRUD completo de equipamientos desde Panel Admin
- Campo `precio_referencia` (valor por defecto)
- Gestión de tipos de equipamiento
- Estado activo/inactivo
- Disponible en tab "Equipamientos" del AdminDashboard

#### 2. Equip/ Financiador (Acuerdos Específicos)
- Acuerdos específicos con valores históricos por sucursal
- Similar a "Serv/ Financiador"
- Todos los equipamientos activos disponibles para todos los financiadores
- Si no hay acuerdo específico, usa `precio_referencia` (valor general)
- Disponible en tab "Equip/ Financiador" del AdminDashboard

### Normalización de Tipos
- Tabla `tipos_equipamiento` con FK desde `equipamientos.tipo_equipamiento_id`
- Tipos predefinidos: oxigenoterapia, mobiliario, monitoreo, ventilacion, otro
- Alertas configurables por tipo (no por equipamiento individual)
- Gestión desde tab "Alertas/ Tipo" (solo super admin)

## 📱 Notificaciones en Tiempo Real

- **SSE (Server-Sent Events)** para actualizaciones instantáneas
- Notificaciones de auditoría (aprobación/rechazo/derivación/escalamiento)
- Alertas de presupuestos pendientes para gerencias
- Indicador visual de conexión en todos los dashboards
- Sistema de auto-reconexión automática
- Notificaciones persistentes en tab "Notificaciones"

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
mysql -u root -p mh_1 < backend/LIMPIAR_PRESUPUESTOS_PRUEBA.sql
```

### Ejecutar Migraciones
```bash
# Migración de valores históricos
mysql -u root -p mh_1 < backend/migrations/create_prestador_servicio_valores.sql

# Migración de índices de performance
mysql -u root -p mh_1 < backend/migrations/add_performance_indexes.sql

# Migración tipos de equipamiento
mysql -u root -p mh_1 < backend/migrations/006_create_tipos_equipamiento.sql

# Otras migraciones
mysql -u root -p mh_1 < backend/migrations/[archivo].sql
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

-- Ver valores por sucursal
SELECT 
  COALESCE(s.Sucursales_mh, 'Todas') as sucursal,
  v.valor_facturar,
  v.fecha_inicio,
  v.fecha_fin
FROM prestador_servicio_valores v
LEFT JOIN sucursales_mh s ON v.sucursal_id = s.ID
WHERE v.id_prestador_servicio = 123
ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC;
```

## 🐛 Troubleshooting

### Error de Conexión SSE
- Verificar que el backend esté corriendo en puerto **4000**
- Revisar CORS en backend (variable `FRONTEND_URL`)
- Comprobar firewall/antivirus
- Verificar indicador de conexión en dashboard

### Sesión Expirada (401)
- Sistema detecta automáticamente y muestra notificación roja
- Ejecuta logout automático
- Usuario debe iniciar sesión nuevamente
- Tokens JWT expiran en 1 hora

### Totales en $0
- Sistema recalcula automáticamente desde insumos/prestaciones/equipamientos
- Verificar que existan items asociados al presupuesto
- Revisar que financiador esté seleccionado (requerido para prestaciones)

### Problemas de Autenticación
- Verificar JWT_SECRET en .env del backend
- Limpiar localStorage del navegador
- Revisar expiración de tokens (1 hora por defecto)
- Verificar que usuario esté activo en BD

### Valores Históricos no se Muestran
- Verificar que la migración se ejecutó correctamente
- Revisar endpoint correspondiente en backend
- Verificar que existe registro en tabla de valores
- Comprobar que sucursal del usuario tiene valores asignados

### Presupuestos Históricos Muestran Valores Actuales
- **Comportamiento esperado**: En modo solo lectura, muestra valores guardados en BD
- Verificar que `soloLectura=true` en componentes
- Revisar que se pasa `fecha` al endpoint de valores históricos

### No Puedo Imprimir PDF
- **Solución**: Botón PDF ahora disponible en todos los estados
- Funciona en borrador, aprobado, rechazado, en auditoría
- Requiere que presupuesto tenga datos de paciente cargados

### Bug: Estado al "Seguir Editando"
- **Problema**: Al finalizar presupuesto que no cumple reglas automáticas, si usuario hace clic en "Seguir Editando", el estado quedaba en `pendiente_administrativa`
- **Solución**: Endpoint `/revertir-borrador` revierte estado a `borrador` y limpia notificaciones/auditorías

### Bug: Crear Nueva Versión con Timeout
- **Problema**: Botón "Crear nueva versión" quedaba trabado por deadlocks en FKs
- **Solución**: Eliminar notificaciones/auditorías ANTES del UPDATE de `es_ultima_version`

### Bug: Campo `nombre` Faltante en Equipamientos
- **Problema**: Al copiar equipamientos en nueva versión, faltaba campo `nombre` NOT NULL
- **Solución**: Incluir campo `nombre` en SELECT y INSERT de equipamientos

### Bug: Columna `total_equipamiento`
- **Problema**: Código usaba `total_equipamientos` (plural) pero BD tiene `total_equipamiento` (singular)
- **Solución**: Corregir nombre de columna en queries

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

**Versión:** 3.3  
**Última actualización:** Enero 2025  
**Estado:** ✅ Producción

## 📝 Historial de Versiones

### v3.3 (Enero 2025)
- ⭐ **Módulo de Tarifario Interno**
- Sistema completo de servicios por presupuesto independiente de convenios
- 10 zonas geográficas con mapeo a 17 sucursales
- 5 niveles de costo por servicio/zona (orden 1-5)
- Markup configurable (50% por defecto)
- Valores históricos con sistema timelapse
- Alertas de valores desactualizados (>45 días)
- Alerta especial para valor más alto (orden 5)
- Tabla separada presupuesto_prestaciones_tarifario
- Cálculo de totales actualizado (convenio + tarifario)
- Selector de zona en DatosPresupuesto con preseleccion automática
- Tabs en Prestaciones: "Con Convenio" y "Por Presupuesto (Tarifario)"
- Hooks useTarifario y useZonas
- Componente PrestacionesTarifario completo
- 5 migraciones SQL ejecutadas exitosamente

### v3.2 (Enero 2025)
- ⭐ **Generación de PDF Mejorada**
- Botón PDF disponible en todos los estados (no solo borrador)
- Hook reutilizable `usePdfGenerator` para múltiples dashboards
- Inclusión de equipamientos en PDF generado
- Sección de equipamientos en modal de detalle
- ⭐ **Manejo de Sesión Expirada**
- Patrón Observer para detección global de errores 401
- Logout automático al expirar sesión
- Notificación toast roja informando al usuario
- Hooks `useApiInterceptor` y `useSessionExpiredNotification`

### v3.1 (Enero 2025)
- ⭐ **Sistema Completo de Equipamientos**
- Gestión base de equipamientos con precio_referencia
- Acuerdos por financiador con valores históricos por sucursal
- Normalización de tipos de equipamiento (tabla tipos_equipamiento)
- Alertas configurables por tipo de equipamiento
- Equipamientos disponibles para todos los financiadores (usa precio_referencia si no hay acuerdo)
- ⭐ **Alertas de Valores Desactualizados**
- Alertas al seleccionar items con > 45 días sin actualizar
- Alertas persistentes con nombre específico y días sin actualizar
- ⭐ **Código de Producto en Insumos**
- Campo opcional codigo_producto (EAN/SKU)
- Filtrado por nombre O código de producto
- ⭐ **Estandarización de Alertas**
- Nombres de columnas consistentes (cantidad_maxima, activo_alerta)
- Panel unificado "Alertas/ Tipo" para servicios y equipamientos
- ⭐ **Mejoras de UI**
- Tabs abreviados en AdminDashboard (Serv/ Financiador, Equip/ Financiador, Alertas/ Tipo)
- Orden optimizado de tabs por prioridad de uso

### v3.0 (Enero 2025)
- ⭐ **Sistema Multi-Gerencial de Auditoría**
- 4 gerencias especializadas (Administrativa, Prestacional, Financiera, General)
- Asignación FCFS (First Come First Served) con FOR UPDATE
- Auto-liberación automática de casos inactivos (30 minutos)
- Aprobación condicional para casos políticos/estratégicos
- 10 estados de presupuestos (borrador → pendiente → en_revisión → final)
- 15 métodos de transición con notificaciones automáticas
- Observar: devolver a usuario sin crear nueva versión
- Escalar: elevar casos complejos a gerencia superior
- Devolver: re-evaluación por otra gerencia
- 9 índices optimizados para alto volumen
- Historial de auditoría humanizado (lenguaje natural + fechas relativas)
- Trazabilidad completa en tabla auditorias_presupuestos
- SSE actualizado para notificaciones multi-gerenciales
- Eliminación completa de rol auditor_medico deprecado

### v2.5 (Enero 2025)
- ⭐ **Sistema anti-obsolescencia de valores históricos**
- Limpieza automática: valores específicos con > 30 días se cierran al guardar general
- Prioridad inteligente: específicos obsoletos (> 30 días) usan valor general
- Ventana de tiempo configurable (30 días por defecto)
- Garantiza consistencia de precios entre sucursales

### v2.4 (Enero 2025)
- ⭐ **Sistema de valores por sucursal**
- Valores generales (todas) y específicos (por sucursal)
- Prioridad dinámica: específico reciente > general > específico obsoleto
- Selector de sucursal en modal de admin
- Columna "Sucursal" en tabla histórico
- Usuario solo ve servicios con valores para su sucursal

### v2.3 (Enero 2025)
- Simplificación de flujo de selección de financiador
- Eliminación de botones Confirmar/Modificar
- Select de financiador siempre editable en borradores
- Warning automático al cambiar financiador
- Limpieza automática de prestaciones al cambiar financiador

### v2.2 (Diciembre 2024)
- Sistema de alertas configurables (umbrales dinámicos)
- Tabla maestra tipos_unidad con normalización
- Gestión de tipos de unidad desde UI
- 11 parámetros de alertas editables
- Cache optimizado para configuración

### v2.1 (Diciembre 2024)
- Migración de base de datos: Sucursal → sucursal_id
- Corrección de tipos de datos (DECIMAL, VARCHAR)
- Mejoras de integridad referencial (FKs)
- Normalización de estructura de BD

### v2.0 (Diciembre 2024)
- Sistema de valores históricos (timelapse)
- Versionado de presupuestos
- Notificaciones en tiempo real (SSE)
- Auditoría automatizada
