# Manual de Usuario - Sistema Presupuestador Web

## 📖 Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Dashboard Usuario](#dashboard-usuario)
4. [Crear Presupuesto](#crear-presupuesto)
5. [Gestión de Insumos](#gestión-de-insumos)
6. [Gestión de Prestaciones](#gestión-de-prestaciones)
7. [Finalizar Presupuesto](#finalizar-presupuesto)
8. [Historial](#historial)
9. [Notificaciones](#notificaciones)
10. [Dashboard Auditor](#dashboard-auditor)
11. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Sistema Presupuestador Web permite gestionar presupuestos médicos de forma integral, con control de versiones, auditoría automatizada y notificaciones en tiempo real.

### Roles del Sistema

- **Usuario Normal**: Crea y gestiona presupuestos
- **Auditor Médico**: Revisa y aprueba/rechaza presupuestos
- **Administrador**: Gestión completa del sistema

---

## Acceso al Sistema

1. Abrir navegador web
2. Ingresar URL del sistema
3. Introducir **usuario** y **contraseña**
4. Hacer clic en **Iniciar Sesión**

---

## Dashboard Usuario

### Elementos Principales

**Barra Superior:**
- Nombre de usuario
- Indicador de conexión (verde = conectado)
- Botón "Salir"

**Panel de Totales:**
- Insumos
- Prestaciones
- Costo Total
- Total a Facturar
- Rentabilidad (con y sin plazo)

**Pestañas:**
- Datos Paciente
- Insumos
- Prestaciones
- Historial
- Notificaciones

**Alertas Inteligentes:**
- Se muestran automáticamente si el presupuesto cumple reglas de auditoría
- Colores: Rojo (crítico), Naranja (advertencia), Azul (información)

---

## Crear Presupuesto

### Paso 1: Datos del Paciente

1. Ir a pestaña **"Datos Paciente"**
2. Completar campos:
   - **Nombre y Apellido**: Nombre completo del paciente
   - **DNI**: 7-8 dígitos sin puntos
   - **Sucursal**: Seleccionar de la lista
   - **Difícil Acceso**: Marcar si aplica

3. Hacer clic en **"Crear Presupuesto"**

**Nota:** Si el DNI ya existe, el sistema preguntará si desea:
- Cargar presupuesto existente
- Crear nuevo presupuesto

### Paso 2: Agregar Insumos

Ver sección [Gestión de Insumos](#gestión-de-insumos)

### Paso 3: Agregar Prestaciones

Ver sección [Gestión de Prestaciones](#gestión-de-prestaciones)

### Paso 4: Finalizar

Ver sección [Finalizar Presupuesto](#finalizar-presupuesto)

---

## Gestión de Insumos

### Agregar Insumo

1. Ir a pestaña **"Insumos"**
2. Buscar insumo en la tabla izquierda
3. Hacer clic en el **checkbox** del insumo deseado
4. Ingresar **cantidad** en el panel derecho
5. Hacer clic en **"Agregar"**

### Modificar Cantidad

1. En la tabla de insumos seleccionados
2. Hacer clic en el ícono de **lápiz**
3. Modificar cantidad
4. Hacer clic en **"OK"**

### Eliminar Insumo

1. En la tabla de insumos seleccionados
2. Hacer clic en el ícono de **papelera** (rojo)
3. El insumo se elimina inmediatamente

### Información Mostrada

- **Costo Unit.**: Costo base del insumo
- **Precio a Facturar**: Costo + margen de sucursal
- **Subtotal Costo**: Costo unitario × cantidad
- **Subtotal Facturar**: Precio facturar × cantidad

---

## Gestión de Prestaciones

### Seleccionar Financiador

1. Ir a pestaña **"Prestaciones"**
2. Seleccionar **financiador** del dropdown
3. El sistema guarda automáticamente
4. Hacer clic en **"Confirmar"** para cargar prestaciones disponibles

**Información del Financiador:**
- Tasa Mensual
- Días Cobranza Teórico
- Días Cobranza Real
- Acuerdo Asignado

### Agregar Prestación

1. Buscar prestación en la tabla izquierda
2. Hacer clic en el **checkbox** de la prestación
3. En el panel derecho:
   - **Cantidad**: Ajustar si es necesario
   - **Valor**: Seleccionar del dropdown (80%, 90%, 100%, 110%, 120%, 150%)
4. Hacer clic en **"Agregar"**

### Modificar Prestación

1. En la tabla de prestaciones seleccionadas
2. Hacer clic en el ícono de **lápiz**
3. Modificar cantidad y/o valor
4. Hacer clic en **"OK"**

### Eliminar Prestación

1. En la tabla de prestaciones seleccionadas
2. Hacer clic en el ícono de **papelera** (rojo)

### Información Mostrada

- **Costo Unit.**: Valor asignado negociado
- **Precio a Facturar**: Valor unitario a facturar al financiador
- **Subtotal Costo**: Valor asignado × cantidad
- **Subtotal Facturar**: Precio facturar × cantidad

---

## Finalizar Presupuesto

### Proceso

1. Verificar que todos los datos sean correctos
2. Revisar totales en el panel superior
3. Hacer clic en **"Finalizar Presupuesto"**

### ¿Qué Sucede al Finalizar?

El sistema evalúa **4 reglas automáticas**:

1. **Rentabilidad < 15%** → Va a auditoría
2. **Costo Total > $150,000** → Va a auditoría
3. **Difícil Acceso = 'SI'** → Va a auditoría
4. **Rentabilidad con Plazo > 25%** → Va a auditoría

**Si cumple alguna regla:**
- Estado: **Pendiente**
- Se notifica a auditores médicos
- Esperar aprobación/rechazo

**Si NO cumple ninguna regla:**
- Estado: **Borrador**
- Listo para usar
- No requiere auditoría

### Después de Finalizar

- El presupuesto se guarda en el historial
- Se limpia el formulario
- Puede crear un nuevo presupuesto

---

## Historial

### Ver Historial

1. Ir a pestaña **"Historial"**
2. Ver lista de todos los presupuestos

### Filtros Disponibles

- **Nombre o DNI**: Buscar por paciente
- **Rentabilidad mínima**: Filtrar por %
- **Monto mínimo**: Filtrar por total a facturar

### Acciones Disponibles

**Ojo (Ver Presupuesto):**
- Carga el presupuesto en modo **solo lectura**
- No se pueden hacer modificaciones
- Banner azul indica modo visualización

**Lápiz (Editar):**
- Si es **borrador**: Edita directamente
- Si está **finalizado/aprobado**: Muestra modal de confirmación
- Crea nueva versión si es necesario

### Modo Solo Lectura

Cuando se visualiza un presupuesto:
- Banner azul en todas las pestañas
- Campos deshabilitados
- Sin botones de edición/eliminación
- Solo visualización de datos

---

## Notificaciones

### Tipos de Notificaciones

1. **Aprobado** (verde): Presupuesto aprobado por auditor
2. **Rechazado** (rojo): Presupuesto rechazado por auditor
3. **Pendiente** (amarillo): Presupuesto requiere auditoría

### Ver Notificaciones

1. Ir a pestaña **"Notificaciones"**
2. Ver lista de notificaciones recientes
3. Hacer clic en **"Ir a Auditoría"** para ver detalles

### Indicador de Notificaciones

- Número en badge rojo en la pestaña
- Se actualiza en tiempo real
- Desaparece al marcar como leída

---

## Dashboard Auditor

### Acceso

Solo usuarios con rol **"auditor_medico"** tienen acceso.

### Pestañas

1. **Presupuestos Pendientes**: Lista de presupuestos para revisar
2. **Historial**: Todos los presupuestos (solo lectura)
3. **Notificaciones**: Alertas del sistema

### Revisar Presupuesto

1. En **"Presupuestos Pendientes"**
2. Hacer clic en ícono de **ojo** para ver detalle
3. Hacer clic en ícono de **escudo** para auditar

### Modal de Auditoría

**Información Mostrada:**
- Paciente y DNI
- Versión del presupuesto
- Costo Total
- Rentabilidad

**Acciones:**
- **Aprobar**: Escribe "APROBADO: [comentario opcional]"
- **Rechazar**: Escribe "RECHAZADO: [motivo]"
- **En Revisión**: Escribe comentario sin prefijo

### Ver Detalle

Modal muestra:
- Información del paciente
- Totales del presupuesto
- Lista de prestaciones
- Lista de insumos
- Estado y versión

### Historial (Auditor)

- Solo botón de **ojo** (ver detalle)
- Sin opciones de edición
- Acceso a todos los presupuestos del sistema

---

## Dashboard Administrador

### Acceso

Solo usuarios con rol **"admin"** tienen acceso completo.

### Pestañas Disponibles

1. **Usuarios**: Gestión de usuarios del sistema
2. **Insumos**: Administración de catálogo de insumos
3. **Prestadores**: Gestión de financiadores/obras sociales
4. **Servicios**: Administración de servicios médicos
5. **Servicios por Prestador**: Gestión de valores históricos
6. **Sucursales**: Administración de sucursales
7. **Historial**: Todos los presupuestos del sistema
8. **Notificaciones**: Alertas del sistema

### Gestión de Usuarios

**Crear Usuario:**
1. Hacer clic en **"Nuevo Usuario"**
2. Completar formulario:
   - Username
   - Password
   - Rol (user, auditor_medico, admin)
   - Sucursal asignada
3. Hacer clic en **"Crear"**

**Editar Usuario:**
1. Hacer clic en ícono de **lápiz**
2. Modificar datos
3. Guardar cambios

**Eliminar Usuario:**
1. Hacer clic en ícono de **papelera**
2. Confirmar eliminación

### Gestión de Insumos

**Agregar Insumo:**
1. Hacer clic en **"Nuevo Insumo"**
2. Completar:
   - Nombre del producto
   - Costo base
   - Categoría
3. Guardar

**Editar/Eliminar:**
- Usar íconos de lápiz y papelera en cada fila

### Gestión de Prestadores

**Agregar Financiador:**
1. Hacer clic en **"Nuevo Prestador"**
2. Completar:
   - Nombre del financiador
   - Tasa mensual (%)
   - Días cobranza teórico
   - Días cobranza real
   - Acuerdo asignado
3. Guardar

**Información Importante:**
- La tasa mensual se usa para calcular rentabilidad con plazo
- Los días de cobranza afectan el cálculo de valor presente

### Gestión de Servicios

**Agregar Servicio:**
1. Hacer clic en **"Nuevo Servicio"**
2. Completar:
   - Nombre del servicio
   - Tipo de unidad (horas, sesiones, días, etc.)
   - Máximo de unidades sugerido
3. Guardar

**Tipos de Unidad:**
- horas
- sesiones
- días
- unidades
- visitas

### Servicios por Prestador (Valores Históricos)

**¿Qué es?**

Permite gestionar precios de servicios por períodos de vigencia, manteniendo un historial completo de cambios de precios.

**Seleccionar Financiador:**
1. Ir a pestaña **"Servicios por Prestador"**
2. Seleccionar financiador del dropdown
3. Ver lista de todos los servicios disponibles

**Activar/Desactivar Servicio:**
1. Usar el **switch** en la columna "Estado"
2. Verde = Activo, Gris = Inactivo
3. Solo servicios activos aparecen al crear presupuestos

**Editar Valores del Servicio:**

1. Hacer clic en ícono de **lápiz** en la columna "Acciones"
2. Se abre modal con dos secciones:

**Sección 1: Edición Rápida (Valores Actuales)**
- **Valor Sugerido**: Costo base del servicio ($ formato argentino)
- **Valor a Facturar**: Precio al financiador ($ formato argentino)
- **Cantidad Sugerida**: Cantidad inicial recomendada
- Botón **"Guardar Cambios"**: Actualiza valores actuales en `prestador_servicio`

**Sección 2: Agregar Valores con Fecha de Vigencia**
- **Valor Sugerido**: Nuevo costo base
- **Valor a Facturar**: Nuevo precio al financiador
- **Fecha Inicio**: Fecha desde la cual aplica el nuevo valor
- Botón **"+"**: Agregar más valores futuros
- Botón **"-"**: Eliminar fila
- Botón **"Guardar Valor(es)"**: Guarda en `prestador_servicio_valores`

**Sección 3: Histórico de Valores**
- Tabla con todos los períodos de vigencia
- Columnas:
  - Fecha Inicio
  - Fecha Fin ("Vigente" si es NULL)
  - Valor Sugerido
  - Valor Facturar
  - Estado (Badge verde = Vigente, gris = Histórico)
- Botón **"Ver/Actualizar Histórico"**: Recarga la tabla

**Formato Monetario:**
- Todos los valores usan formato argentino: **$ 1.234,56**
- Separador de miles: punto (.)
- Separador de decimales: coma (,)
- Siempre 2 decimales

**Comportamiento del Sistema:**

1. **Al agregar nuevo valor con fecha futura:**
   - El sistema cierra automáticamente el período vigente
   - `fecha_fin` del período anterior = `fecha_inicio` del nuevo - 1 día
   - Solo puede haber UN período vigente (fecha_fin = NULL) por servicio

2. **Al crear presupuesto:**
   - Usa valores vigentes HOY
   - `valor_asignado` = Usuario elige
   - `valor_facturar` = Valor vigente de la tabla histórica

3. **Al ver presupuesto histórico:**
   - Muestra valores guardados en BD
   - Lista de prestaciones disponibles usa valores de la fecha del presupuesto

4. **Al editar presupuesto (nueva versión):**
   - Mantiene `valor_asignado` original
   - Actualiza `valor_facturar` con valores vigentes HOY

**Ejemplo de Uso:**

```
Servicio: "Enfermería Domiciliaria"
Financiador: "OSDE"

Histórico:
- 01/01/2024 → 31/05/2024: $3.000 / $5.000 (Histórico)
- 01/06/2024 → 30/11/2024: $3.500 / $5.500 (Histórico)
- 01/12/2024 → Vigente: $4.000 / $6.000 (Vigente)

Agregar valor futuro:
- Fecha Inicio: 01/03/2025
- Valor Sugerido: $4.500
- Valor Facturar: $6.500

Resultado:
- 01/12/2024 → 28/02/2025: $4.000 / $6.000 (Histórico)
- 01/03/2025 → Vigente: $4.500 / $6.500 (Vigente)
```

**Ventajas del Sistema:**
- ✅ Historial completo de cambios de precios
- ✅ Presupuestos históricos muestran valores correctos de su época
- ✅ Planificación de aumentos futuros
- ✅ Trazabilidad total de precios
- ✅ Cierre automático de períodos

### Gestión de Sucursales

**Agregar Sucursal:**
1. Hacer clic en **"Nueva Sucursal"**
2. Completar:
   - Nombre de la sucursal
   - Porcentaje de margen para insumos
3. Guardar

**Porcentaje de Insumos:**
- Se aplica automáticamente al calcular precio de facturación
- Ejemplo: Costo $100 + 20% = Precio Facturar $120

---

## Preguntas Frecuentes

### ¿Puedo editar un presupuesto finalizado?

Sí, pero se creará una **nueva versión**. El sistema muestra un modal de confirmación explicando esto.

### ¿Qué pasa si el presupuesto está en $0?

El sistema recalcula automáticamente los totales desde los insumos y prestaciones guardados.

### ¿Cómo sé si mi presupuesto fue a auditoría?

Recibirás una notificación y el estado será **"Pendiente"**. También verás alertas en el panel superior.

### ¿Puedo solicitar auditoría manualmente?

Sí, hay un botón **"Pedir Auditoría"** en el dashboard que permite enviar cualquier presupuesto a revisión.

### ¿Qué es la rentabilidad con plazo?

Es la rentabilidad ajustada considerando el tiempo de cobranza y la tasa de interés del financiador. Refleja el valor real del dinero en el tiempo.

### ¿Puedo ver versiones anteriores de un presupuesto?

Sí, desde el historial puedes ver todas las versiones. Cada versión tiene su propio ID y número de versión.

### ¿Qué significa el indicador de conexión?

- **Verde**: Conectado al servidor, notificaciones en tiempo real activas
- **Rojo**: Desconectado, intentando reconectar

### ¿Cómo descargo un presupuesto en PDF?

Hay un botón **"Descargar PDF"** en el dashboard que genera un PDF con todos los detalles del presupuesto.

### ¿Puedo modificar el financiador después de agregarlo?

Sí, hay un botón **"Modificar"** que desbloquea el selector de financiador. Ten en cuenta que esto eliminará las prestaciones agregadas.

### ¿Qué pasa si cierro el navegador sin finalizar?

Los datos se guardan automáticamente en la base de datos. Puedes continuar desde donde lo dejaste cargando el presupuesto desde el historial.

### ¿Cómo funcionan los valores históricos?

El sistema mantiene un registro de todos los cambios de precios por fecha. Cuando creas un presupuesto, usa los valores vigentes HOY. Cuando ves un presupuesto antiguo, muestra los valores que estaban vigentes en esa fecha.

### ¿Puedo programar aumentos de precios futuros?

Sí, desde "Servicios por Prestador" puedes agregar valores con fecha de inicio futura. El sistema los aplicará automáticamente cuando llegue esa fecha.

### ¿Qué pasa si activo un servicio que no tiene valores históricos?

El sistema crea automáticamente un registro inicial con los valores actuales y fecha de hoy.

### ¿Puedo tener múltiples valores vigentes para el mismo servicio?

No, el sistema garantiza que solo haya UN período vigente (fecha_fin = NULL) por servicio. Al agregar un nuevo valor, cierra automáticamente el anterior.

---

## Soporte Técnico

Para asistencia adicional, contactar al equipo de desarrollo o administrador del sistema.

**Última actualización:** Enero 2025  
**Versión:** 2.0  
**Incluye:** Sistema de Valores Históricos (Timelapse)
