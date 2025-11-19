# Manual de Usuario - Sistema Presupuestador

## Índice
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Módulo Usuario - Cotizador](#módulo-usuario---cotizador)
4. [Módulo Administrador](#módulo-administrador)
5. [Conceptos Clave](#conceptos-clave)

---

## Introducción

Sistema de presupuestación para servicios de salud que permite:
- Crear presupuestos con insumos y prestaciones
- Calcular costos y precios de facturación
- Gestionar financiadores, servicios, insumos y sucursales
- Analizar rentabilidad considerando plazos de cobranza

---

## Acceso al Sistema

**URL:** `http://localhost:5173` (o la URL proporcionada)

**Credenciales:**
- Usuario estándar: `usuario` / contraseña asignada
- Administrador: `admin` / contraseña asignada

---

## Módulo Usuario - Cotizador

### 1. Datos del Paciente

**Crear nuevo presupuesto:**
1. Completar: Nombre y Apellido, DNI, Sucursal
2. Marcar "Difícil Acceso" si corresponde
3. Clic en "Guardar y Continuar"

**Si el DNI ya existe:**
- Opción 1: "Cargar Existente" → Edita el presupuesto anterior
- Opción 2: "Crear Nuevo para este DNI" → Crea versión nueva

### 2. Insumos

**Agregar insumos:**
1. Buscar en "Insumos Disponibles"
2. Seleccionar con checkbox
3. Ingresar cantidad
4. Clic en "Agregar"

**Tabla Insumos Seleccionados:**
- **Costo Unit.**: Costo base del insumo
- **Precio a Facturar**: Costo + margen de sucursal (logística + ganancia)
- **Subtotal Costo**: Costo × cantidad
- **Subtotal Facturar**: Precio a facturar × cantidad

**Editar/Eliminar:**
- Ícono lápiz: Modificar cantidad
- Ícono basura: Eliminar insumo

### 3. Prestaciones

**Seleccionar financiador:**
1. Elegir financiador del dropdown
2. Clic en "Confirmar"
3. Se muestran prestaciones disponibles y datos del financiador (tasa mensual, días de cobranza)

**Agregar prestaciones:**
1. Seleccionar prestación con checkbox
2. Ajustar cantidad (se precarga con cantidad sugerida)
3. Seleccionar valor asignado (se ofrecen opciones basadas en valor sugerido)
4. Clic en "Agregar"

**Tabla Prestaciones Seleccionadas:**
- **Costo Unit.**: Valor asignado negociado con prestador
- **Precio a Facturar**: Valor unitario a facturar al financiador
- **Subtotal Costo**: Valor asignado × cantidad
- **Subtotal Facturar**: Precio a facturar × cantidad

### 4. Panel de Totales (Superior)

**Muestra en tiempo real:**
- **Insumos**: Total costo de insumos
- **Prestaciones**: Total costo de prestaciones
- **Costo Total**: Suma de insumos + prestaciones
- **Total a Facturar**: (Insumos × margen sucursal) + (Prestaciones × valor_facturar)
- **Rentabilidad**: Porcentaje de ganancia básico
- **Con Plazo**: Rentabilidad ajustada por días de cobranza (si aplica)

**Alertas:**
- Se muestran cuando una prestación excede la cantidad total sugerida
- Indica tipo de unidad (horas, sesiones, consultas, días)

### 5. Historial

**Ver presupuestos anteriores:**
- Lista de todos los presupuestos guardados
- Filtrar por nombre, DNI o sucursal
- Clic en "Editar" para cargar un presupuesto existente

**Guardar presupuesto:**
- Botón "Guardar" en panel superior
- Crea nueva versión con totales actualizados

---

## Módulo Administrador

### 1. Gestión de Insumos

**Crear insumo:**
1. Clic en "Nuevo Insumo"
2. Ingresar: Producto, Costo base
3. Guardar

**Editar/Eliminar:**
- Ícono lápiz: Modificar datos
- Ícono basura: Eliminar (requiere confirmación)

### 2. Gestión de Financiador

**Crear financiador:**
1. Clic en "Nuevo Financiador"
2. Completar:
   - Nombre del financiador
   - Tasa mensual (%)
   - Días cobranza teórico
   - Días cobranza real
   - Acuerdo (opcional)
3. Guardar

**Datos importantes:**
- **Tasa mensual**: Para cálculo de rentabilidad con plazo
- **Días cobranza real**: Usado para ajustar rentabilidad
- **Días cobranza teórico**: Referencia contractual

### 3. Servicios por Financiador

**Asignar servicios a financiador:**
1. Seleccionar financiador
2. Clic en "Agregar Servicio"
3. Completar:
   - Servicio
   - Estado (activo/inactivo)
   - Valor a Facturar: Precio unitario al financiador
   - Valor Sugerido: Costo sugerido para negociar con prestador
   - Cantidad Sugerida: Cantidad inicial recomendada
4. Guardar

**Editar valores:**
- Permite ajustar precios y cantidades por financiador

### 4. Gestión de Servicios

**Crear servicio:**
1. Clic en "Nuevo Servicio"
2. Ingresar:
   - Nombre del servicio
   - Tipo de Unidad (horas, sesiones, consultas, días, unidades)
3. Guardar

**Tipo de Unidad:**
- Define cómo se mide el servicio
- Se usa en alertas y reportes

### 5. Gestión de Sucursales

**Editar porcentajes:**
1. Clic en ícono lápiz de la sucursal
2. Ajustar:
   - **% Difícil Acceso**: Recargo por ubicación
   - **% Margen Insumos**: Incluye logística + ganancia
3. Guardar

**Ejemplo:**
- CABA: 30% (solo ganancia)
- Mendoza: 40% (ganancia + logística adicional)

### 6. Gestión de Usuarios

**Acceso:** Solo usuario `admin` ve el ícono de usuario con "+"

**Crear usuario:**
1. Clic en ícono de usuario con "+"
2. Completar: Username, Password, Rol (user/admin)
3. Guardar

**Editar/Eliminar:**
- Modificar credenciales o rol
- Eliminar usuarios (excepto admin)

---

## Conceptos Clave

### Flujo de Cálculo de Insumos

1. **Costo Base**: Precio del insumo en catálogo
2. **Margen Sucursal**: % configurado por sucursal (logística + ganancia)
3. **Precio a Facturar**: Costo Base × (1 + Margen %)
4. **Total a Facturar Insumos**: Σ(Precio a Facturar × Cantidad)

### Flujo de Cálculo de Prestaciones

1. **Valor Asignado**: Costo negociado con prestador (variable)
2. **Valor a Facturar**: Precio fijo por servicio al financiador (Segun Convenios)
3. **Total Costo Prestaciones**: Σ(Valor Asignado × Cantidad)
4. **Total a Facturar Prestaciones**: Σ(Valor a Facturar × Cantidad)

### Cálculo de Rentabilidad

**Rentabilidad Básica:**
```
Rentabilidad = ((Total a Facturar - Costo Total) / Costo Total) × 100
```

**Rentabilidad con Plazo:**
```
Valor Presente = Total a Facturar / (1 + Tasa Mensual)^Meses
Rentabilidad con Plazo = ((Valor Presente - Costo Total) / Costo Total) × 100
```

### Sistema de Alertas

**Se genera alerta cuando:**
- Una prestación supera la `cant_total` (cantidad sugerida mensual, se define en admin)
- Muestra: Servicio, Cantidad actual, Cantidad sugerida, Tipo de unidad


### Historial de Presupuestos

**Cada "Guardar" crea:**
- Nueva versión del presupuesto
- Snapshot de insumos y prestaciones actuales
- Registro de totales y rentabilidad

**Cargar presupuesto existente:**
- Recupera insumos y prestaciones guardadas con **valores históricos**
- Los precios NO se actualizan automáticamente si cambiaron en el catálogo
- Permite editar cantidades y valores manualmente
- Al guardar, crea nueva versión con los valores actuales

**Importante sobre actualizaciones de precios:**
- Los presupuestos guardados mantienen los precios del momento en que se crearon
- Si un insumo costaba $100 y ahora cuesta $150, el presupuesto histórico sigue mostrando $100
- Para actualizar precios: Cargar presupuesto → Eliminar ítems → Agregar nuevamente desde catálogo → Guardar

---

## Consejos de Uso

### Para Usuarios

1. **Verificar DNI**: El sistema detecta pacientes existentes
2. **Revisar alertas**: Indican cantidades fuera de lo esperado
3. **Guardar frecuentemente**: Cada versión queda registrada
4. **Usar Historial**: Para consultar presupuestos anteriores
5. **Actualizar precios**: Si cargás un presupuesto viejo y los precios cambiaron, eliminá y volvé a agregar los ítems

### Para Administradores

1. **Configurar sucursales primero**: Define márgenes por ubicación
2. **Crear servicios antes de asignarlos**: Define tipos de unidad
3. **Mantener valores actualizados**: Revisar precios periódicamente
4. **Ajustar márgenes según logística**: Considerar costos de transporte
5. **Cambios de precios**: Los presupuestos históricos NO se actualizan automáticamente, mantienen valores originales

---

## Soporte

Para consultas o problemas técnicos, contactar al administrador del sistema.

**Versión:** 1.0  
**Última actualización:** 14/11/2025
