# Manual de Usuario - Sistema Presupuestador V2.0

## Índice
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Interfaz y Navegación](#interfaz-y-navegación)
4. [Módulo Usuario - Cotizador](#módulo-usuario---cotizador)
5. [Sistema de Notificaciones](#sistema-de-notificaciones)
6. [Sistema de Auditoría](#sistema-de-auditoría)
7. [Módulo Administrador](#módulo-administrador)
8. [Módulo Auditor Médico](#módulo-auditor-médico)
9. [Conceptos Clave](#conceptos-clave)
10. [Resolución de Problemas](#resolución-de-problemas)

---

## Introducción

Sistema integral de presupuestación para servicios de salud con funcionalidades avanzadas:

### Características Principales
- ✅ **Presupuestación inteligente** con insumos y prestaciones
- ✅ **Cálculo automático** de costos y rentabilidad
- ✅ **Sistema de notificaciones en tiempo real** (SSE)
- ✅ **Flujo de auditoría médica** completo
- ✅ **Gestión de versiones** de presupuestos
- ✅ **Alertas inteligentes** de cantidades
- ✅ **Generación de PDF** automática
- ✅ **Dashboard por roles** (Usuario, Admin, Auditor)
- ✅ **Historial completo** con trazabilidad
- ✅ **Filtros con búsqueda limpiable** en todas las interfaces
- ✅ **Actualización automática** con fallback manual

### Roles del Sistema
- **Usuario**: Crea y gestiona presupuestos
- **Administrador**: Configura catálogos y usuarios
- **Auditor Médico**: Revisa y aprueba presupuestos

---

## Acceso al Sistema

### URLs de Acceso
- **Desarrollo**: `http://localhost:5173`
- **Producción**: URL proporcionada por el administrador

### Credenciales por Defecto
```
Usuario estándar:
- Username: usuario
- Password: [asignada por admin]

Administrador:
- Username: admin  
- Password: [configurada en instalación]

Auditor Médico:
- Username: auditor
- Password: [asignada por admin]
```

### Primer Acceso
1. Ingresar credenciales en pantalla de login
2. El sistema redirige automáticamente según el rol
3. Verificar conexión en tiempo real (punto verde en header)

---

## Interfaz y Navegación

### Header Principal
```
[Título del Sistema] ••••••••••••••••••••••••• [👤 Usuario] [🟢] [Salir]
```

**Elementos del Header:**
- **Título**: Indica el módulo actual
- **Usuario**: Nombre del usuario logueado
- **Indicador de conexión**: 
  - 🟢 Verde: Notificaciones en tiempo real activas
  - 🔴 Rojo: Desconectado (reconecta automáticamente)
- **Botón Salir**: Cierra sesión

### Panel de Totales (Solo Usuario)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Insumos: $X     │ Costo Total: $X │ Rentabilidad:   │
│ Prestaciones: $X│ Total Facturar: │ XX.XX%          │
└─────────────────┴─────────────────┴─────────────────┘
```

### Tabs de Navegación
- **Datos Paciente**: Información básica y creación
- **Insumos**: Gestión de insumos médicos
- **Prestaciones**: Servicios y financiadores
- **Historial**: Presupuestos anteriores
- **Notificaciones**: Centro de mensajes 🔴(contador)
- **Auditoría**: Solo para auditores médicos

---

## Módulo Usuario - Cotizador

### 1. Datos del Paciente

#### Crear Nuevo Presupuesto
1. **Completar campos obligatorios:**
   - Nombre y Apellido
   - DNI (sin puntos ni espacios)
   - Sucursal (dropdown)

2. **Opciones adicionales:**
   - ☑️ **Difícil Acceso**: Aplica recargo por ubicación
   - Comentarios adicionales

3. **Guardar:**
   - Clic en "Guardar y Continuar"
   - El sistema valida DNI y crea el presupuesto

#### Paciente Existente
**Si el DNI ya existe, aparecen opciones:**

```
⚠️ Paciente encontrado: Juan Pérez (DNI: 12345678)

[Cargar Existente] [Crear Nuevo para este DNI]
```

- **Cargar Existente**: Edita el último presupuesto
- **Crear Nuevo**: Nueva versión para el mismo paciente

#### Validaciones
- DNI debe ser numérico (8-11 dígitos)
- Nombre no puede estar vacío
- Sucursal debe seleccionarse del catálogo

### 2. Gestión de Insumos

#### Agregar Insumos
1. **Buscar en tabla "Insumos Disponibles":**
   - Usar filtro de búsqueda
   - Ordenar por columnas (Producto, Costo)

2. **Seleccionar insumos:**
   - ☑️ Marcar checkbox del insumo deseado
   - Ingresar cantidad en campo numérico
   - Clic en "Agregar Seleccionados"

#### Tabla de Insumos Seleccionados
```
┌─────────────┬──────────┬─────────┬──────────────┬──────────────┬─────────┐
│ Producto    │ Cantidad │ Costo   │ Precio       │ Subtotal     │ Acciones│
│             │          │ Unit.   │ Facturar     │ Facturar     │         │
├─────────────┼──────────┼─────────┼──────────────┼──────────────┼─────────┤
│ Jeringa 5ml │    10    │ $50.00  │   $65.00     │   $650.00    │ ✏️ 🗑️  │
└─────────────┴──────────┴─────────┴──────────────┴──────────────┴─────────┘
```

**Columnas explicadas:**
- **Costo Unit.**: Precio base del catálogo
- **Precio Facturar**: Costo + margen de sucursal
- **Subtotal Facturar**: Precio × cantidad
- **Acciones**: 
  - ✏️ Editar cantidad
  - 🗑️ Eliminar insumo

#### Cálculo de Márgenes
```
Precio a Facturar = Costo Base × (1 + % Margen Sucursal)

Ejemplo:
- Costo Base: $50
- Margen CABA: 30%
- Precio Final: $50 × 1.30 = $65
```

### 3. Gestión de Prestaciones

#### Seleccionar Financiador
1. **Elegir del dropdown:**
   - Lista de financiadores activos
   - Muestra nombre y tipo de acuerdo

2. **Confirmar selección:**
   - Clic en "Confirmar"
   - Se cargan prestaciones disponibles
   - Aparece información del financiador

#### Información del Financiador
```
📋 Financiador: OSDE
💰 Tasa Mensual: 3.5%
📅 Días Cobranza: 45 días (real) / 30 días (teórico)
📄 Acuerdo: Convenio 2024-A
```

#### Agregar Prestaciones
1. **Seleccionar servicios:**
   - ☑️ Marcar prestaciones deseadas
   - Cantidad se precarga con valor sugerido
   - Valor asignado muestra opciones basadas en valor sugerido

2. **Configurar valores:**
   - **Cantidad**: Ajustar según necesidad
   - **Valor Asignado**: Costo negociado con prestador
   - Opciones: 50%, 75%, 100%, 125% del valor sugerido

3. **Agregar al presupuesto:**
   - Clic en "Agregar Seleccionadas"

#### Tabla de Prestaciones Seleccionadas
```
┌──────────────┬─────────┬──────────┬──────────────┬──────────────┬─────────┐
│ Prestación   │ Cantidad│ Valor    │ Precio       │ Subtotal     │ Acciones│
│              │         │ Asignado │ Facturar     │ Facturar     │         │
├──────────────┼─────────┼──────────┼──────────────┼──────────────┼─────────┤
│ Consulta Med │    5    │ $2000.00 │   $3000.00   │  $15000.00   │ ✏️ 🗑️  │
└──────────────┴─────────┴──────────┴──────────────┴──────────────┴─────────┘
```

### 4. Sistema de Alertas Inteligentes

#### Cuándo Aparecen
Las alertas se muestran automáticamente cuando:
- Una prestación excede la cantidad total sugerida
- Hay inconsistencias en los cálculos
- Se detectan valores fuera de rango

#### Ejemplo de Alerta
```
⚠️ ALERTAS DISPONIBLES                                    [▼]

┌─────────────────────────────────────────────────────────────┐
│ 🔸 Kinesiología: 25 sesiones excede las 20 sugeridas       │
│   Tipo: Sesiones | Sugerido: 20 | Actual: 25              │
└─────────────────────────────────────────────────────────────┘
```

#### Tipos de Alertas
- **Cantidad Excedida**: Supera cantidad mensual sugerida
- **Valor Atípico**: Valor asignado muy diferente al sugerido
- **Rentabilidad Baja**: Margen menor al mínimo configurado

### 5. Acciones del Presupuesto

#### Guardar Presupuesto
```
[💾 Guardar] [🛡️ Pedir Auditoría] [📄 Descargar PDF]
```

**Botón Guardar:**
- Crea nueva versión del presupuesto
- Guarda snapshot de insumos y prestaciones
- Actualiza totales y rentabilidad
- Genera notificación de guardado

#### Pedir Auditoría
1. **Cuándo usar:**
   - Presupuesto complejo o de alto valor
   - Requerimiento institucional
   - Casos especiales o dudosos

2. **Proceso:**
   - Clic en "Pedir Auditoría"
   - Completar mensaje opcional para el auditor
   - Confirmar solicitud
   - El presupuesto pasa a estado "Pendiente"

3. **Mensaje al Auditor:**
```
┌─────────────────────────────────────────────┐
│ Solicitar Auditoría                         │
├─────────────────────────────────────────────┤
│ Presupuesto: #123 - Juan Pérez              │
│                                             │
│ Mensaje para el auditor (opcional):         │
│ ┌─────────────────────────────────────────┐ │
│ │ Paciente con múltiples patologías,      │ │
│ │ requiere tratamiento intensivo...       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│           [Cancelar] [🛡️ Solicitar]         │
└─────────────────────────────────────────────┘
```

#### Descargar PDF
- Genera reporte completo del presupuesto
- Incluye todos los detalles y cálculos
- Formato profesional para presentación

### 6. Historial de Presupuestos

#### Visualización
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Buscar: [___________] 📅 Desde: [____] Hasta: [____] [Filtrar]   │
├─────────────────────────────────────────────────────────────────────┤
│ ID  │ Paciente      │ DNI       │ Sucursal │ Total    │ Estado │ Acc │
├─────┼───────────────┼───────────┼──────────┼──────────┼────────┼─────┤
│ 123 │ Juan Pérez    │ 12345678  │ CABA     │ $45,000  │ ✅ Apr │ ✏️  │
│ 122 │ Ana García    │ 87654321  │ Mendoza  │ $32,500  │ ⏳ Pen │ 👁️  │
│ 121 │ Luis Martín   │ 11223344  │ CABA     │ $28,750  │ ❌ Rec │ ✏️  │
└─────┴───────────────┴───────────┴──────────┴──────────┴────────┴─────┘
```

#### Estados de Presupuestos
- **✅ Aprobado**: Revisado y aprobado por auditor
- **⏳ Pendiente**: Esperando revisión de auditor
- **🔄 En Revisión**: Siendo evaluado por auditor
- **❌ Rechazado**: No aprobado, requiere modificaciones
- **📝 Borrador**: Sin enviar a auditoría

#### Acciones Disponibles
- **✏️ Editar**: Cargar presupuesto para modificar
- **👁️ Ver**: Solo lectura (presupuestos en auditoría)
- **📄 PDF**: Descargar reporte
- **🗑️ Eliminar**: Solo borradores (con confirmación)

---

## Sistema de Notificaciones

### Centro de Notificaciones
**Acceso:** Tab "Notificaciones" con contador 🔴3

#### Tipos de Notificaciones
1. **🟢 Aprobado**: Presupuesto aprobado por auditor
2. **🔴 Rechazado**: Presupuesto rechazado con comentarios
3. **🟡 Pendiente**: Solicitud de auditoría recibida
4. **🔵 Nueva Versión**: Presupuesto actualizado

#### Interfaz de Notificaciones
```
┌─────────────────────────────────────────────────────────────────────┐
│ Notificaciones - 3 nuevas        [Marcar todas como leídas]        │
├─────────────────────────────────────────────────────────────────────┤
│ Estado │ Tipo     │ Presup. │ Paciente    │ Mensaje        │ Fecha  │
├────────┼──────────┼─────────┼─────────────┼────────────────┼────────┤
│ 🔵Nuevo│ APROBADO │ #123 v2 │ Juan Pérez  │ Presupuesto... │ 14:30  │
│ 📖Leído│ RECHAZADO│ #122 v1 │ Ana García  │ Requiere...    │ 13:15  │
└────────┴──────────┴─────────┴─────────────┴────────────────┴────────┘
```

#### Acciones en Notificaciones
- **👁️ Ver Detalle**: Abre modal con información completa
- **✅ Marcar Leída**: Cambia estado a leído
- **🛡️ Ir a Auditoría**: Para notificaciones de auditoría

#### Notificaciones en Tiempo Real
- **Actualización automática**: Sin necesidad de refrescar
- **Indicador visual**: Badge rojo con número de pendientes
- **Sonido**: Opcional para nuevas notificaciones importantes
- **Persistencia**: Se mantienen hasta ser marcadas como leídas

### Modal de Detalle
```
┌─────────────────────────────────────────────┐
│ Detalle de Notificación                     │
├─────────────────────────────────────────────┤
│ Tipo: APROBADO                              │
│ Presupuesto: #123 v2                       │
│ Paciente: Juan Pérez (DNI: 12345678)       │
│ Fecha: 14/11/2024 14:30                    │
│                                             │
│ Mensaje:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Presupuesto aprobado sin observaciones  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Comentario del Auditor:                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Tratamiento adecuado para el caso       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                    [Cerrar]                 │
└─────────────────────────────────────────────┘
```

---

## Sistema de Auditoría

### Flujo de Auditoría

#### 1. Solicitud (Usuario)
```
Usuario crea presupuesto → Solicita auditoría → Estado: "Pendiente"
                                              ↓
                          Notificación a auditores médicos
```

#### 2. Revisión (Auditor)
```
Auditor recibe notificación → Revisa presupuesto → Toma decisión
                                                 ↓
                            Estado: "En Revisión" → "Aprobado/Rechazado"
                                                 ↓
                            Notificación al usuario creador
```

#### 3. Resultado (Usuario)
```
Usuario recibe notificación → Ve resultado → Puede continuar/modificar
```

### Estados del Proceso
- **📝 Borrador**: Presupuesto en creación
- **⏳ Pendiente**: Esperando asignación de auditor
- **🔄 En Revisión**: Siendo evaluado
- **✅ Aprobado**: Autorizado para proceder
- **❌ Rechazado**: Requiere modificaciones

### Comentarios de Auditoría
Los auditores pueden agregar comentarios que se muestran en:
- Notificación al usuario
- Historial del presupuesto
- Reporte PDF

---

## Módulo Administrador

### Acceso
**Solo usuarios con rol 'admin'** ven las opciones administrativas.

### 1. Gestión de Insumos

#### Crear Insumo
```
┌─────────────────────────────────────────────┐
│ Nuevo Insumo                                │
├─────────────────────────────────────────────┤
│ Producto: [🔍_____________________] [✕]    │
│ Costo Base: $[_______]                     │
│ Descripción: [_________________________]   │
│ Activo: ☑️                                 │
│                                             │
│           [Cancelar] [💾 Guardar]           │
└─────────────────────────────────────────────┘
```

**Funcionalidades de búsqueda:**
- **🔍 Icono de búsqueda**: Indica campos de filtro
- **✕ Botón limpiar**: Borra el contenido del filtro
- **Filtrado en tiempo real**: Resultados se actualizan automáticamente

#### Gestión Masiva
- **Importar CSV**: Carga múltiples insumos
- **Exportar**: Descarga catálogo actual
- **Actualización masiva**: Aplicar % de aumento

### 2. Gestión de Financiadores

#### Crear/Editar Financiador
```
┌─────────────────────────────────────────────┐
│ Financiador: OSDE                           │
├─────────────────────────────────────────────┤
│ Nombre: [_________________________]        │
│ Tasa Mensual: [____]% (para cálc. plazo)   │
│ Días Cobranza Teórico: [___] días          │
│ Días Cobranza Real: [___] días             │
│ Acuerdo: [_________________________]       │
│ Estado: ☑️ Activo                          │
│                                             │
│           [Cancelar] [💾 Guardar]           │
└─────────────────────────────────────────────┘
```

#### Configuración Avanzada
- **Tasa mensual**: Para cálculo de valor presente
- **Días cobranza real**: Tiempo real de cobro
- **Días teórico**: Según contrato
- **Acuerdos**: Referencia del convenio

### 3. Servicios por Financiador

#### Asignación de Servicios
```
┌─────────────────────────────────────────────────────────────────────┐
│ Financiador: OSDE                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Servicio          │ Estado │ Valor      │ Valor      │ Cant.    │ Acc │
│                   │        │ Facturar   │ Sugerido   │ Sugerida │     │
├───────────────────┼────────┼────────────┼────────────┼──────────┼─────┤
│ Consulta Médica   │ ✅ Act │ $3,000     │ $2,250     │    10    │ ✏️  │
│ Kinesiología      │ ✅ Act │ $1,500     │ $1,125     │    20    │ ✏️  │
│ Psicología        │ ❌ Ina │ $2,000     │ $1,500     │    15    │ ✏️  │
└───────────────────┴────────┴────────────┴────────────┴──────────┴─────┘

[+ Agregar Servicio]
```

#### Configuración por Servicio
- **Valor Facturar**: Precio fijo al financiador
- **Valor Sugerido**: Base para negociar con prestador
- **Cantidad Sugerida**: Cantidad mensual recomendada
- **Estado**: Activo/Inactivo para nuevos presupuestos

### 4. Gestión de Servicios

#### Crear Servicio
```
┌─────────────────────────────────────────────┐
│ Nuevo Servicio                              │
├─────────────────────────────────────────────┤
│ Nombre: [_________________________]        │
│ Tipo de Unidad: [Dropdown ▼]               │
│   • Horas                                   │
│   • Sesiones                                │
│   • Consultas                               │
│   • Días                                    │
│   • Unidades                                │
│ Descripción: [_________________________]   │
│                                             │
│           [Cancelar] [💾 Guardar]           │
└─────────────────────────────────────────────┘
```

#### Tipos de Unidad
- **Horas**: Para terapias por tiempo
- **Sesiones**: Consultas individuales
- **Consultas**: Visitas médicas
- **Días**: Internaciones o tratamientos diarios
- **Unidades**: Estudios o procedimientos

### 5. Gestión de Sucursales

#### Configurar Márgenes
```
┌─────────────────────────────────────────────────────────────────────┐
│ Sucursal: CABA                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ % Difícil Acceso: [___]%  (Recargo por ubicación)                  │
│ % Margen Insumos: [___]%  (Logística + Ganancia)                   │
│                                                                     │
│ Ejemplo de Cálculo:                                                 │
│ Insumo base: $100                                                   │
│ Con margen (30%): $130                                              │
│ Con difícil acceso (+10%): $143                                     │
│                                                                     │
│                    [Cancelar] [💾 Guardar]                          │
└─────────────────────────────────────────────────────────────────────┘
```

#### Configuración Recomendada
- **CABA**: 25-35% (solo ganancia)
- **GBA**: 35-45% (ganancia + logística menor)
- **Interior**: 45-60% (ganancia + logística mayor)
- **Difícil Acceso**: 5-15% adicional

### 6. Gestión de Usuarios

#### Acceso Especial
Solo el usuario **'admin'** ve el ícono 👤+ en el header.

#### Crear Usuario
```
┌─────────────────────────────────────────────┐
│ Nuevo Usuario                               │
├─────────────────────────────────────────────┤
│ Username: [_________________________]      │
│ Password: [_________________________]      │
│ Confirmar: [_________________________]     │
│ Rol: [Dropdown ▼]                          │
│   • user (Usuario estándar)                │
│   • admin (Administrador)                  │
│   • auditor_medico (Auditor Médico)        │
│ Sucursal: [Dropdown ▼]                     │
│ Activo: ☑️                                 │
│                                             │
│           [Cancelar] [👤 Crear]             │
└─────────────────────────────────────────────┘
```

#### Gestión de Usuarios Existentes
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Buscar: [___________________] [✕]                                │
├─────────────────────────────────────────────────────────────────────┤
│ Username    │ Rol           │ Sucursal │ Estado │ Último Acceso │ Acc │
├─────────────┼───────────────┼──────────┼────────┼───────────────┼─────┤
│ admin       │ Administrador │ -        │ ✅ Act │ Ahora         │ 🔒  │
│ usuario1    │ Usuario       │ CABA     │ ✅ Act │ 10:30         │ ✏️🗑️│
│ auditor1    │ Auditor Med.  │ -        │ ✅ Act │ 09:15         │ ✏️🗑️│
│ usuario2    │ Usuario       │ Mendoza  │ ❌ Ina │ Ayer          │ ✏️🗑️│
└─────────────┴───────────────┴──────────┴────────┴───────────────┴─────┘
```

**Notas importantes:**
- El usuario 'admin' no puede ser eliminado
- Cambiar rol requiere confirmación
- Usuarios inactivos no pueden acceder al sistema

---

## Módulo Auditor Médico

### Dashboard del Auditor

#### Vista Principal
```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard Auditor Médico                                            │
│ 5 presupuestos pendientes de revisión              🟢 Tiempo real   │
├─────────────────────────────────────────────────────────────────────┤
│ Paciente      │ Ver │ Estado    │ Costo    │ Rent. │ Días │ Creador  │
├───────────────┼─────┼───────────┼──────────┼───────┼──────┼──────────┤
│ Juan Pérez    │ v2  │ ⏳ Pend   │ $45,000  │ 18.5% │  2   │ usuario1 │
│ Ana García    │ v1  │ 🔄 Rev    │ $32,500  │ 12.3% │  5   │ usuario2 │
│ Luis Martín   │ v3  │ ⏳ Pend   │ $28,750  │ 22.1% │  1   │ usuario1 │
└───────────────┴─────┴───────────┴──────────┴───────┴──────┴──────────┘
```

#### Indicadores de Prioridad
- **🔴 Días > 7**: Presupuestos urgentes
- **🟡 Días 3-7**: Atención media
- **🟢 Días < 3**: Recientes
- **💰 Rentabilidad < 15%**: Revisar márgenes

### Proceso de Revisión

#### 1. Seleccionar Presupuesto
Clic en "Revisar" abre el modal de auditoría:

```
┌─────────────────────────────────────────────┐
│ Revisar Presupuesto #123                    │
├─────────────────────────────────────────────┤
│ Paciente: Juan Pérez (DNI: 12345678)       │
│ Creador: usuario1 (CABA)                   │
│ Costo Total: $45,000                       │
│ Rentabilidad: 18.5%                        │
│                                             │
│ Comentario (opcional):                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Tratamiento adecuado, cantidades        │ │
│ │ dentro de lo esperado...                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│        [✅ Aprobar] [❌ Rechazar]            │
│                                             │
│              [Cancelar]                     │
└─────────────────────────────────────────────┘
```

#### 2. Criterios de Evaluación
**Aprobar cuando:**
- Cantidades dentro de rangos esperados
- Rentabilidad adecuada (>15% típicamente)
- Tratamiento médicamente justificado
- Costos acordes al mercado

**Rechazar cuando:**
- Cantidades excesivas sin justificación
- Rentabilidad muy baja o muy alta
- Tratamiento no justificado médicamente
- Errores en cálculos o configuración

#### 3. Comentarios del Auditor
- **Obligatorios para rechazos**: Explicar motivo
- **Opcionales para aprobaciones**: Observaciones adicionales
- **Visibles para el usuario**: En notificaciones y reportes
- **Históricos**: Se mantienen en el registro

### Notificaciones para Auditores

#### Recepción Automática
- **Nuevas solicitudes**: Notificación inmediata
- **Presupuestos modificados**: Si requieren re-auditoría
- **Recordatorios**: Para presupuestos pendientes >7 días

#### Centro de Notificaciones
Similar al usuario, pero enfocado en:
- Solicitudes de auditoría pendientes
- Presupuestos re-enviados
- Comunicaciones del administrador

---

## Conceptos Clave

### Flujo de Cálculo Completo

#### 1. Insumos
```
Costo Base → + Margen Sucursal → + Difícil Acceso → Precio Final

Ejemplo:
$100 → +30% ($130) → +10% ($143) → $143 por unidad
```

#### 2. Prestaciones
```
Valor Sugerido ← Negociación → Valor Asignado
                                     ↓
Valor Facturar (fijo por financiador) → Facturación
```

#### 3. Rentabilidad
```
Básica = ((Total Facturar - Costo Total) / Costo Total) × 100

Con Plazo = ((Valor Presente - Costo Total) / Costo Total) × 100

Donde:
Valor Presente = Total Facturar / (1 + Tasa Mensual)^(Días/30)
```

### Sistema de Versiones

#### Versionado Automático
- Cada "Guardar" crea nueva versión
- Mantiene histórico completo
- Permite comparar cambios
- Trazabilidad de modificaciones

#### Estructura de Versiones
```
Presupuesto #123:
├── v1: Versión inicial (Borrador)
├── v2: Primera revisión (Pendiente Auditoría)
├── v3: Modificado post-rechazo (En Revisión)
└── v4: Versión final (Aprobado)
```

### Estados y Transiciones

#### Diagrama de Estados
```
[Borrador] → [Pendiente] → [En Revisión] → [Aprobado/Rechazado]
     ↑                                           ↓
     └─────────── [Modificación] ←───────────────┘
```

#### Permisos por Estado
- **Borrador**: Editable por creador
- **Pendiente**: Solo lectura, esperando auditor
- **En Revisión**: Solo lectura, en evaluación
- **Aprobado**: Solo lectura, proceso completo
- **Rechazado**: Editable para correcciones

### Alertas y Validaciones

#### Sistema de Alertas Inteligentes
```
Tipo de Alerta → Condición → Acción Sugerida

Cantidad Excedida → Prestación > Cant. Sugerida → Revisar justificación
Rentabilidad Baja → Margen < 15% → Ajustar precios
Valor Atípico → Valor muy diferente → Verificar negociación
```

#### Validaciones del Sistema
- **DNI**: Formato y unicidad
- **Cantidades**: Números positivos
- **Precios**: Valores razonables
- **Fechas**: Coherencia temporal
- **Permisos**: Acceso por rol

---

## Resolución de Problemas

### Problemas Comunes

#### 1. No se actualizan las notificaciones
**Síntomas:**
- Contador no cambia
- Punto rojo en header
- Notificaciones no aparecen

**Solución:**
1. Verificar conexión a internet (punto verde/rojo en header)
2. El sistema reintenta automáticamente cada 20 segundos
3. Usar botón de actualización manual si está disponible
4. Refrescar página (F5) como último recurso
5. Contactar administrador si persiste

#### 2. Error al guardar presupuesto
**Síntomas:**
- Mensaje de error al hacer clic en "Guardar"
- Datos no se persisten

**Solución:**
1. Verificar que todos los campos obligatorios estén completos
2. Revisar que las cantidades sean números válidos
3. Intentar guardar nuevamente
4. Si persiste, contactar soporte técnico

#### 3. PDF no se genera
**Síntomas:**
- Botón "Descargar PDF" no responde
- Error en la descarga

**Solución:**
1. Verificar que el presupuesto esté guardado
2. Permitir descargas en el navegador
3. Verificar espacio en disco
4. Intentar con otro navegador

#### 4. Presupuesto no aparece en historial
**Síntomas:**
- Presupuesto guardado no se ve en la lista
- Búsqueda no encuentra resultados

**Solución:**
1. Verificar filtros de búsqueda
2. Ampliar rango de fechas
3. Refrescar la página
4. Verificar que se guardó correctamente

### Códigos de Error Comunes

#### Errores de Autenticación
- **401 Unauthorized**: Sesión expirada, volver a loguearse
- **403 Forbidden**: Sin permisos para la acción

#### Errores de Validación
- **400 Bad Request**: Datos inválidos en el formulario
- **422 Unprocessable Entity**: Error en validación de negocio

#### Errores del Servidor
- **500 Internal Server Error**: Error interno, contactar administrador
- **503 Service Unavailable**: Servicio temporalmente no disponible

### Contacto de Soporte

#### Información a Proporcionar
1. **Usuario y rol**
2. **Acción que estaba realizando**
3. **Mensaje de error exacto**
4. **Navegador y versión**
5. **Captura de pantalla si es posible**

#### Canales de Soporte
- **Email**: soporte@sistema.com
- **Teléfono**: +54 11 1234-5678
- **Horario**: Lunes a Viernes 9:00-18:00

---

## Anexos

### Glosario de Términos

- **Financiador**: Obra social, prepaga o entidad que paga los servicios
- **Prestador**: Profesional o institución que brinda el servicio
- **Valor Asignado**: Costo negociado con el prestador
- **Valor Facturar**: Precio fijo cobrado al financiador
- **Margen Sucursal**: Porcentaje de ganancia + logística
- **Difícil Acceso**: Recargo por ubicación geográfica
- **SSE**: Server-Sent Events, tecnología para notificaciones en tiempo real
- **Auditoría**: Proceso de revisión y aprobación médica

### Atajos de Teclado

- **Ctrl + S**: Guardar presupuesto (en formularios)
- **Ctrl + F**: Buscar en tablas
- **Esc**: Cerrar modales y limpiar filtros
- **Tab**: Navegar entre campos
- **Enter**: Confirmar en modales
- **Clic en ✕**: Limpiar filtros de búsqueda

### Navegadores Compatibles

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

---

**Versión del Manual:** 2.1  
**Última Actualización:** 15/11/2024  
**Sistema:** Presupuestador Web v2.1  
**Autor:** Equipo de Desarrollo

### Cambios en v2.1
- ✅ Filtros con botón de limpieza en todas las interfaces
- ✅ Optimización de código (eliminación de archivos no utilizados)
- ✅ Mejoras en la experiencia de usuario
- ✅ Sistema de reconexión automática mejorado

---

*Este manual cubre todas las funcionalidades del sistema. Para consultas específicas o problemas técnicos, contactar al equipo de soporte.*