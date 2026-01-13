# Sistema de Reglas de Negocio por Grupos de Sucursales

## Resumen Ejecutivo

Implementación de reglas de negocio diferenciadas por grupos de sucursales, permitiendo criterios más flexibles para sucursales en desarrollo mientras se mantienen estándares estrictos para sucursales establecidas.

## Objetivo

Permitir que sucursales nuevas o en crecimiento tengan umbrales de auditoría más flexibles sin comprometer los estándares de las sucursales maduras.

## Arquitectura Propuesta

### 1. Modelo de Datos

#### Grupos de Sucursales
- **General** (NULL): Sucursales establecidas con criterios estándar
- **Desarrollo**: Sucursales nuevas/en crecimiento con criterios flexibles
- **Extensible**: Posibilidad de agregar más grupos (premium, franquicias, etc.)

#### Cambios en Base de Datos

```sql
-- Agregar columna grupo_reglas a sucursales
ALTER TABLE sucursales_mh 
ADD COLUMN grupo_reglas VARCHAR(50) NULL DEFAULT NULL 
COMMENT 'Grupo de reglas: NULL=general, desarrollo, premium, etc.';

-- Agregar columna grupo a configuración
ALTER TABLE configuracion_sistema 
ADD COLUMN grupo VARCHAR(50) NULL DEFAULT NULL
COMMENT 'Grupo de reglas: NULL=general, desarrollo, premium, etc.';

-- Modificar constraint único
ALTER TABLE configuracion_sistema 
DROP INDEX clave,
ADD UNIQUE KEY unique_clave_grupo (clave, grupo);

-- Crear índice para performance
CREATE INDEX idx_sucursal_grupo ON sucursales_mh(grupo_reglas);
CREATE INDEX idx_config_grupo ON configuracion_sistema(grupo);
```

### 2. Lógica de Prioridad

```
Usuario crea presupuesto en Sucursal X
  ↓
Sistema consulta: ¿Qué grupo tiene Sucursal X?
  ↓
Si grupo_reglas = 'desarrollo' → Usar reglas con grupo='desarrollo'
Si grupo_reglas = NULL → Usar reglas con grupo=NULL (general)
  ↓
Aplicar reglas correspondientes al presupuesto
```

### 3. Ejemplo de Configuración

| Clave | Valor | Grupo | Descripción |
|-------|-------|-------|-------------|
| auditoria.rentabilidadMinima | 15 | NULL | Rentabilidad mínima - General |
| auditoria.rentabilidadMinima | 10 | desarrollo | Rentabilidad mínima - Desarrollo |
| auditoria.costoMaximo | 150000 | NULL | Costo máximo - General |
| auditoria.costoMaximo | 200000 | desarrollo | Costo máximo - Desarrollo |
| auditoria.rentabilidadConPlazoMaxima | 25 | NULL | Rent. con plazo máx - General |
| auditoria.rentabilidadConPlazoMaxima | 30 | desarrollo | Rent. con plazo máx - Desarrollo |
| auditoria.utilidadMinima | 50000 | NULL | Utilidad mínima - General |
| auditoria.utilidadMinima | 70000 | desarrollo | Utilidad mínima - Desarrollo |

## Interfaz de Usuario (Admin Dashboard)

### Diseño Propuesto: Tabla con Columnas por Grupo

