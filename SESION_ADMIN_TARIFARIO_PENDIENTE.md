# Sesión Pendiente: Panel de Administración del Tarifario

## 📋 Objetivo
Implementar la gestión completa del tarifario interno desde el panel de administración, permitiendo configurar markup, gestionar servicios, zonas y valores.

## 🎯 Alcance

### 1. Configuración de Markup Global
**Ubicación**: Panel Admin > Reglas de Negocio (o nueva sección "Configuración Tarifario")

**Funcionalidad**:
- Campo editable para porcentaje de markup (0-100%)
- Valor por defecto: 50%
- Aplicable a todos los servicios del tarifario
- Actualización en tiempo real

**Endpoint Backend**:
```typescript
GET  /api/configuracion/markup_tarifario
PUT  /api/configuracion/markup_tarifario
Body: { valor: 50.00 }
```

**UI Propuesta**:
```
┌─────────────────────────────────────────┐
│ Configuración del Tarifario             │
├─────────────────────────────────────────┤
│                                         │
│ Markup Global (%)                       │
│ ┌─────────┐                            │
│ │   50    │ %                          │
│ └─────────┘                            │
│                                         │
│ Este porcentaje se aplica a todos los  │
│ costos del tarifario para calcular el  │
│ valor a facturar.                       │
│                                         │
│ Fórmula:                                │
│ valor_facturar = costo × (1 + markup/100)│
│                                         │
│ [Guardar Cambios]                       │
└─────────────────────────────────────────┘
```

---

### 2. Gestión de Zonas Geográficas
**Ubicación**: Panel Admin > Nueva pestaña "Zonas Tarifario"

**Funcionalidades**:
- ✅ Listar todas las zonas
- ✅ Crear nueva zona
- ✅ Editar zona existente
- ✅ Activar/desactivar zona
- ✅ Asignar zonas a sucursales
- ✅ Marcar zona principal por sucursal

**Endpoints Backend**:
```typescript
GET    /api/tarifario-zonas
POST   /api/tarifario-zonas
PUT    /api/tarifario-zonas/:id
DELETE /api/tarifario-zonas/:id  // Soft delete
GET    /api/sucursales/:id/zonas
POST   /api/sucursales/:id/zonas/:zonaId
DELETE /api/sucursales/:id/zonas/:zonaId
PUT    /api/sucursales/:id/zonas/:zonaId/principal
```

**UI Propuesta**:
```
┌─────────────────────────────────────────────────────────┐
│ Gestión de Zonas del Tarifario                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [+ Nueva Zona]                                          │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Zona          │ Descripción        │ Sucursales │ ││
│ ├─────────────────────────────────────────────────────┤│
│ │ CABA          │ Ciudad Autónoma... │ CABA       │ ││
│ │ AMBA          │ Área Metropolitana │ AMBA       │ ││
│ │ CENTRO        │ Bahía Blanca...    │ BB (P)     │ ││
│ │ REG AC        │ Bahía Blanca...    │ BB         │ ││
│ │ LA PLATA      │ La Plata           │ La Plata   │ ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ (P) = Zona Principal                                    │
└─────────────────────────────────────────────────────────┘
```

**Modal de Asignación de Zonas a Sucursal**:
```
┌─────────────────────────────────────────┐
│ Asignar Zonas a Sucursal: Bahía Blanca  │
├─────────────────────────────────────────┤
│                                         │
│ Zonas Disponibles:                      │
│ ☑ CENTRO (Principal)                    │
│ ☑ REG AC                                │
│ ☐ AMBA                                  │
│ ☐ CABA                                  │
│                                         │
│ Nota: Marque una zona como principal    │
│ para preselección automática            │
│                                         │
│ [Cancelar]  [Guardar]                   │
└─────────────────────────────────────────┘
```

---

### 3. Gestión de Servicios del Tarifario
**Ubicación**: Panel Admin > Nueva pestaña "Servicios Tarifario"

**Funcionalidades**:
- ✅ Listar todos los servicios
- ✅ Crear nuevo servicio
- ✅ Editar servicio existente
- ✅ Configurar tope máximo por servicio
- ✅ Asignar tipo de unidad
- ✅ Activar/desactivar servicio

