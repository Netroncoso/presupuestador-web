# Sistema Dual de Zonas - Arquitectura

## 📋 Problema Original

El sistema mezclaba dos conceptos diferentes de "zona":
- **Zona Tarifario**: Define el COSTO de servicios de Medihome
- **Zona Financiador**: Define el PRECIO A FACTURAR por financiador

## 🎯 Solución: Sistema Dual de Zonas

### Flujo de Datos del Presupuesto

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATOS DEL PACIENTE                                       │
├─────────────────────────────────────────────────────────────┤
│ • Nombre, DNI                                               │
│ • Sucursal Medihome → % recargo insumos                    │
│ • Zona Tarifario → Define costos de servicios              │
│ • Zona Financiador → Define precios a facturar             │
│ • Financiador                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVICIOS CON CONVENIO (Pestaña Servicios)              │
├─────────────────────────────────────────────────────────────┤
│ Lista servicios del financiador para zona_financiador      │
│                                                             │
│ Servicio Financiador    | Precio Facturar | Servicio Costo│
│ ─────────────────────────────────────────────────────────  │
│ Consulta Médica         | $5,000          | [Selector]    │
│ Enfermería Domiciliaria | $3,500          | [Selector]    │
│                                                             │
│ [Selector] → Lista servicios tarifario por zona_tarifario  │
│           → Muestra 5 valores posibles                     │
│           → Usuario elige cuál usar (1-5)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CÁLCULO DE UTILIDAD                                      │
├─────────────────────────────────────────────────────────────┤
│ Precio Facturar (Financiador) - Precio Costo (Tarifario)   │
│ = Utilidad del Servicio                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `tarifario_zonas` (YA EXISTE)
Define zonas geográficas de Medihome para costos.

```sql
id | nombre      | descripcion
---|-------------|------------------
1  | CABA        | Ciudad Autónoma
2  | AMBA        | Área Metropolitana
3  | La Plata    | La Plata
...
```

#### 2. `financiador_zonas` (NUEVA)
Define zonas que usan los financiadores para precios.

```sql
id | nombre  | descripcion
---|---------|------------------
1  | Zona 1  | Zona 1 - Financiadores
2  | Zona 2  | Zona 2 - Financiadores
3  | Zona 3  | Zona 3 - Financiadores
...
```

#### 3. `financiador_zona_mapeo` (NUEVA)
Qué zonas usa cada financiador.

```sql
id | financiador_id | zona_id | activo
---|----------------|---------|-------
1  | 5              | 1       | 1
2  | 5              | 2       | 1
3  | 8              | 1       | 1
```

#### 4. `prestador_servicio_valores` (MODIFICADA)
Precios a facturar por financiador/servicio/zona.

```sql
id | id_prestador_servicio | zona_financiador_id | precio_facturar | fecha_inicio | fecha_fin
---|----------------------|---------------------|-----------------|--------------|----------
1  | 123                  | 1                   | 5000.00         | 2025-01-01   | NULL
2  | 123                  | 2                   | 4500.00         | 2025-01-01   | NULL
```

**Cambios:**
- ❌ Eliminado: `sucursal_id`, `valor_asignado`
- ✅ Renombrado: `zona_id` → `zona_financiador_id`
- ✅ Renombrado: `valor_facturar` → `precio_facturar`

#### 5. `tarifario_servicio_valores` (NUEVA)
Costos de servicios Medihome por zona tarifario.

```sql
id | servicio_id | zona_tarifario_id | valor_1 | valor_2 | valor_3 | valor_4 | valor_5 | fecha_inicio | fecha_fin
---|-------------|-------------------|---------|---------|---------|---------|---------|--------------|----------
1  | 45          | 1                 | 3000.00 | 3200.00 | 3500.00 | 3800.00 | 4000.00 | 2025-01-01   | NULL
2  | 45          | 2                 | 2800.00 | 3000.00 | 3200.00 | 3500.00 | 3700.00 | 2025-01-01   | NULL
```

**Nota:** Los 5 valores representan diferentes niveles/complejidades del mismo servicio.

#### 6. `presupuestos` (MODIFICADA)
Ahora incluye ambas zonas.

```sql
-- Antes:
zona_id INT

-- Después:
zona_tarifario_id INT    -- FK → tarifario_zonas
zona_financiador_id INT  -- FK → financiador_zonas
```

