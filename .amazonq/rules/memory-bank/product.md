# Product Overview - Sistema Presupuestador Web

## Purpose
Sistema integral de gestión de presupuestos médicos con auditoría automatizada, versionado, valores históricos y notificaciones en tiempo real para instituciones de salud.

## Value Proposition
- **Automatización de Auditoría**: 4 reglas automáticas que evalúan rentabilidad, costos y utilidades para determinar si un presupuesto requiere revisión gerencial
- **Trazabilidad Completa**: Sistema de versionado que mantiene historial completo de cambios con valores de época
- **Gestión de Precios Inteligente**: Sistema de valores históricos (timelapse) con vigencias por período y sucursal, incluyendo anti-obsolescencia automática
- **Flujo Multi-Gerencial**: 4 gerencias especializadas con asignación FCFS y auto-liberación de casos inactivos
- **Notificaciones en Tiempo Real**: SSE (Server-Sent Events) para actualizaciones instantáneas de estados y alertas

## Key Features

### 1. Cotizador Inteligente
- Gestión completa de insumos médicos con código de producto (EAN/SKU)
- Prestaciones médicas con valores históricos por financiador y sucursal
- Equipamientos médicos con acuerdos específicos y precios de referencia
- Cálculo automático de rentabilidad, utilidad y totales
- Alertas de valores desactualizados (>45 días sin actualizar)

### 2. Sistema de Versiones
- Control de cambios con historial completo
- Solo la última versión está activa (es_ultima_version = 1)
- Editar presupuesto finalizado crea nueva versión automáticamente
- Mantiene valor_asignado original (costo negociado)
- Actualiza valor_facturar con precios actuales en nuevas versiones

### 3. Valores Históricos (Timelapse)
- Gestión de precios por períodos de vigencia
- Valores diferenciados por sucursal (general o específico)
- Cierre automático de períodos al agregar nuevos valores
- Consulta de valores vigentes por fecha y sucursal
- Sistema anti-obsolescencia: valores específicos >30 días pierden prioridad
- Prioridad: Valor específico reciente > Valor general > Valor específico obsoleto

### 4. Auditoría Automatizada
Presupuestos van a auditoría si cumplen AL MENOS UNA condición:
- **Rentabilidad < 15%**: Rentabilidad muy baja
- **Costo Total > $150,000**: Monto alto
- **Rentabilidad con Plazo > 25%**: Posible sobreprecio
- **Utilidad > $50,000**: Alta utilidad
(Todos los umbrales configurables por super admin)

### 5. Sistema Multi-Gerencial (v3.0)
- **Gerencia Administrativa**: Primera línea, puede aprobar o derivar
- **Gerencia Prestacional**: Revisión técnica, puede aprobar, observar o escalar
- **Gerencia General**: Decisión final en casos complejos
- **Gerencia Financiera**: Dashboard solo lectura sin capacidad de auditar
- Asignación FCFS (First Come First Served) con FOR UPDATE
- Auto-liberación de casos inactivos >30 minutos
- Aprobación condicional para casos políticos/estratégicos
- 10 estados de presupuestos (borrador → pendiente → en_revisión → final)
- 15 métodos de transición con notificaciones automáticas

### 6. Notificaciones en Tiempo Real
- SSE (Server-Sent Events) para actualizaciones instantáneas
- Notificaciones de auditoría (aprobación/rechazo/derivación/escalamiento)
- Alertas de presupuestos pendientes para gerencias
- Indicador visual de conexión en todos los dashboards
- Sistema de auto-reconexión automática
- Notificaciones persistentes en tab "Notificaciones"

### 7. Modo Solo Lectura
- Visualización segura de presupuestos históricos
- Muestra valores de época (guardados en BD)
- No permite edición de presupuestos finalizados
- Botón "Editar" crea nueva versión con valores actuales

### 8. Alertas Inteligentes
- Alertas de valores desactualizados (>45 días)
- Alertas configurables por tipo de unidad (servicios)
- Alertas configurables por tipo de equipamiento
- Parámetros: cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta
- Gestión centralizada desde Panel Admin > Alertas/ Tipo