**Endpoints Backend**:
```typescript
GET    /api/tarifario-servicio
POST   /api/tarifario-servicio
PUT    /api/tarifario-servicio/:id
DELETE /api/tarifario-servicio/:id  // Soft delete
```

**UI Propuesta**:
```
┌───────────────────────────────────────────────────────────────┐
│ Gestión de Servicios del Tarifario                            │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ [+ Nuevo Servicio]                                            │
│                                                               │
│ Filtros: [Tipo: Todos ▼] [Buscar...]                         │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Servicio              │ Tipo    │ Tope Máximo │ Estado ││  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │ HORA CUIDADOR         │ Horas   │ $150,000    │ ✓     ││  │
│ │ HORA ENFERMERIA ADULTO│ Horas   │ $200,000    │ ✓     ││  │
│ │ VISITA MEDICA CLINICA │ Visitas │ $300,000    │ ✓     ││  │
│ │ KINESIOLOGIA          │ Sesiones│ $200,000    │ ✓     ││  │
│ │ FONOAUDIOLOGIA        │ Sesiones│ $200,000    │ ✓     ││  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ [Editar] [Gestionar Costos] [Desactivar]                     │
└───────────────────────────────────────────────────────────────┘
```

**Modal de Crear/Editar Servicio**:
```
┌─────────────────────────────────────────┐
│ Nuevo Servicio del Tarifario            │
├─────────────────────────────────────────┤
│                                         │
│ Nombre del Servicio *                   │
│ ┌─────────────────────────────────────┐ │
│ │ HORA CUIDADOR                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Descripción                             │
│ ┌─────────────────────────────────────┐ │
│ │ Servicio de cuidador por hora       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Tipo de Unidad *                        │
│ ┌─────────────────────────────────────┐ │
│ │ Horas                            ▼  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Tope Máximo a Facturar *                │
│ ┌─────────────────────────────────────┐ │
│ │ $ 150,000.00                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⓘ El tope máximo es el valor total     │
│   máximo permitido para este servicio   │
│   en un presupuesto. Si se supera,      │
│   requiere auditoría comercial.         │
│                                         │
│ [Cancelar]  [Guardar]                   │
└─────────────────────────────────────────┘
```

---

### 4. Gestión de Costos por Zona (5 Valores)
**Ubicación**: Panel Admin > Servicios Tarifario > [Gestionar Costos]

**Funcionalidades**:
- ✅ Ver costos vigentes por zona (5 valores)
- ✅ Agregar nuevos costos (cierra automáticamente los anteriores)
- ✅ Editar costos vigentes
- ✅ Ver histórico de costos (timelapse)
- ✅ Indicador visual de costos desactualizados (> 45 días)
- ✅ Importación masiva desde CSV

**Endpoints Backend**:
```typescript
GET    /api/tarifario-servicio/:id/valores?zona_id=X
POST   /api/tarifario-servicio/:id/valores
PUT    /api/tarifario-servicio/valores/:valorId
DELETE /api/tarifario-servicio/valores/:valorId
POST   /api/tarifario-servicio/importar-csv
```

**UI Propuesta - Vista Principal**:
```
┌───────────────────────────────────────────────────────────────┐
│ Gestión de Costos: HORA ENFERMERIA ADULTO                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Zona: [AMBA (CABA) ▼]                                         │
│                                                               │
│ [+ Agregar Nuevos Costos]  [📥 Importar CSV]                 │
│                                                               │
│ Costos Vigentes (Desde: 01/02/2026)                          │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Orden │ Costo        │ Valor a Facturar │ Días      ││  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │   1   │ $ 3,200.00   │ $ 4,800.00       │ 2 días    ││  │
│ │   2   │ $ 3,500.00   │ $ 5,250.00       │ 2 días    ││  │
│ │   3   │ $ 4,000.00   │ $ 6,000.00       │ 2 días    ││  │
│ │   4   │ $ 4,200.00   │ $ 6,300.00       │ 2 días    ││  │
│ │   5   │ $ 5,000.00   │ $ 7,500.00       │ 2 días ⚠️ ││  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ ⚠️ Orden 5 = Valor más alto (requiere autorización)          │
│                                                               │
│ [Ver Histórico]  [Editar]                                     │
└───────────────────────────────────────────────────────────────┘
```

