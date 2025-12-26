# Manual de Usuario - Sistema Presupuestador Web

## 📖 Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Dashboard Usuario](#dashboard-usuario)
4. [Crear Presupuesto](#crear-presupuesto)
5. [Gestión de Insumos](#gestión-de-insumos)
6. [Gestión de Prestaciones](#gestión-de-prestaciones)
7. [Gestión de Equipamientos](#gestión-de-equipamientos)
8. [Finalizar Presupuesto](#finalizar-presupuesto)
9. [Historial](#historial)
10. [Notificaciones](#notificaciones)
11. [Dashboard Gerencias](#dashboard-gerencias)
12. [Dashboard Administrador](#dashboard-administrador)
13. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

El Sistema Presupuestador Web permite gestionar presupuestos médicos de forma integral, con control de versiones, auditoría multi-gerencial automatizada y notificaciones en tiempo real.

### Roles del Sistema

- **Usuario Normal**: Crea y gestiona presupuestos
- **Gerencia Administrativa**: Primera línea de auditoría
- **Gerencia Prestacional**: Segunda línea de auditoría técnica
- **Gerencia General**: Última línea de auditoría y decisión final
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
- Equipamientos
- Costo Total
- Total a Facturar
- Rentabilidad (con y sin plazo)

**Pestañas:**
- Datos Paciente
- Insumos
- Prestaciones
- Equipamiento
- Historial
- Notificaciones

**Alertas Inteligentes:**
- Se muestran automáticamente si el presupuesto cumple reglas de auditoría
- Alertas de valores desactualizados (>45 días sin actualizar)
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

### Paso 2: Seleccionar Financiador

1. Ir a pestaña **"Prestaciones"**
2. Seleccionar **financiador** del dropdown
3. El sistema guarda automáticamente el financiador

**⚠️ Importante:** Si cambias el financiador después de agregar prestaciones, todas las prestaciones seleccionadas se eliminarán automáticamente.

### Paso 3: Agregar Items

- Ver sección [Gestión de Insumos](#gestión-de-insumos)
- Ver sección [Gestión de Prestaciones](#gestión-de-prestaciones)
- Ver sección [Gestión de Equipamientos](#gestión-de-equipamientos)

### Paso 4: Finalizar

Ver sección [Finalizar Presupuesto](#finalizar-presupuesto)

---

## Gestión de Insumos

### Agregar Insumo

1. Ir a pestaña **"Insumos"**
2. Buscar insumo en la tabla izquierda (por nombre o código de producto)
3. Hacer clic en el **checkbox** del insumo deseado
4. Ingresar **cantidad** en el panel derecho
5. Hacer clic en **"Agregar"**

### Alertas de Valores Desactualizados

Al seleccionar un insumo con más de 45 días sin actualizar, aparecerá una alerta persistente en la parte superior indicando:
- Nombre del insumo
- Días sin actualizar
- Botón X para cerrar

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

- **Código**: Código de producto (EAN/SKU) si existe
- **Costo Unit.**: Costo base del insumo
- **Precio a Facturar**: Costo + margen de sucursal
- **Subtotal Costo**: Costo unitario × cantidad
- **Subtotal Facturar**: Precio facturar × cantidad

---

## Gestión de Prestaciones

### Agregar Prestación

1. Buscar prestación en la tabla izquierda
2. Hacer clic en el **checkbox** de la prestación
3. En el panel derecho:
   - **Cantidad**: Ajustar si es necesario
   - **Valor**: Seleccionar del dropdown (80%, 90%, 100%, 110%, 120%, 150%)
4. Hacer clic en **"Agregar"**

### Alertas de Valores Desactualizados

Similar a insumos, se muestran alertas para prestaciones con >45 días sin actualizar.

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

## Gestión de Equipamientos

### Agregar Equipamiento

1. Ir a pestaña **"Equipamiento"**
2. Buscar equipamiento en la tabla izquierda
3. Hacer clic en el **checkbox** del equipamiento deseado
4. Ingresar **cantidad** en el panel derecho
5. Hacer clic en **"Agregar"**

### Tipos de Equipamiento

- **Oxigenoterapia**: Tubos de oxígeno, concentradores
- **Mobiliario**: Camas, colchones
- **Monitoreo**: Monitores, oxímetros
- **Ventilación**: Nebulizadores, ventiladores
- **Otro**: Otros equipos médicos

### Valores de Equipamiento

- **Con acuerdo**: Usa valor negociado con el financiador
- **Sin acuerdo**: Usa precio_referencia (valor general)
- Todos los equipamientos activos están disponibles para todos los financiadores

### Alertas por Tipo

Algunos tipos de equipamiento generan alertas automáticas al superar umbrales configurados:
- Ejemplo: "5+ tubos de oxígeno → Alto consumo - Paciente complejo"

### Modificar/Eliminar

Similar a insumos y prestaciones, usar íconos de lápiz y papelera.

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
3. **Rentabilidad con Plazo > 25%** → Posible sobreprecio
4. **Utilidad > $50,000** → Alta utilidad

**Nota:** Todos los umbrales son configurables por el administrador.

**Si cumple alguna regla:**
- Estado: **Pendiente**
- Se notifica a gerencias
- Esperar aprobación/rechazo
- Asignación FCFS (primer gerente disponible)

**Si NO cumple ninguna regla:**
- Estado: **Aprobado**
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
- Muestra valores históricos de la fecha del presupuesto

**Lápiz (Editar):**
- Si es **borrador**: Edita directamente
- Si está **finalizado/aprobado**: Muestra modal de confirmación
- Crea nueva versión si es necesario
- Actualiza valores a precios actuales

### Modo Solo Lectura

Cuando se visualiza un presupuesto:
- Banner azul en todas las pestañas
- Campos deshabilitados
- Sin botones de edición/eliminación
- Solo visualización de datos
- Valores de época (precios vigentes en esa fecha)

---

## Notificaciones

### Tipos de Notificaciones

1. **Aprobado** (verde): Presupuesto aprobado por gerencia
2. **Rechazado** (rojo): Presupuesto rechazado
3. **Observado** (amarillo): Requiere correcciones
4. **En Revisión** (azul): Gerencia está revisando
5. **Pendiente** (naranja): Requiere auditoría

### Ver Notificaciones

1. Ir a pestaña **"Notificaciones"**
2. Ver lista de notificaciones recientes
3. Hacer clic en **"Ver Detalle"** para más información

### Indicador de Notificaciones

- Número en badge rojo en la pestaña
- Se actualiza en tiempo real (SSE)
- Desaparece al marcar como leída

---

## Dashboard Gerencias

### Acceso

Usuarios con roles:
- **gerencia_administrativa**
- **gerencia_prestacional**
- **gerencia_general**

### Sistema Multi-Gerencial

**Flujo de Auditoría:**

1. **Gerencia Administrativa** (Primera línea)
   - Aprobar directamente
   - Rechazar con motivo
   - Derivar a Gerencia Prestacional
   - Aprobación condicional (casos estratégicos)

2. **Gerencia Prestacional** (Segunda línea)
   - Aprobar directamente
   - Rechazar con motivo
   - Observar (devolver a usuario para correcciones)
   - Escalar a Gerencia General
   - Aprobación condicional

3. **Gerencia General** (Última línea)
   - Aprobar directamente
   - Rechazar con motivo
   - Devolver a otras gerencias
   - Aprobación condicional
   - Decisión final

### Asignación FCFS

- **First Come First Served**: Primer gerente disponible toma el caso
- Al hacer clic en "Tomar Caso", el presupuesto se asigna
- Otros gerentes no pueden ver casos asignados
- Auto-liberación: Casos inactivos >30 min vuelven a disponibles

### Pestañas

1. **Presupuestos Pendientes**: Lista de casos para revisar
2. **Mis Casos**: Casos asignados a mí
3. **Historial**: Todos los presupuestos (solo lectura)
4. **Notificaciones**: Alertas del sistema

### Revisar Presupuesto

1. En **"Presupuestos Pendientes"**
2. Hacer clic en **"Tomar Caso"**
3. Revisar detalle completo
4. Elegir acción según rol

### Modal de Auditoría

**Información Mostrada:**
- Paciente y DNI
- Versión del presupuesto
- Costo Total
- Rentabilidad
- Historial de auditoría humanizado

**Acciones Disponibles:**
- **Aprobar**: Finaliza el proceso
- **Rechazar**: Requiere motivo
- **Derivar/Escalar**: Envía a otra gerencia
- **Observar**: Devuelve a usuario (solo G. Prestacional)
- **Aprobación Condicional**: Para casos políticos/estratégicos

### Historial de Auditoría

Muestra en lenguaje natural:
- "Hace 2 horas, Juan Pérez (G. Administrativa) derivó a G. Prestacional"
- "Hace 1 día, María García (G. Prestacional) observó: Revisar cantidad de insumos"
- Fechas relativas (hace X minutos/horas/días)

---

## Dashboard Administrador

### Acceso

Solo usuarios con rol **"admin"** tienen acceso completo.

### Pestañas Disponibles

1. **Insumos**: Administración de catálogo de insumos
2. **Financiadores**: Gestión de financiadores/obras sociales
3. **Servicios**: Administración de servicios médicos
4. **Equipamientos**: Gestión de equipamientos base
5. **Sucursales**: Administración de sucursales
6. **Serv/ Financiador**: Gestión de valores históricos de servicios
7. **Equip/ Financiador**: Gestión de valores históricos de equipamientos
8. **Alertas/ Tipo**: Configuración de alertas por tipo
9. **Reglas de Negocio**: Configuración de umbrales de auditoría

### Gestión de Usuarios

**Crear Usuario:**
1. Hacer clic en ícono de **usuario +** en barra superior
2. Completar formulario:
   - Username
   - Password
   - Rol (user, gerencia_administrativa, gerencia_prestacional, gerencia_general, admin)
   - Sucursal asignada
3. Hacer clic en **"Crear"**

**Editar/Eliminar:**
- Usar íconos de lápiz y papelera en cada fila

### Gestión de Insumos

**Agregar Insumo:**
1. Hacer clic en **"Nuevo Insumo"**
2. Completar:
   - Nombre del producto
   - Código de producto (EAN/SKU) - opcional
   - Costo base
   - Categoría
3. Guardar

**Filtrado:**
- Por nombre O código de producto
- Búsqueda en tiempo real

### Gestión de Equipamientos Base

**Agregar Equipamiento:**
1. Hacer clic en **"Nuevo Equipamiento"**
2. Completar:
   - Nombre
   - Tipo (oxigenoterapia, mobiliario, monitoreo, ventilacion, otro)
   - Precio referencia (valor general)
   - Estado activo/inactivo
3. Guardar

**Gestionar Tipos:**
- Modal para ver y agregar tipos de equipamiento
- Tipos predefinidos del sistema

### Servicios por Financiador (Valores Históricos)

**Seleccionar Financiador:**
1. Ir a pestaña **"Serv/ Financiador"**
2. Seleccionar financiador del dropdown
3. Ver lista de todos los servicios disponibles

**Editar Valores del Servicio:**

1. Hacer clic en ícono de **lápiz**
2. Modal con tres secciones:

**Sección 1: Estado del Servicio**
- Switch para activar/desactivar
- Solo servicios activos aparecen al crear presupuestos

**Sección 2: Agregar Valores con Fecha de Vigencia**
- **Valor Asignado**: Nuevo costo base
- **Valor a Facturar**: Nuevo precio al financiador
- **Fecha Inicio**: Fecha desde la cual aplica
- **Sucursal**: "Todas" o específica
- Botón **"+"**: Agregar más valores futuros
- Botón **"-"**: Eliminar fila
- Formato monetario argentino ($ 1.234,56)

**Sección 3: Histórico de Valores**
- Tabla con todos los períodos de vigencia
- Columnas: Sucursal, Fecha Inicio, Fecha Fin, Valor Asignado, Valor Facturar, Estado
- Badge verde = Vigente, gris = Histórico

**Sistema Anti-Obsolescencia:**
Al guardar un valor general (Todas las sucursales), el sistema cierra automáticamente valores específicos con >30 días de antigüedad.

### Equipamientos por Financiador

Similar a Servicios por Financiador:
- Acuerdos específicos con valores históricos
- Valores diferenciados por sucursal
- Si no hay acuerdo, usa precio_referencia

### Alertas por Tipo

**Dos Secciones:**

1. **Alertas por Tipo de Unidad (Servicios)**
   - Configurar cantidad_maxima, mensaje, color, estado
   - Ejemplo: "Sesiones > 30 → Tratamiento prolongado"

2. **Alertas por Tipo de Equipamiento**
   - Configurar cantidad_maxima, mensaje, color, estado
   - Ejemplo: "Tubos O2 > 5 → Alto consumo - Paciente complejo"

**Editar Alerta:**
1. Hacer clic en ícono de **lápiz**
2. Modificar parámetros
3. Guardar cambios

### Reglas de Negocio

**Configurar Umbrales:**
- Rentabilidad mínima (%)
- Costo total máximo ($)
- Rentabilidad con plazo máxima (%)
- Utilidad máxima ($)

Todos los valores son editables y se aplican inmediatamente.

---

## Preguntas Frecuentes

### ¿Puedo editar un presupuesto finalizado?

Sí, pero se creará una **nueva versión**. El sistema muestra un modal de confirmación explicando esto. Los valores se actualizan a precios actuales.

### ¿Qué pasa si el presupuesto está en $0?

El sistema recalcula automáticamente los totales desde los insumos, prestaciones y equipamientos guardados.

### ¿Cómo sé si mi presupuesto fue a auditoría?

Recibirás una notificación y el estado será **"Pendiente"**. También verás alertas en el panel superior.

### ¿Qué es la rentabilidad con plazo?

Es la rentabilidad ajustada considerando el tiempo de cobranza y la tasa de interés del financiador. Refleja el valor real del dinero en el tiempo.

### ¿Puedo ver versiones anteriores de un presupuesto?

Sí, desde el historial puedes ver todas las versiones. Cada versión tiene su propio ID y número de versión.

### ¿Qué significa el indicador de conexión?

- **Verde**: Conectado al servidor, notificaciones en tiempo real activas
- **Rojo**: Desconectado, intentando reconectar

### ¿Puedo modificar el financiador después de agregarlo?

Sí, el selector de financiador siempre está disponible mientras el presupuesto sea un borrador. Al cambiar el financiador, el sistema eliminará automáticamente todas las prestaciones agregadas.

### ¿Cómo funcionan los valores históricos?

El sistema mantiene un registro de todos los cambios de precios por fecha y sucursal. Cuando creas un presupuesto, usa los valores vigentes HOY. Cuando ves un presupuesto antiguo, muestra los valores que estaban vigentes en esa fecha.

### ¿Puedo programar aumentos de precios futuros?

Sí, desde "Serv/ Financiador" o "Equip/ Financiador" puedes agregar valores con fecha de inicio futura. El sistema los aplicará automáticamente cuando llegue esa fecha.

### ¿Qué pasa con los equipamientos sin acuerdo?

Todos los equipamientos activos están disponibles para todos los financiadores. Si no hay acuerdo específico, el sistema usa el precio_referencia (valor general) del catálogo.

### ¿Qué son las alertas de valores desactualizados?

Al seleccionar insumos, prestaciones o equipamientos con más de 45 días sin actualizar, aparece una alerta persistente indicando el nombre del item y los días sin actualizar. Esto ayuda a mantener los precios actualizados.

### ¿Cómo funciona la asignación FCFS?

First Come First Served: El primer gerente que hace clic en "Tomar Caso" se lo asigna. Otros gerentes no pueden ver ese caso. Si el gerente no actúa en 30 minutos, el caso se libera automáticamente.

### ¿Qué es la aprobación condicional?

Es una aprobación especial para casos políticos o estratégicos que requieren consideraciones especiales. Solo disponible para gerencias.

---

## Soporte Técnico

Para asistencia adicional, contactar al equipo de desarrollo o administrador del sistema.

**Última actualización:** Enero 2025  
**Versión:** 3.1  
**Incluye:** Sistema Multi-Gerencial v3.0 + Equipamientos + Alertas por Tipo + Código de Producto
