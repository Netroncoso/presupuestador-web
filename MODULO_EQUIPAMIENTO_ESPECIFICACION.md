# Módulo de Equipamiento - Documentación Técnica v3.1

**Fecha:** Enero 2025  
**Estado:** ✅ Implementado  
**Versión:** 3.1

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Backend - API REST](#backend-api-rest)
4. [Frontend - Componentes](#frontend-componentes)
5. [Sistema de Valores Históricos](#sistema-de-valores-históricos)
6. [Panel de Administración](#panel-de-administración)
7. [Sistema de Alertas](#sistema-de-alertas)
8. [Integración con Presupuestos](#integración-con-presupuestos)

---

## 1. Resumen Ejecutivo

### Objetivo Cumplido

Módulo completo de equipamientos médicos de alquiler mensual (camas, concentradores de oxígeno, monitores, etc.) con:
- ✅ Precios con acuerdo por financiador (valores históricos)
- ✅ Precios sin acuerdo (precio_referencia como fallback)
- ✅ Alertas configurables por tipo de equipamiento
- ✅ Gestión completa desde panel de administrador
- ✅ Valores históricos por sucursal
- ✅ Sistema anti-obsolescencia (30 días)

### Características Implementadas

- ✅ CRUD completo de equipamientos
- ✅ Valores históricos por financiador y sucursal
- ✅ Gestión de acuerdos desde admin
- ✅ Sistema de alertas por tipo (no por equipamiento individual)
- ✅ Integración con cálculo de totales
- ✅ Modo solo lectura para históricos
- ✅ Todos los equipamientos disponibles para todos los financiadores
- ✅ Normalización de tipos con tabla maestra

---

## 2. Arquitectura de Base de Datos

### 2.1 Tabla: `equipamientos` (Catálogo Maestro)

```sql
CREATE TABLE equipamientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'otro',
  tipo_equipamiento_id INT DEFAULT NULL,
  precio_referencia DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio por defecto si no hay acuerdo',
  unidad_tiempo ENUM('mensual', 'diario', 'semanal') DEFAULT 'mensual',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tipo_equipamiento_id) REFERENCES tipos_equipamiento(id) ON DELETE SET NULL,
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo),
  INDEX idx_tipo_equipamiento (tipo_equipamiento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Nota:** Las columnas de alertas (genera_alerta, umbral_alerta, mensaje_alerta, color_alerta) fueron movidas a `tipos_equipamiento`.

### 2.2 Tabla: `tipos_equipamiento` (Tipos Normalizados)

```sql
CREATE TABLE tipos_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  cantidad_maxima INT DEFAULT NULL COMMENT 'Umbral que dispara alerta',
  mensaje_alerta VARCHAR(255) DEFAULT NULL,
  color_alerta VARCHAR(20) DEFAULT 'orange',
  activo_alerta BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Tipos predefinidos:**
- oxigenoterapia
- mobiliario
- monitoreo
- ventilacion
- otro

### 2.3 Tabla: `financiador_equipamiento` (Acuerdos)

```sql
CREATE TABLE financiador_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idobra_social INT NOT NULL,
  id_equipamiento INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idobra_social) REFERENCES financiador(idobra_social) ON DELETE CASCADE,
  FOREIGN KEY (id_equipamiento) REFERENCES equipamientos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_financiador_equipo (idobra_social, id_equipamiento),
  INDEX idx_financiador (idobra_social),
  INDEX idx_equipamiento (id_equipamiento),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.4 Tabla: `financiador_equipamiento_valores` (Valores Históricos)

```sql
CREATE TABLE financiador_equipamiento_valores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_financiador_equipamiento INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL,
  valor_facturar DECIMAL(10,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  sucursal_id INT DEFAULT NULL COMMENT 'NULL = todas las sucursales',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_financiador_equipamiento) REFERENCES financiador_equipamiento(id) ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID) ON DELETE SET NULL,
  INDEX idx_financiador_equipo (id_financiador_equipamiento),
  INDEX idx_fecha_inicio (fecha_inicio),
  INDEX idx_fecha_fin (fecha_fin),
  INDEX idx_sucursal (sucursal_id),
  INDEX idx_vigencia (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.5 Tabla: `presupuesto_equipamiento` (Equipos en Presupuesto)

```sql
CREATE TABLE presupuesto_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPresupuestos INT NOT NULL,
  id_equipamiento INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo DECIMAL(10,2) NOT NULL COMMENT 'Precio usado: acuerdo o precio_referencia',
  precio_facturar DECIMAL(10,2) NOT NULL,
  tiene_acuerdo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
  FOREIGN KEY (id_equipamiento) REFERENCES equipamientos(id) ON DELETE RESTRICT,
  INDEX idx_presupuesto (idPresupuestos),
  INDEX idx_equipamiento (id_equipamiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Backend - API REST

### 3.1 Rutas Implementadas

```
# Admin CRUD base
GET    /api/equipamientos/admin                     # Listar todos (admin)
POST   /api/equipamientos/admin                     # Crear (admin)
PUT    /api/equipamientos/admin/:id                 # Actualizar (admin)
DELETE /api/equipamientos/admin/:id                 # Eliminar (admin)

# Tipos
GET    /api/equipamientos/tipos                     # Listar tipos
POST   /api/equipamientos/tipos                     # Crear tipo (admin)

# Admin acuerdos
GET    /api/equipamientos/admin/financiador/:id     # Por financiador (admin)
PUT    /api/equipamientos/admin/acuerdo/:id         # Toggle activo
POST   /api/equipamientos/admin/:id/valores         # Agregar valor
GET    /api/equipamientos/admin/:id/valores         # Ver valores

# Públicas (requieren autenticación)
GET    /api/equipamientos                           # Catálogo completo
GET    /api/equipamientos/financiador/:id           # Por financiador con valores

# Valores históricos
GET    /api/equipamientos/acuerdo/:id/valores       # Valores históricos
POST   /api/equipamientos/acuerdo/:id/valores       # Agregar valor

# Presupuesto
POST   /api/presupuestos/:id/equipamientos          # Agregar a presupuesto
DELETE /api/presupuestos/:id/equipamientos/:equipId # Eliminar de presupuesto
GET    /api/presupuestos/:id/equipamientos          # Listar equipamiento
```

### 3.2 Controller: `equipamientosController.ts`

**Funciones principales:**

- `getAllEquipamientos()` - Lista catálogo completo (admin)
- `getEquipamientos()` - Catálogo activo
- `getEquipamientosPorFinanciador()` - Con valores vigentes por fecha/sucursal
- `getEquipamientosPorFinanciadorAdmin()` - Para panel admin
- `crearEquipamiento()` - Admin crea nuevo equipo
- `actualizarEquipamiento()` - Admin edita equipo
- `eliminarEquipamiento()` - Admin elimina equipo
- `getTiposEquipamiento()` - Lista tipos
- `crearTipoEquipamiento()` - Crea nuevo tipo
- `actualizarAcuerdoEquipamiento()` - Toggle activo
- `agregarValorEquipamientoAdmin()` - Nuevo valor histórico
- `getValoresEquipamientoAdmin()` - Histórico de valores
- `agregarEquipamientoPresupuesto()` - Agrega a presupuesto
- `eliminarEquipamientoPresupuesto()` - Quita de presupuesto
- `getEquipamientosPresupuesto()` - Lista equipamiento de presupuesto

### 3.3 Lógica de Valores Vigentes

```typescript
// Prioridad de valores (igual que prestaciones)
COALESCE(
  (SELECT valor_asignado FROM financiador_equipamiento_valores
   WHERE fecha BETWEEN fecha_inicio AND fecha_fin
   AND sucursal_id = ? 
   AND DATEDIFF(fecha_inicio, general.fecha_inicio) >= -30
   LIMIT 1),  -- Específico reciente
  (SELECT valor_asignado FROM financiador_equipamiento_valores
   WHERE fecha BETWEEN fecha_inicio AND fecha_fin
   AND sucursal_id IS NULL LIMIT 1),  -- General
  precio_referencia  -- Fallback
)
```

**Comportamiento:**
- Todos los equipamientos activos están disponibles para todos los financiadores
- Si hay acuerdo específico con valores, usa esos valores
- Si no hay acuerdo, usa `precio_referencia` del catálogo
- Sistema anti-obsolescencia: valores específicos >30 días pierden prioridad

---

## 4. Frontend - Componentes

### 4.1 Componente: `Equipamiento.tsx`

**Ubicación:** `frontend/src/components/Equipamiento.tsx`

**Props:**
```typescript
interface Props {
  equipamientosSeleccionados: Equipamiento[];
  setEquipamientosSeleccionados: (equipos: Equipamiento[]) => void;
  onTotalChange: (totalCosto: number, totalFacturar: number) => void;
  presupuestoId: number | null;
  financiadorId?: string | null;
  soloLectura?: boolean;
}
```

**Funcionalidades:**
- Carga equipamientos disponibles por financiador
- Selector con checkbox
- Formulario de cantidad
- Alertas de valores desactualizados (>45 días)
- Tabla de equipamientos seleccionados
- Edición inline de cantidad y precios
- Cálculo automático de subtotales

### 4.2 Layout Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Equipamiento                                             │
├─────────────────────────────────────────────────────────────┤
│ Grid 2 columnas:                                            │
│                                                             │
│ [Equipos Disponibles]      [Agregar al Presupuesto]       │
│ - Tabla con checkbox       - Nombre (readonly)            │
│ - Tipo (capitalizado)      - Cantidad                     │
│ - Costo                    - Botón Agregar                │
│ - Precio                                                   │
│                                                             │
│ [Equipamientos Seleccionados]                              │
│ - Tabla con edición inline                                 │
│ - Columnas: Nombre, Tipo, Cantidad, Costo Unit.,          │
│   Precio Unit., Subtotal Costo, Subtotal Facturar         │
│ - Acciones: Editar, Eliminar                               │
│ - Total general                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Sistema de Valores Históricos

### 5.1 Comportamiento (Igual que Prestaciones)

| Escenario | `costo` | `precio_facturar` | Origen |
|-----------|---------|-------------------|--------|
| **Crear presupuesto nuevo** | Valor vigente actual | Valor vigente actual | `financiador_equipamiento_valores` o `precio_referencia` |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD | `presupuesto_equipamiento` |
| **Editar → Nueva versión** | Actualiza a valor actual | Actualiza a valor actual | Reconsulta valores vigentes |

### 5.2 Prioridad de Valores

```
1. Valor específico de sucursal (≤ 30 días diferencia con general)
2. Valor general (todas las sucursales)
3. Precio de referencia del catálogo (fallback)
```

### 5.3 Sistema Anti-Obsolescencia

- Al guardar valor general, cierra valores específicos con > 30 días
- Valores específicos obsoletos pierden prioridad
- Garantiza consistencia entre sucursales
- Ventana de tiempo: 30 días (configurable)

---

## 6. Panel de Administración

### 6.1 Página: Gestión Base de Equipamientos

**Componente:** `GestionEquipamientosBase.tsx`  
**Ruta:** Tab "Equipamientos" en AdminDashboard

**Funcionalidades:**
- Tabla con todos los equipamientos
- Columnas: Nombre, Tipo, Precio Referencia, Estado
- Botón "Nuevo Equipamiento"
- Modal de edición:
  - Nombre, Tipo (select de tipos_equipamiento)
  - Precio referencia (formato argentino)
  - Switch activo/inactivo
- Botón "Gestionar Tipos"
  - Modal con lista de tipos existentes
  - Opción de agregar nuevos tipos

### 6.2 Página: Equipamientos por Financiador

**Componente:** `GestionEquipamientos.tsx`  
**Ruta:** Tab "Equip/ Financiador" en AdminDashboard

**Funcionalidades:**
- Selector de financiador (primero)
- Tabla de equipamientos con:
  - Nombre, Tipo, Precio Referencia
  - Valor vigente (si hay acuerdo)
  - Ícono de múltiples valores (SwatchIcon)
  - Switch de estado
  - Botón editar
- Modal de valores históricos:
  - Switch de estado del acuerdo
  - Formulario de valores múltiples:
    - Sucursal (select: Todas / específica)
    - Valor Asignado (costo)
    - Valor Facturar (precio)
    - Fecha Inicio
    - Botones +/- para agregar/quitar filas
  - Tabla de histórico vigente:
    - Columnas: Sucursal, Valor Asignado, Valor Facturar, Fecha Inicio, Fecha Fin
    - Badge verde = Vigente, gris = Histórico
  - Formato monetario argentino ($ 1.234,56)

---

## 7. Sistema de Alertas

### 7.1 Configuración en BD (Tabla tipos_equipamiento)

```sql
-- Ejemplo: Oxigenoterapia
cantidad_maxima = 5
mensaje_alerta = 'Alto consumo de oxígeno - Paciente complejo'
color_alerta = 'orange'
activo_alerta = TRUE
```

**Nota:** Las alertas se configuran por TIPO, no por equipamiento individual.

### 7.2 Gestión de Alertas

**Componente:** `GestionAlertasServicios.tsx` (unificado)  
**Ruta:** Tab "Alertas/ Tipo" en AdminDashboard

**Dos Secciones:**

1. **Alertas por Tipo de Unidad (Servicios)**
   - Lista de tipos_unidad con alertas configurables
   - Columnas: Tipo, Cantidad Máxima, Mensaje, Color, Estado

2. **Alertas por Tipo de Equipamiento**
   - Lista de tipos_equipamiento con alertas configurables
   - Columnas: Tipo, Cantidad Máxima, Mensaje, Color, Estado

**Modal de Edición:**
- Switch "Alerta Activa"
- Cantidad Máxima (número)
- Mensaje de Alerta (texto)
- Color de Alerta (select: orange, red, yellow)

### 7.3 Evaluación en Frontend

Las alertas se evalúan al agregar equipamientos, sumando cantidades por tipo:

```typescript
// Ejemplo: Si hay 3 tubos de O2 + 2 concentradores = 5 items de oxigenoterapia
// Y el tipo "oxigenoterapia" tiene cantidad_maxima = 5
// → Se dispara alerta
```

### 7.4 Alertas de Valores Desactualizados

**Implementación:**
- Se disparan al seleccionar equipamiento con >45 días sin actualizar
- Alertas persistentes (autoClose=false) con botón X
- Posición top-center
- Mensaje: "[Nombre equipamiento]: sin actualizar hace X días"

---

## 8. Integración con Presupuestos

### 8.1 Modificación de Cálculo de Totales

```typescript
// En recalcularTotales()
const [equipamiento] = await pool.query(`
  SELECT 
    COALESCE(SUM(costo * cantidad), 0) as total_costo,
    COALESCE(SUM(precio_facturar * cantidad), 0) as total_facturar
  FROM presupuesto_equipamiento
  WHERE idPresupuestos = ?
`, [presupuestoId]);

const totalEquipamientoCosto = Number(equipamiento[0].total_costo);
const totalEquipamientoFacturar = Number(equipamiento[0].total_facturar);

const costoTotal = totalInsumos + totalPrestaciones + totalEquipamientoCosto;
const totalFacturar = totalInsumosFacturar + totalPrestacionesFacturar + totalEquipamientoFacturar;
```

### 8.2 Integración en CrearPresupuesto.tsx

```tsx
// Pestaña agregada
<Tabs.Tab value="equipamiento">
  <Group gap="xs">
    <WrenchScrewdriverIcon style={{ width: 20, height: 20 }} />
    Equipamiento
  </Group>
</Tabs.Tab>

// Panel agregado
<Tabs.Panel value="equipamiento" pt="md">
  <Equipamiento
    equipamientosSeleccionados={equipamientosSeleccionados}
    setEquipamientosSeleccionados={setEquipamientosSeleccionados}
    onTotalChange={handleEquipamientoTotalChange}
    presupuestoId={presupuestoId}
    financiadorId={financiadorId}
    soloLectura={soloLectura}
  />
</Tabs.Panel>
```

### 8.3 Visualización en Detalle de Presupuesto

Los equipamientos se muestran en el modal de detalle junto con insumos y prestaciones, con tabla completa de cantidades, costos y subtotales.

---

## 📊 Estado de Implementación

| Componente | Estado | Notas |
|------------|--------|-------|
| Base de Datos | ✅ Completo | 5 tablas creadas |
| Migraciones | ✅ Completo | 3 migraciones ejecutadas |
| Backend API | ✅ Completo | 15 endpoints |
| Frontend Componente | ✅ Completo | Equipamiento.tsx |
| Frontend Admin Base | ✅ Completo | GestionEquipamientosBase.tsx |
| Frontend Admin Acuerdos | ✅ Completo | GestionEquipamientos.tsx |
| Sistema de Alertas | ✅ Completo | Por tipo, no individual |
| Valores Históricos | ✅ Completo | Con sucursales |
| Integración Presupuestos | ✅ Completo | Cálculo de totales |
| Modo Solo Lectura | ✅ Completo | Valores de época |

---

## 🎯 Características Destacadas

### 1. Disponibilidad Universal
- Todos los equipamientos activos disponibles para todos los financiadores
- Si no hay acuerdo, usa precio_referencia (valor general)
- Facilita la cotización sin restricciones

### 2. Normalización de Tipos
- Tabla maestra `tipos_equipamiento` con FK
- Alertas configurables por tipo, no por item individual
- Facilita gestión centralizada

### 3. Sistema Anti-Obsolescencia
- Ventana de 30 días para valores específicos
- Cierre automático de valores obsoletos
- Garantiza consistencia de precios

### 4. Alertas Inteligentes
- Alertas de valores desactualizados (>45 días)
- Alertas por tipo de equipamiento
- Mensajes personalizables por tipo

### 5. Valores Históricos Completos
- Por financiador y sucursal
- Cierre automático de períodos
- Prioridad inteligente (específico > general > referencia)

---

## 📚 Documentación Relacionada

- [README.md](./README.md) - Información general del sistema
- [MANUAL_USUARIO_V2.md](./MANUAL_USUARIO_V2.md) - Manual de usuario actualizado
- [ARCHITECTURE_V2.md](./ARCHITECTURE_V2.md) - Arquitectura del sistema
- [Migración 006](./backend/migrations/006_create_tipos_equipamiento.sql) - Tipos de equipamiento
- [Migración 007](./backend/migrations/007_move_alertas_to_tipos.sql) - Alertas a tipos
- [Migración 008](./backend/migrations/008_estandarizar_nombres_alertas.sql) - Estandarización

---

**Fin del documento**  
**Versión:** 3.1  
**Estado:** ✅ Implementado y en Producción