**Modal de Agregar Costos**:
```
┌─────────────────────────────────────────┐
│ Agregar Costos para AMBA (CABA)         │
├─────────────────────────────────────────┤
│                                         │
│ Fecha de Inicio de Vigencia *           │
│ ┌─────────────────────────────────────┐ │
│ │ 03/02/2026                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⓘ Los costos actuales se cerrarán      │
│   automáticamente el 02/02/2026         │
│                                         │
│ Costos (ordenados de menor a mayor) *   │
│                                         │
│ Orden 1 (Más bajo)                      │
│ ┌─────────────────────────────────────┐ │
│ │ $ 3,200.00                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Orden 2                                 │
│ ┌─────────────────────────────────────┐ │
│ │ $ 3,500.00                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Orden 3                                 │
│ ┌─────────────────────────────────────┐ │
│ │ $ 4,000.00                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Orden 4                                 │
│ ┌─────────────────────────────────────┐ │
│ │ $ 4,200.00                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Orden 5 (Más alto - Requiere autorización)│
│ ┌─────────────────────────────────────┐ │
│ │ $ 5,000.00                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Markup actual: 50%                      │
│ Valores a facturar se calculan          │
│ automáticamente                         │
│                                         │
│ [Cancelar]  [Guardar]                   │
└─────────────────────────────────────────┘
```

**Modal de Histórico**:
```
┌───────────────────────────────────────────────────────────────┐
│ Histórico de Costos: HORA ENFERMERIA ADULTO - AMBA (CABA)     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Período           │ Orden │ Costo      │ Estado       ││  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │ 01/02 - Actual    │   1   │ $ 3,200.00 │ ✓ Vigente   ││  │
│ │                   │   2   │ $ 3,500.00 │ ✓ Vigente   ││  │
│ │                   │   3   │ $ 4,000.00 │ ✓ Vigente   ││  │
│ │                   │   4   │ $ 4,200.00 │ ✓ Vigente   ││  │
│ │                   │   5   │ $ 5,000.00 │ ✓ Vigente   ││  │
│ ├─────────────────────────────────────────────────────────┤  │
│ │ 01/01 - 31/01     │   1   │ $ 3,000.00 │ Cerrado     ││  │
│ │                   │   2   │ $ 3,300.00 │ Cerrado     ││  │
│ │                   │   3   │ $ 3,800.00 │ Cerrado     ││  │
│ │                   │   4   │ $ 4,000.00 │ Cerrado     ││  │
│ │                   │   5   │ $ 4,800.00 │ Cerrado     ││  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ [Cerrar]                                                      │
└───────────────────────────────────────────────────────────────┘
```

---

### 5. Importador CSV de Costos
**Ubicación**: Panel Admin > Servicios Tarifario > [📥 Importar CSV]

**Funcionalidades**:
- ✅ Upload de archivo CSV
- ✅ Validación de formato
- ✅ Preview de datos a importar
- ✅ Reporte de errores por fila
- ✅ Importación parcial (continúa con filas válidas)
- ✅ Log de importación

**UI Propuesta**:
```
┌─────────────────────────────────────────┐
│ Importar Costos desde CSV                │
├─────────────────────────────────────────┤
│                                         │
│ Paso 1: Seleccionar Archivo             │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [📁 Seleccionar archivo CSV]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Formato esperado:                        │
│ servicio,zona,costo_1,costo_2,...       │
│                                         │
│ [📥 Descargar plantilla]                │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Paso 2: Fecha de Vigencia               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 03/02/2026                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⓘ Los costos actuales se cerrarán      │
│   automáticamente el día anterior       │
│                                         │
│ [Cancelar]  [Importar]                  │
└─────────────────────────────────────────┘
```