```
┌─────────────────────────────────────────────────────────────────────┐
│  Reglas de Negocio                          [Guardar Cambios]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📋 AUDITORÍA                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Regla                          │ General    │ Desarrollo      │  │
│  ├────────────────────────────────┼────────────┼─────────────────┤  │
│  │ Rentabilidad Mínima            │ [15] %     │ [10] %          │  │
│  │ Costo Máximo                   │ [150000] $ │ [200000] $      │  │
│  │ Rentabilidad con Plazo Máxima  │ [25] %     │ [30] %          │  │
│  │ Utilidad Mínima                │ [50000] $  │ [70000] $       │  │
│  └────────────────────────────────┴────────────┴─────────────────┘  │
│                                                                       │
│  💰 FINANCIERO                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Regla                          │ General    │ Desarrollo      │  │
│  ├────────────────────────────────┼────────────┼─────────────────┤  │
│  │ Días Cobranza Default          │ [30] días  │ [30] días       │  │
│  │ Tasa Mensual Default           │ [2] %      │ [2] %           │  │
│  └────────────────────────────────┴────────────┴─────────────────┘  │
│                                                                       │
│  🚨 ALERTAS                                                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Regla                          │ General    │ Desarrollo      │  │
│  ├────────────────────────────────┼────────────┼─────────────────┤  │
│  │ Cobranza Extendida             │ [60] días  │ [70] días       │  │
│  │ Cobranza Lenta                 │ [50] días  │ [60] días       │  │
│  │ Tasa Alta                      │ [5] %      │ [6] %           │  │
│  │ Monto Crítico                  │ [1500000]$ │ [2000000] $     │  │
│  │ Monto Elevado                  │ [1000000]$ │ [1500000] $     │  │
│  │ Rentabilidad Desaprobado       │ [20] %     │ [15] %          │  │
│  │ Rentabilidad Mejorar           │ [30] %     │ [25] %          │  │
│  │ Rentabilidad Felicitaciones    │ [50] %     │ [45] %          │  │
│  │ Rentabilidad Excepcional       │ [50] %     │ [50] %          │  │
│  └────────────────────────────────┴────────────┴─────────────────┘  │
│                                                                       │
│  ℹ️ Los cambios afectan inmediatamente a presupuestos nuevos        │
│     Sucursales sin grupo asignado usan reglas "General"              │
└─────────────────────────────────────────────────────────────────────┘
```

### Características de la UI

1. **Tabla Comparativa**: Dos columnas lado a lado (General vs Desarrollo)
2. **Edición Inline**: NumberInput en cada celda
3. **Guardado Masivo**: Un solo botón guarda todas las reglas
4. **Indicadores Visuales**:
   - Verde: Valores más flexibles en Desarrollo
   - Amarillo: Valores iguales en ambos grupos
   - Azul: Headers de categoría

### Gestión de Sucursales

Agregar selector en **Panel Admin > Sucursales**:

```
┌─────────────────────────────────────────────────────────┐
│  Editar Sucursal: Neuquén                               │
├─────────────────────────────────────────────────────────┤
│  Nombre: [Neuquén                    ]                  │
│  Grupo de Reglas: [▼ Desarrollo      ]                  │
│                    ├─ General (estándar)                │
│                    └─ Desarrollo (flexible)             │
│                                                          │
│  ℹ️ Las reglas del grupo se aplican automáticamente     │
│     a todos los presupuestos de esta sucursal           │
│                                                          │
│  [Cancelar]  [Guardar]                                  │
└─────────────────────────────────────────────────────────┘
```

## Implementación Backend

### 1. Modificar businessRules.ts

```typescript
// Obtener reglas según grupo de sucursal
export async function getBusinessRules(sucursalId?: number) {
  // Si no hay sucursal, usar reglas generales
  if (!sucursalId) {
    return cachedRules;
  }

  // Obtener grupo de la sucursal
  const [sucursal] = await pool.query<any[]>(
    'SELECT grupo_reglas FROM sucursales_mh WHERE ID = ?',
    [sucursalId]
  );

  const grupo = sucursal[0]?.grupo_reglas || null;

  // Buscar en cache por grupo
  const cacheKey = `rules_${grupo || 'general'}`;
  if (rulesCache[cacheKey] && Date.now() - rulesCache[cacheKey].timestamp < CACHE_TTL) {
    return rulesCache[cacheKey].data;
  }

  // Cargar reglas del grupo desde BD
  const [rows] = await pool.query<any[]>(
    'SELECT clave, valor FROM configuracion_sistema WHERE grupo = ? OR (grupo IS NULL AND clave NOT IN (SELECT clave FROM configuracion_sistema WHERE grupo = ?))',
    [grupo, grupo]
  );

  // Procesar y cachear
  const rules = { ...DEFAULT_RULES };
  rows.forEach(row => {
    const [categoria, campo] = row.clave.split('.');
    if (rules[categoria]) {
      rules[categoria][campo] = Number(row.valor);
    }
  });

  rulesCache[cacheKey] = { data: rules, timestamp: Date.now() };
  return rules;
}
```