#### 7. `presupuesto_prestaciones` (MODIFICADA)
Mapea servicio financiador → servicio tarifario.

```sql
-- Nuevas columnas:
id_servicio_tarifario INT       -- Servicio que cubre el costo
valor_seleccionado TINYINT      -- 1-5: cuál de los 5 valores usar
precio_costo DECIMAL(10,2)      -- Costo del servicio tarifario
```

## 🔄 Flujo de Trabajo

### Frontend: Datos del Paciente

```typescript
interface DatosPresupuesto {
  nombre: string;
  dni: string;
  sucursal_id: number;           // Sucursal Medihome
  zona_tarifario_id: number;     // Zona para costos
  zona_financiador_id: number;   // Zona para precios
  financiador_id: number;
}
```

### Frontend: Servicios con Convenio

```typescript
interface ServicioConvenio {
  id_servicio_financiador: number;
  nombre: string;
  precio_facturar: number;       // Del financiador
  
  // Selector de servicio tarifario:
  id_servicio_tarifario: number;
  valores_disponibles: [number, number, number, number, number]; // 5 valores
  valor_seleccionado: 1 | 2 | 3 | 4 | 5;
  precio_costo: number;          // Del tarifario
  
  // Cálculo:
  utilidad: number;              // precio_facturar - precio_costo
}
```

## 📡 Endpoints Backend Necesarios

### 1. Zonas Financiador

```typescript
// GET /api/financiador/:id/zonas
// Obtener zonas disponibles para un financiador
{
  zonas: [
    { id: 1, nombre: "Zona 1" },
    { id: 2, nombre: "Zona 2" }
  ]
}

// POST /api/admin/financiador/:id/zonas
// Asignar zonas a un financiador
{
  zona_ids: [1, 2, 3]
}
```

### 2. Servicios Financiador por Zona

```typescript
// GET /api/financiador/:id/servicios?zona_financiador_id=1
// Obtener servicios con precios para zona específica
{
  servicios: [
    {
      id_prestador_servicio: 123,
      servicio_id: 45,
      nombre: "Consulta Médica",
      precio_facturar: 5000,
      activo: 1
    }
  ]
}
```

### 3. Valores Tarifario

```typescript
// GET /api/tarifario/servicios?zona_tarifario_id=1
// Obtener servicios tarifario con 5 valores
{
  servicios: [
    {
      id: 45,
      nombre: "Consulta Médica Domiciliaria",
      valores: [3000, 3200, 3500, 3800, 4000],
      tipo_unidad: "consulta"
    }
  ]
}

// POST /api/admin/tarifario/valores
// Crear/actualizar valores tarifario
{
  servicio_id: 45,
  zona_tarifario_id: 1,
  valor_1: 3000,
  valor_2: 3200,
  valor_3: 3500,
  valor_4: 3800,
  valor_5: 4000,
  fecha_inicio: "2025-01-01"
}
```

## 🎨 Cambios en UI

### Pestaña "Datos del Paciente"

```
┌─────────────────────────────────────────┐
│ Nombre: [________________]              │
│ DNI: [________________]                 │
│ Financiador: [Seleccionar ▼]           │
│ Sucursal Medihome: [Seleccionar ▼]     │
│ Zona Tarifario: [Seleccionar ▼]        │
│ Zona Financiador: [Seleccionar ▼]      │
└─────────────────────────────────────────┘
```

### Pestaña "Servicios" (Con Convenio)

```
┌──────────────────────────────────────────────────────────────────┐
│ Servicio Financiador    │ Precio    │ Servicio Tarifario        │
├──────────────────────────────────────────────────────────────────┤
│ Consulta Médica         │ $5,000    │ [Seleccionar servicio ▼] │
│                         │           │ Valor: [1][2][3][4][5]    │
│                         │           │ Costo: $3,500             │
│                         │           │ Utilidad: $1,500          │
├──────────────────────────────────────────────────────────────────┤
│ Enfermería Domiciliaria │ $3,500    │ [Seleccionar servicio ▼] │
│                         │           │ Valor: [1][2][3][4][5]    │
│                         │           │ Costo: $2,800             │
│                         │           │ Utilidad: $700            │
└──────────────────────────────────────────────────────────────────┘
```

## ✅ Ventajas del Sistema Dual