**Reporte de Importación**:
```
┌─────────────────────────────────────────┐
│ Resultado de Importación                 │
├─────────────────────────────────────────┤
│                                         │
│ ✅ Importación completada                │
│                                         │
│ Total de filas: 150                     │
│ Importadas: 145                         │
│ Con errores: 5                          │
│                                         │
│ Errores encontrados:                    │
│ • Fila 23: Servicio no existe           │
│ • Fila 45: Zona no existe               │
│ • Fila 67: Costos no ordenados          │
│ • Fila 89: Costo inválido               │
│ • Fila 102: Servicio duplicado          │
│                                         │
│ [Descargar Log Completo]  [Cerrar]      │
└─────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos a Crear

### Backend
```
backend/src/
├── controllers/
│   └── tarifarioAdminController.ts (nuevo)
├── routes/
│   └── tarifarioAdmin.ts (nuevo)
└── services/
    └── tarifarioAdminService.ts (nuevo)
```

### Frontend
```
frontend/src/pages/admin/
├── GestionTarifario.tsx (nuevo - componente principal)
├── GestionZonasTarifario.tsx (nuevo)
├── GestionServiciosTarifario.tsx (nuevo)
└── GestionCostosTarifario.tsx (nuevo)
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Controller: tarifarioAdminController.ts
- [ ] Service: tarifarioAdminService.ts
- [ ] Routes: tarifarioAdmin.ts
- [ ] Endpoint: GET/PUT markup_tarifario
- [ ] Endpoint: CRUD zonas
- [ ] Endpoint: Asignar zonas a sucursales
- [ ] Endpoint: CRUD servicios tarifario
- [ ] Endpoint: CRUD costos por zona
- [ ] Endpoint: Importar CSV
- [ ] Validaciones completas
- [ ] Tests unitarios

### Frontend
- [ ] Componente: GestionTarifario.tsx (contenedor principal)
- [ ] Componente: ConfiguracionMarkup (sección de markup)
- [ ] Componente: GestionZonasTarifario.tsx
- [ ] Componente: GestionServiciosTarifario.tsx
- [ ] Componente: GestionCostosTarifario.tsx
- [ ] Modal: AsignarZonasSucursal
- [ ] Modal: CrearEditarServicio
- [ ] Modal: AgregarCostos
- [ ] Modal: HistoricoCostos
- [ ] Modal: ImportarCSV
- [ ] Integrar en AdminDashboard (nueva pestaña)
- [ ] Indicadores visuales de costos desactualizados
- [ ] Validaciones de formularios
- [ ] Manejo de errores

### Documentación
- [ ] Actualizar manual de usuario
- [ ] Documentar endpoints en Swagger
- [ ] Guía de importación CSV
- [ ] Screenshots de UI

---

## 🎨 Integración en AdminDashboard

Agregar nueva pestaña en `AdminDashboard.tsx`:

```tsx
const tabs = [
  'Usuarios',
  'Financiadores',
  'Serv/ Financiador',
  'Equipamientos',
  'Equip/ Financiador',
  'Insumos',
  'Sucursales',
  'Alertas/ Tipo',
  'Reglas de Negocio',
  'Tarifario',  // ← NUEVA PESTAÑA
];
```

---

## 📊 Prioridad de Implementación

### Alta Prioridad (Crítico)
1. ✅ Configuración de Markup Global
2. ✅ Gestión de Servicios del Tarifario
3. ✅ Gestión de Costos por Zona

### Media Prioridad (Importante)
4. ✅ Gestión de Zonas Geográficas
5. ✅ Asignación de Zonas a Sucursales

### Baja Prioridad (Nice to Have)
6. ✅ Importador CSV
7. ✅ Histórico de Costos
8. ✅ Indicadores de Costos Desactualizados

---

## 🚀 Próximos Pasos

1. **Crear estructura de archivos** (backend + frontend)
2. **Implementar endpoints backend** (empezar por markup y servicios)
3. **Crear componentes frontend** (empezar por GestionTarifario.tsx)
4. **Integrar en AdminDashboard**
5. **Testing exhaustivo**
6. **Documentación**

---

**Fecha de Creación**: 3 de Febrero 2026  
**Estado**: 📋 Pendiente de Implementación  
**Estimación**: 2-3 días de desarrollo  
**Prioridad**: Alta