### 2. Actualizar Endpoints

```typescript
// GET /configuracion - Devolver todas las reglas agrupadas
router.get('/configuracion', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM configuracion_sistema ORDER BY categoria, clave, grupo'
  );
  res.json(rows);
});

// PUT /configuracion/multiple - Guardar múltiples reglas
router.put('/configuracion/multiple', async (req, res) => {
  const { configuraciones } = req.body;
  
  await pool.query('START TRANSACTION');
  
  for (const config of configuraciones) {
    await pool.query(
      'UPDATE configuracion_sistema SET valor = ? WHERE clave = ? AND grupo <=> ?',
      [config.valor, config.clave, config.grupo]
    );
  }
  
  await pool.query('COMMIT');
  
  // Limpiar cache
  clearRulesCache();
  
  res.json({ success: true });
});
```

### 3. Modificar Evaluación de Auditoría

```typescript
// En presupuestosControllerV2.ts
async function evaluarReglasAuditoria(presupuestoId: number, sucursalId: number) {
  // Obtener reglas según grupo de sucursal
  const rules = await getBusinessRules(sucursalId);
  
  // Evaluar con reglas correspondientes
  const requiereAuditoria = 
    rentabilidad < rules.auditoria.rentabilidadMinima ||
    costoTotal > rules.auditoria.costoMaximo ||
    rentabilidadConPlazo > rules.auditoria.rentabilidadConPlazoMaxima ||
    utilidad > rules.auditoria.utilidadMinima;
  
  return requiereAuditoria;
}
```

## Implementación Frontend

### 1. Modificar GestionReglasNegocio.tsx

```typescript
interface Configuracion {
  id: number;
  clave: string;
  valor: number;
  descripcion: string;
  categoria: string;
  unidad: string;
  grupo: string | null; // NUEVO
}

// Agrupar configuraciones por clave
const agruparPorClave = (configs: Configuracion[]) => {
  const agrupado: Record<string, { general: Configuracion | null, desarrollo: Configuracion | null }> = {};
  
  configs.forEach(config => {
    if (!agrupado[config.clave]) {
      agrupado[config.clave] = { general: null, desarrollo: null };
    }
    
    if (config.grupo === null) {
      agrupado[config.clave].general = config;
    } else if (config.grupo === 'desarrollo') {
      agrupado[config.clave].desarrollo = config;
    }
  });
  
  return agrupado;
};

// Renderizar tabla con dos columnas
<Table>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Regla</Table.Th>
      <Table.Th>General</Table.Th>
      <Table.Th>Desarrollo</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {Object.entries(agrupado).map(([clave, valores]) => (
      <Table.Tr key={clave}>
        <Table.Td>{valores.general?.descripcion}</Table.Td>
        <Table.Td>
          <NumberInput
            value={valores.general?.valor}
            onChange={(val) => handleChange(clave, 'general', val)}
          />
        </Table.Td>
        <Table.Td>
          <NumberInput
            value={valores.desarrollo?.valor}
            onChange={(val) => handleChange(clave, 'desarrollo', val)}
          />
        </Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

### 2. Agregar Gestión en Sucursales

Modificar componente de gestión de sucursales para incluir selector de grupo.

## Migración de Datos

```sql
-- Paso 1: Agregar columnas
ALTER TABLE sucursales_mh ADD COLUMN grupo_reglas VARCHAR(50) NULL DEFAULT NULL;
ALTER TABLE configuracion_sistema ADD COLUMN grupo VARCHAR(50) NULL DEFAULT NULL;

-- Paso 2: Duplicar reglas existentes para grupo desarrollo
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad, grupo)
SELECT clave, valor, descripcion, categoria, unidad, 'desarrollo'
FROM configuracion_sistema
WHERE grupo IS NULL;

