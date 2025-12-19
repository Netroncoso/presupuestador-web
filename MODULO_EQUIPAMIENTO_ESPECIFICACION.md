# Módulo de Equipamiento - Especificación Técnica v1.0

**Fecha:** Enero 2025  
**Estado:** 📋 Planificación  
**Prioridad:** Media  
**Esfuerzo Estimado:** 13-17 horas

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
9. [Migraciones](#migraciones)
10. [Plan de Implementación](#plan-de-implementación)

---

## 1. Resumen Ejecutivo

### Objetivo
Agregar una nueva pestaña "Equipamiento" al sistema de presupuestos para gestionar equipos médicos de alquiler mensual (camas, concentradores de oxígeno, monitores, etc.) con soporte para:
- Precios con acuerdo por financiador (valores históricos)
- Precios sin acuerdo (carga manual)
- Alertas por tipo de equipo (ej: "5+ tubos O2 → Paciente complejo")
- Gestión desde panel de administrador

### Alcance
- ✅ CRUD completo de equipamientos
- ✅ Valores históricos por financiador (timelapse)
- ✅ Gestión de acuerdos desde admin
- ✅ Sistema de alertas configurable
- ✅ Integración con cálculo de totales
- ✅ Modo solo lectura para históricos

---

## 2. Arquitectura de Base de Datos

### 2.1 Tabla: `equipamientos` (Catálogo Maestro)

```sql
CREATE TABLE equipamientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('oxigenoterapia', 'mobiliario', 'monitoreo', 'ventilacion', 'otro') DEFAULT 'otro',
  precio_referencia DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio por defecto si no hay acuerdo',
  unidad_tiempo ENUM('mensual', 'diario', 'semanal') DEFAULT 'mensual',
  genera_alerta BOOLEAN DEFAULT FALSE,
  umbral_alerta INT DEFAULT NULL COMMENT 'Cantidad que dispara alerta',
  mensaje_alerta VARCHAR(255) DEFAULT NULL,
  color_alerta VARCHAR(20) DEFAULT 'orange',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Ejemplos de datos:**
```sql
INSERT INTO equipamientos (nombre, tipo, precio_referencia, genera_alerta, umbral_alerta, mensaje_alerta) VALUES
('Tubo de Oxígeno 10m³', 'oxigenoterapia', 5000.00, TRUE, 5, 'Alto consumo de oxígeno - Paciente complejo'),
('Cama Articulada Eléctrica', 'mobiliario', 15000.00, FALSE, NULL, NULL),
('Concentrador de Oxígeno 5L', 'oxigenoterapia', 12000.00, TRUE, 2, 'Múltiples concentradores - Verificar necesidad'),
('Monitor de Signos Vitales', 'monitoreo', 8000.00, FALSE, NULL, NULL);
```

### 2.2 Tabla: `financiador_equipamiento` (Acuerdos)

```sql
CREATE TABLE financiador_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idobra_social INT NOT NULL,
  id_equipamiento INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL COMMENT 'Precio negociado con financiador',
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

### 2.3 Tabla: `financiador_equipamiento_valores` (Valores Históricos)

```sql
CREATE TABLE financiador_equipamiento_valores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_financiador_equipamiento INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL,
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

### 2.4 Tabla: `presupuesto_equipamiento` (Equipos en Presupuesto)

```sql
CREATE TABLE presupuesto_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPresupuestos INT NOT NULL,
  id_equipamiento INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo DECIMAL(10,2) NOT NULL COMMENT 'Precio usado: acuerdo o manual',
  precio_facturar DECIMAL(10,2) NOT NULL COMMENT 'costo + margen',
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

### 3.1 Rutas Principales

```
GET    /api/equipamientos                           # Listar todos
GET    /api/equipamientos/:id                       # Obtener uno
POST   /api/equipamientos                           # Crear (admin)
PUT    /api/equipamientos/:id                       # Actualizar (admin)
DELETE /api/equipamientos/:id                       # Eliminar (admin)

GET    /api/equipamientos/financiador/:id           # Por financiador
GET    /api/equipamientos/acuerdo/:id/valores       # Valores históricos
POST   /api/equipamientos/acuerdo/:id/valores       # Agregar valor

POST   /api/presupuestos/:id/equipamiento           # Agregar a presupuesto
DELETE /api/presupuestos/:id/equipamiento           # Eliminar de presupuesto
GET    /api/presupuestos/:id/equipamiento           # Listar equipamiento
```

### 3.2 Controller: `equipamientosController.ts`

**Funciones principales:**
- `obtenerEquipamientos()` - Lista catálogo completo
- `obtenerEquipamientosPorFinanciador()` - Con valores vigentes por fecha/sucursal
- `crearEquipamiento()` - Admin crea nuevo equipo
- `actualizarEquipamiento()` - Admin edita equipo
- `obtenerValoresHistoricos()` - Historial de precios
- `agregarValorHistorico()` - Nuevo precio con cierre automático de anteriores

### 3.3 Lógica de Valores Vigentes

```typescript
// Prioridad de valores (igual que prestaciones)
COALESCE(
  (SELECT valor_asignado FROM financiador_equipamiento_valores
   WHERE fecha BETWEEN fecha_inicio AND fecha_fin
   AND sucursal_id = ? LIMIT 1),  -- Específico
  (SELECT valor_asignado FROM financiador_equipamiento_valores
   WHERE fecha BETWEEN fecha_inicio AND fecha_fin
   AND sucursal_id IS NULL LIMIT 1),  -- General
  precio_referencia  -- Fallback
)
```

---

## 4. Frontend - Componentes

### 4.1 Componente: `Equipamiento.tsx`

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

**Estados:**
- `equipamientosDisponibles` - Catálogo filtrado por financiador
- `equipamientoSeleccionado` - Equipo actual en formulario
- `cantidad` - Cantidad a agregar
- `costoManual` - Para equipos sin acuerdo
- `alertasActivas` - Alertas disparadas

**Funciones:**
- `cargarEquipamientosPorFinanciador()` - Carga catálogo
- `agregarEquipamiento()` - Agrega al presupuesto
- `eliminarEquipamiento()` - Quita del presupuesto
- `verificarAlertas()` - Evalúa umbrales

### 4.2 Layout Visual

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Equipamiento                                             │
├─────────────────────────────────────────────────────────────┤
│ Grid 2 columnas:                                            │
│                                                             │
│ [Equipos Disponibles]      [Agregar al Presupuesto]       │
│ - Tabla con checkbox       - Formulario con:              │
│ - Muestra tipo             - Nombre (readonly)            │
│ - Precio (acuerdo/manual)  - Cantidad                     │
│ - Badge "Con acuerdo"      - Costo (auto/manual)          │
│                            - Margen %                      │
│                            - Precio facturar              │
│                                                             │
│ [Alertas Activas] (si hay)                                 │
│ - Badge naranja con mensaje                                │
│                                                             │
│ [Equipamientos Seleccionados]                              │
│ - Tabla con edición inline                                 │
│ - Subtotales por fila                                      │
│ - Total general                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Sistema de Valores Históricos

### 5.1 Comportamiento (Igual que Prestaciones)

| Escenario | `costo` | Origen |
|-----------|---------|--------|
| **Crear presupuesto nuevo** | Valor vigente actual | `financiador_equipamiento_valores` |
| **Ver histórico (solo lectura)** | Guardado en BD | `presupuesto_equipamiento` |
| **Editar → Nueva versión** | Actualiza a valor actual | Reconsulta valores vigentes |

### 5.2 Prioridad de Valores

```
1. Valor específico de sucursal (≤ 30 días diferencia con general)
2. Valor general (todas las sucursales)
3. Precio de referencia del catálogo
```

### 5.3 Sistema Anti-Obsolescencia

- Al guardar valor general, cierra valores específicos con > 30 días
- Valores específicos obsoletos pierden prioridad
- Garantiza consistencia entre sucursales

---

## 6. Panel de Administración

### 6.1 Página: Gestión de Equipamientos

**Ruta:** `/admin/equipamientos`

**Funcionalidades:**
- Tabla con todos los equipamientos
- Filtros: Tipo, Activo/Inactivo, Con/Sin alertas
- Botón "Nuevo Equipamiento"
- Modal de edición con campos:
  - Nombre, Descripción, Tipo
  - Precio referencia
  - Genera alerta (checkbox)
  - Umbral alerta (número)
  - Mensaje alerta (texto)
  - Color alerta (select)

### 6.2 Página: Acuerdos por Financiador

**Ruta:** `/admin/equipamientos-financiador`

**Funcionalidades:**
- Selector de financiador
- Tabla de equipamientos con columna "Tiene Acuerdo"
- Botón "Gestionar Valores Históricos" por fila
- Modal de valores históricos:
  - Selector de sucursal (Todas / Específica)
  - Formulario: Valor, Fecha inicio, Sucursal
  - Tabla histórico con columnas: Valor, Fecha inicio, Fecha fin, Sucursal
  - Formato monetario argentino

---

## 7. Sistema de Alertas

### 7.1 Configuración en BD

```sql
-- Ejemplo: Tubo de Oxígeno
genera_alerta = TRUE
umbral_alerta = 5
mensaje_alerta = 'Alto consumo de oxígeno - Paciente complejo'
color_alerta = 'orange'
```

### 7.2 Evaluación en Frontend

```typescript
const verificarAlertas = () => {
  const alertas: Alerta[] = [];
  
  equipamientosSeleccionados.forEach(equipo => {
    const equipoData = equipamientosDisponibles.find(
      e => e.id_equipamiento === equipo.id_equipamiento
    );
    
    if (equipoData?.genera_alerta && equipoData.umbral_alerta) {
      if (equipo.cantidad >= equipoData.umbral_alerta) {
        alertas.push({
          tipo: 'equipamiento',
          mensaje: equipoData.mensaje_alerta,
          color: equipoData.color_alerta,
          equipamiento: equipo.nombre,
          cantidad: equipo.cantidad
        });
      }
    }
  });
  
  setAlertasActivas(alertas);
};
```

### 7.3 Visualización

```tsx
{alertasActivas.length > 0 && (
  <Paper p="md" withBorder style={{ backgroundColor: '#fff3cd' }}>
    <Group gap="xs" mb="xs">
      <ExclamationTriangleIcon style={{ width: 20, height: 20 }} />
      <Text fw={600} c="orange">ALERTAS ACTIVAS</Text>
    </Group>
    <Stack gap="xs">
      {alertasActivas.map((alerta, idx) => (
        <Badge key={idx} color={alerta.color} size="lg">
          {alerta.mensaje} ({alerta.cantidad} unidades)
        </Badge>
      ))}
    </Stack>
  </Paper>
)}
```

### 7.4 Integración con Auditoría

- Alertas de equipamiento → Presupuesto va a auditoría
- Gerencias ven alertas en detalle
- Comentario automático: "Alerta de equipamiento: [mensaje]"

---

## 8. Integración con Presupuestos

### 8.1 Modificar Cálculo de Totales

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

### 8.2 Agregar Columna en `presupuestos`

```sql
ALTER TABLE presupuestos 
ADD COLUMN total_equipamiento DECIMAL(10,2) DEFAULT 0.00 
AFTER total_prestaciones;
```

### 8.3 Modificar `CrearPresupuesto.tsx`

```tsx
// Agregar pestaña
<Tabs.Tab value="equipamiento">
  <Group gap="xs">
    <WrenchScrewdriverIcon style={{ width: 20, height: 20 }} />
    Equipamiento
  </Group>
</Tabs.Tab>

// Agregar panel
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

### 8.4 Mostrar en Detalle de Presupuesto

```tsx
// En ModalDetallePresupuesto.tsx
{presupuesto.equipamientos && presupuesto.equipamientos.length > 0 && (
  <Paper p="md" withBorder>
    <Title order={4} mb="sm">Equipamiento ({presupuesto.equipamientos.length})</Title>
    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Equipo</Table.Th>
          <Table.Th>Cantidad</Table.Th>
          <Table.Th>Costo Unit.</Table.Th>
          <Table.Th>Precio Facturar</Table.Th>
          <Table.Th>Subtotal</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {presupuesto.equipamientos.map((eq: any, idx: number) => (
          <Table.Tr key={idx}>
            <Table.Td>{eq.nombre}</Table.Td>
            <Table.Td>{eq.cantidad}</Table.Td>
            <Table.Td>${Number(eq.costo).toFixed(2)}</Table.Td>
            <Table.Td>${Number(eq.precio_facturar).toFixed(2)}</Table.Td>
            <Table.Td>${(eq.cantidad * eq.precio_facturar).toFixed(2)}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </Paper>
)}
```

---

## 9. Migraciones

### 9.1 Migración Principal

**Archivo:** `backend/migrations/004_create_equipamiento_module.sql`

```sql
-- 1. Crear tabla equipamientos
CREATE TABLE equipamientos (...);

-- 2. Crear tabla financiador_equipamiento
CREATE TABLE financiador_equipamiento (...);

-- 3. Crear tabla financiador_equipamiento_valores
CREATE TABLE financiador_equipamiento_valores (...);

-- 4. Crear tabla presupuesto_equipamiento
CREATE TABLE presupuesto_equipamiento (...);

-- 5. Agregar columna a presupuestos
ALTER TABLE presupuestos 
ADD COLUMN total_equipamiento DECIMAL(10,2) DEFAULT 0.00 
AFTER total_prestaciones;

-- 6. Crear índices de performance
CREATE INDEX idx_presupuesto_equipamiento_presupuesto 
ON presupuesto_equipamiento(idPresupuestos);

CREATE INDEX idx_financiador_equipamiento_valores_vigencia 
ON financiador_equipamiento_valores(fecha_inicio, fecha_fin);
```

### 9.2 Datos Iniciales

**Archivo:** `backend/migrations/004_seed_equipamientos.sql`

```sql
INSERT INTO equipamientos (nombre, tipo, precio_referencia, genera_alerta, umbral_alerta, mensaje_alerta) VALUES
('Tubo de Oxígeno 10m³', 'oxigenoterapia', 5000.00, TRUE, 5, 'Alto consumo de oxígeno - Paciente complejo'),
('Tubo de Oxígeno 6m³', 'oxigenoterapia', 3500.00, TRUE, 8, 'Alto consumo de oxígeno - Paciente complejo'),
('Concentrador de Oxígeno 5L', 'oxigenoterapia', 12000.00, TRUE, 2, 'Múltiples concentradores - Verificar necesidad'),
('Concentrador de Oxígeno 10L', 'oxigenoterapia', 18000.00, TRUE, 1, 'Concentrador de alto flujo - Paciente crítico'),
('Cama Articulada Eléctrica', 'mobiliario', 15000.00, FALSE, NULL, NULL),
('Cama Ortopédica Manual', 'mobiliario', 8000.00, FALSE, NULL, NULL),
('Colchón Antiescaras', 'mobiliario', 6000.00, FALSE, NULL, NULL),
('Monitor de Signos Vitales', 'monitoreo', 8000.00, FALSE, NULL, NULL),
('Oxímetro de Pulso', 'monitoreo', 2000.00, FALSE, NULL, NULL),
('Nebulizador Ultrasónico', 'ventilacion', 3500.00, FALSE, NULL, NULL);
```

---

## 10. Plan de Implementación

### Fase 1: Base de Datos (2-3 horas)
- ✅ Crear 4 tablas nuevas
- ✅ Agregar columna `total_equipamiento` a presupuestos
- ✅ Crear índices de performance
- ✅ Insertar datos iniciales (10 equipamientos comunes)
- ✅ Probar queries de valores históricos

### Fase 2: Backend (4-5 horas)
- ✅ Crear `equipamientosController.ts`
- ✅ Implementar CRUD completo
- ✅ Endpoint de valores históricos con cierre automático
- ✅ Endpoint por financiador con prioridad sucursal
- ✅ Integrar en `recalcularTotales()`
- ✅ Agregar equipamiento a query de detalle de presupuesto
- ✅ Testing de endpoints

### Fase 3: Frontend - Componente Principal (5-6 horas)
- ✅ Crear `Equipamiento.tsx`
- ✅ Tabla de equipos disponibles
- ✅ Formulario de agregar (con costo manual para sin acuerdo)
- ✅ Tabla de equipos seleccionados
- ✅ Sistema de alertas visual
- ✅ Integración con `CrearPresupuesto.tsx`
- ✅ Modo solo lectura para históricos

### Fase 4: Frontend - Panel Admin (3-4 horas)
- ✅ Página `admin/Equipamientos.tsx`
- ✅ CRUD de equipamientos
- ✅ Página `admin/EquipamientosPorFinanciador.tsx`
- ✅ Modal de valores históricos (reutilizar de prestaciones)
- ✅ Selector de sucursal
- ✅ Tabla de histórico

### Fase 5: Testing & Ajustes (2-3 horas)
- ✅ Probar flujo completo: crear presupuesto con equipamiento
- ✅ Verificar cálculo de totales
- ✅ Probar alertas con diferentes umbrales
- ✅ Verificar valores históricos por sucursal
- ✅ Probar modo solo lectura
- ✅ Ajustes de UI/UX

---

## 📊 Resumen de Esfuerzo

| Fase | Tiempo Estimado | Complejidad |
|------|-----------------|-------------|
| Base de Datos | 2-3 horas | Baja |
| Backend | 4-5 horas | Media |
| Frontend - Componente | 5-6 horas | Media |
| Frontend - Admin | 3-4 horas | Media |
| Testing & Ajustes | 2-3 horas | Baja |
| **TOTAL** | **16-21 horas** | **Media** |

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Ejecutar migración `004_create_equipamiento_module.sql`
- [ ] Ejecutar seed `004_seed_equipamientos.sql`
- [ ] Verificar FKs y índices
- [ ] Probar queries de valores históricos

### Backend
- [ ] Crear `equipamientosController.ts`
- [ ] Crear rutas en `routes/equipamientos.ts`
- [ ] Modificar `recalcularTotales()` en helpers
- [ ] Agregar equipamiento a query de detalle
- [ ] Testing con Postman/Thunder Client

### Frontend - Componente
- [ ] Crear `Equipamiento.tsx`
- [ ] Integrar en `CrearPresupuesto.tsx`
- [ ] Implementar sistema de alertas
- [ ] Probar modo solo lectura

### Frontend - Admin
- [ ] Crear `admin/Equipamientos.tsx`
- [ ] Crear `admin/EquipamientosPorFinanciador.tsx`
- [ ] Reutilizar modal de valores históricos
- [ ] Agregar rutas en router

### Testing
- [ ] Crear presupuesto con equipamiento
- [ ] Verificar totales
- [ ] Probar alertas
- [ ] Verificar valores históricos
- [ ] Probar edición → nueva versión

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar especificación**
2. **Ejecutar migraciones en entorno de desarrollo**
3. **Implementar backend (endpoints + lógica)**
4. **Desarrollar componente frontend**
5. **Integrar con panel de administración**
6. **Testing exhaustivo**
7. **Documentar en README.md**
8. **Deploy a producción**

---

**Fin del documento**
