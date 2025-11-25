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

---

## Soporte Técnico

Para asistencia adicional, contactar al equipo de desarrollo o administrador del sistema.

**Última actualización:** Enero 2025