-- Paso 3: Ajustar valores para desarrollo (más flexibles)
UPDATE configuracion_sistema SET valor = 10 WHERE clave = 'auditoria.rentabilidadMinima' AND grupo = 'desarrollo';
UPDATE configuracion_sistema SET valor = 200000 WHERE clave = 'auditoria.costoMaximo' AND grupo = 'desarrollo';
UPDATE configuracion_sistema SET valor = 30 WHERE clave = 'auditoria.rentabilidadConPlazoMaxima' AND grupo = 'desarrollo';
UPDATE configuracion_sistema SET valor = 70000 WHERE clave = 'auditoria.utilidadMinima' AND grupo = 'desarrollo';

-- Paso 4: Asignar sucursales a grupos (ejemplo)
UPDATE sucursales_mh SET grupo_reglas = 'desarrollo' WHERE Sucursales_mh IN ('Neuquén', 'Mendoza', 'Río Negro');

-- Paso 5: Modificar constraint
ALTER TABLE configuracion_sistema DROP INDEX clave;
ALTER TABLE configuracion_sistema ADD UNIQUE KEY unique_clave_grupo (clave, grupo);

-- Paso 6: Crear índices
CREATE INDEX idx_sucursal_grupo ON sucursales_mh(grupo_reglas);
CREATE INDEX idx_config_grupo ON configuracion_sistema(grupo);
```

## Testing

### Casos de Prueba

1. **Sucursal General**:
   - Crear presupuesto en Casa Central (grupo=NULL)
   - Verificar que usa rentabilidadMinima = 15%
   - Presupuesto con 14% debe ir a auditoría

2. **Sucursal Desarrollo**:
   - Crear presupuesto en Neuquén (grupo='desarrollo')
   - Verificar que usa rentabilidadMinima = 10%
   - Presupuesto con 11% NO debe ir a auditoría
   - Presupuesto con 9% SÍ debe ir a auditoría

3. **Cambio de Grupo**:
   - Cambiar Neuquén de 'desarrollo' a NULL
   - Nuevos presupuestos deben usar reglas generales
   - Presupuestos existentes mantienen su evaluación original

4. **Edición de Reglas**:
   - Modificar rentabilidadMinima de desarrollo a 12%
   - Verificar que nuevos presupuestos usan 12%
   - Cache debe actualizarse en < 1 minuto

## Ventajas del Sistema

✅ **Flexibilidad**: Sucursales nuevas pueden crecer sin restricciones excesivas
✅ **Control**: Sucursales maduras mantienen estándares de calidad
✅ **Escalabilidad**: Fácil agregar nuevos grupos (premium, franquicias)
✅ **Simplicidad**: Solo 2 conjuntos de reglas (no 10+ por sucursal)
✅ **Mantenibilidad**: Cambiar 1 regla afecta a todo el grupo
✅ **Trazabilidad**: Cada presupuesto sabe qué reglas usó

## Cronograma de Implementación

| Fase | Tarea | Tiempo Estimado |
|------|-------|-----------------|
| 1 | Migración BD (agregar columnas, duplicar reglas) | 30 min |
| 2 | Backend: Modificar businessRules.ts | 1 hora |
| 3 | Backend: Actualizar endpoints configuración | 1 hora |
| 4 | Backend: Modificar evaluación auditoría | 30 min |
| 5 | Frontend: Rediseñar GestionReglasNegocio | 2 horas |
| 6 | Frontend: Agregar selector en Sucursales | 1 hora |
| 7 | Testing completo | 2 horas |
| **TOTAL** | | **8 horas** |

## Consideraciones Futuras

### Posibles Extensiones

1. **Más Grupos**:
   - `premium`: Clientes VIP con criterios especiales
   - `franquicias`: Socios externos con autonomía
   - `internacional`: Sucursales en otros países

2. **Reglas Temporales**:
   - Aplicar reglas flexibles solo durante primeros 6 meses
   - Auto-promoción a grupo general después de X presupuestos

3. **Dashboard de Comparación**:
   - Gráficos comparando performance entre grupos
   - Métricas: % auditorías, rentabilidad promedio, etc.

4. **Alertas Proactivas**:
   - Notificar cuando sucursal desarrollo está lista para grupo general
   - Alertar si sucursal general tiene muchos rechazos

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Estado:** Propuesta para Implementación