### 9. Generación de PDF
- Exportación de presupuestos en cualquier estado
- Funciona en borrador, aprobado, rechazado, en auditoría
- Incluye insumos, prestaciones y equipamientos
- Hook reutilizable usePdfGenerator para múltiples dashboards

### 10. Manejo de Sesión
- Detección automática de sesión expirada (401)
- Patrón Observer para detección global de errores
- Logout automático con notificación roja
- Tokens JWT expiran en 1 hora

## Target Users

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

## Use Cases

### 1. Crear Presupuesto Nuevo
Usuario ingresa datos del paciente, selecciona financiador, agrega insumos/prestaciones/equipamientos con valores vigentes actuales, sistema calcula totales y evalúa reglas automáticas.

### 2. Auditoría Multi-Gerencial
Presupuesto que cumple reglas va a auditoría → G. Administrativa revisa → puede aprobar o derivar a G. Prestacional → G. Prestacional puede aprobar, observar o escalar a G. General → G. General toma decisión final.

### 3. Editar Presupuesto Histórico
Usuario abre presupuesto finalizado en modo solo lectura → presiona "Editar" → sistema crea nueva versión → mantiene valor_asignado original → actualiza valor_facturar con precios actuales.

### 4. Gestionar Valores Históricos
Admin abre modal de valores históricos → selecciona sucursal ("Todas" o específica) → agrega nuevos valores con fecha de inicio → sistema cierra automáticamente período anterior → valores específicos obsoletos (>30 días) pierden prioridad.

### 5. Configurar Alertas por Tipo
Super admin accede a Panel Admin > Alertas/ Tipo → configura cantidad_maxima, mensaje_alerta, color_alerta para tipos de unidad o equipamiento → alertas se disparan automáticamente al seleccionar items.

### 6. Monitorear Casos en Tiempo Real
Gerente abre dashboard → indicador verde muestra conexión SSE activa → recibe notificación instantánea de nuevo caso pendiente → toma caso con asignación FCFS → sistema bloquea caso para otros gerentes.

### 7. Aprobar Condicional
Gerente revisa caso estratégico (cliente VIP) → selecciona "Aprobar Condicional" → ingresa justificación → presupuesto se aprueba sin pasar por otras gerencias → queda registrado en historial de auditoría.

### 8. Generar PDF
Usuario abre presupuesto en cualquier estado → presiona botón "Imprimir PDF" → sistema genera PDF con todos los datos (paciente, insumos, prestaciones, equipamientos, totales) → descarga automáticamente.

## Business Rules

### Reglas de Auditoría (Configurables)
- Rentabilidad mínima: 15% (default)
- Costo total máximo: $150,000 (default)
- Rentabilidad con plazo máxima: 25% (default)
- Utilidad máxima: $50,000 (default)

### Sistema de Valores
- Valores específicos tienen prioridad sobre generales (si ≤30 días diferencia)
- Valores específicos obsoletos (>30 días) pierden prioridad
- Al guardar valor general, cierra automáticamente específicos obsoletos
- Sucursales sin valor no ven el servicio

### Flujo de Estados
- borrador → pendiente_auditoria → en_revision_administrativa → aprobado_administrativo/rechazado_administrativo
- aprobado_administrativo → en_revision_prestacional → aprobado_prestacional/rechazado_prestacional/observado
- aprobado_prestacional → en_revision_general → aprobado/rechazado
- observado → borrador (usuario corrige)

### Auto-liberación
- Casos en revisión >30 minutos sin actividad vuelven a pendientes
- Permite que otros gerentes tomen casos abandonados
- Evita bloqueos indefinidos

## Technical Highlights
- **Backend**: Node.js + Express + TypeScript + MySQL
- **Frontend**: React + TypeScript + Vite + Mantine UI
- **Real-time**: SSE (Server-Sent Events)
- **Security**: JWT tokens, bcrypt, helmet, rate limiting
- **Database**: MySQL 8.0+ con índices optimizados
- **Logging**: Winston con rotación diaria
- **API**: RESTful + Swagger documentation