1. **Separación de Conceptos**: Costos vs Precios
2. **Flexibilidad**: Cada financiador define sus zonas
3. **Múltiples Valores**: 5 opciones por servicio tarifario
4. **Histórico**: Fechas de vigencia en ambos sistemas
5. **Cálculo de Utilidad**: Transparente y automático

## 🔄 Estado Actual de Implementación

### ✅ Completado

1. **Migraciones de Base de Datos**
   - ✅ Migración 017: Sistema dual de zonas creado
   - ✅ Migración 018: Mapeo financiadores-zonas
   - ✅ Migración 019: Actualización presupuestos existentes
   - ✅ Migración 020: Limpieza columnas duplicadas
   - ✅ Migración 021: Restauración valores correctos de zona

2. **Backend**
   - ✅ `financiadorZonasService.ts`: Usa `zona_financiador_id` y `zona_tarifario_id`
   - ✅ `tarifarioController.ts`: Acepta ambos nombres (`zona_id` y `zona_tarifario_id`) para compatibilidad
   - ✅ `presupuestoPrestacionesController.ts`: Actualizado a `zona_financiador_id`
   - ✅ `versioningService.ts`: Actualizado para copiar ambas zonas correctamente
   - ✅ Endpoints retornan datos correctos con nuevas columnas

3. **Frontend**
   - ✅ `api.ts`: Todas las funciones envían nombres correctos:
     - `getServiciosFinanciador()` → `zona_financiador_id`
     - `getServiciosTarifario()` → `zona_tarifario_id`
     - `getPrestacionesPorFinanciador()` → `zona_financiador_id`
   - ✅ `DatosPresupuesto.tsx`: Usa `zona_tarifario_id` y `zona_financiador_id`
   - ✅ `useSelectorDual.ts`: Usa `zonaFinanciadorId` y `zonaTarifarioId`
   - ✅ `SelectorDualServicios.tsx`: Componente completo con diseño dual
   - ✅ `PrestacionesTarifario.tsx`: Usa `zona_tarifario_id`
   - ✅ `useTarifario.ts`: Usa `zona_tarifario_id`
   - ✅ `ValoresPorZona.tsx`: Usa `zona_tarifario_id`

### 🎯 Compatibilidad Backward

El backend mantiene compatibilidad **SOLO en tarifarioController.ts** aceptando ambos nombres:
- `zona_id` (legacy) → Internamente usa `zona_tarifario_id`
- `zona_tarifario_id` (nuevo) → Usa directamente

Todos los demás archivos usan exclusivamente los nombres correctos.

### ✅ Verificación Completa

**Frontend**: ✅ Sin usos legacy de `zona_id`
- Todos los archivos actualizados a `zona_tarifario_id` o `zona_financiador_id`

**Backend**: ✅ Sin usos legacy problemáticos
- Archivos de tarifario interno usan `zona_tarifario_id` correctamente
- Archivos de convenios usan `zona_financiador_id` correctamente
- Compatibilidad backward solo en query params de tarifarioController

## 🎯 Compatibilidad Backward

El backend mantiene compatibilidad aceptando ambos nombres de parámetro:
- `zona_id` (legacy) → Internamente usa `zona_tarifario_id`
- `zona_tarifario_id` (nuevo) → Usa directamente

Esto permite que código antiguo siga funcionando mientras se migra gradualmente.

## 🚀 Próximos Pasos

1. ✅ ~~Ejecutar migración `017_crear_sistema_zonas_dual.sql`~~
2. ✅ ~~Crear servicios backend para zonas financiador~~
3. ✅ ~~Crear servicios backend para valores tarifario~~
4. ✅ ~~Actualizar frontend DatosPresupuesto~~
5. ✅ ~~Actualizar frontend Servicios con selector dual~~
6. ⏳ Migrar datos existentes (si aplica)
7. ⏳ Eliminar compatibilidad backward cuando todo esté migrado
7. ⏳ Testing completo del flujo

## 📝 Notas Importantes

- Los 5 valores del tarifario pueden representar diferentes complejidades/niveles del mismo servicio
- Un servicio financiador puede mapearse a diferentes servicios tarifario según el caso
- La utilidad se calcula automáticamente: `precio_facturar - precio_costo`
- Ambos sistemas mantienen histórico con `fecha_inicio` y `fecha_fin`
