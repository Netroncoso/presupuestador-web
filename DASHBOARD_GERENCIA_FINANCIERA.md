# Dashboard Gerencia Financiera

## Descripción General

Dashboard especializado para la Gerencia Financiera que proporciona análisis detallado de costos, rentabilidad y performance del sistema de presupuestos. Permite tomar decisiones estratégicas basadas en datos históricos y tendencias.

---

## 📊 Estructura del Dashboard

### 3 Pestañas Principales

1. **Resumen Ejecutivo** - KPIs y rankings
2. **Análisis de Costos** - Detalle por financiador y promedios generales
3. **Historial** - Lista completa de presupuestos

---

## 🎯 Tab 1: Resumen Ejecutivo

### KPIs Principales (5 Cards)

#### 1. Facturación Total
**Cálculo:**
```sql
SUM(total_facturar) 
FROM presupuestos
WHERE es_ultima_version = 1
  AND estado NOT IN ('borrador')
  AND [filtro_periodo]
```

**Descripción:** Suma total de todos los valores a facturar de presupuestos aprobados o aprobados condicionales en el período seleccionado.

**Formato:** Moneda argentina ($ 1.234.567)

---

#### 2. Rentabilidad Promedio
**Cálculo:**
```sql
AVG(rentabilidad)
FROM presupuestos
WHERE es_ultima_version = 1
  AND estado NOT IN ('borrador')
  AND [filtro_periodo]
```

**Fórmula de rentabilidad (calculada en presupuesto):**
```
rentabilidad = ((total_facturar - costo_total) / costo_total) * 100
```

**Descripción:** Promedio de rentabilidad de todos los presupuestos del período.

**Formato:** Porcentaje con 1 decimal (25.5%)

**Colores:**
- Verde: ≥ 30%
- Amarillo: ≥ 15% y < 30%
- Rojo: < 15%

---

#### 3. Tasa de Aprobación
**Cálculo:**
```javascript
const total_presupuestos = COUNT(*) WHERE estado NOT IN ('borrador')
const total_aprobados = COUNT(*) WHERE estado IN ('aprobado', 'aprobado_condicional')
tasa_aprobacion = (total_aprobados / total_presupuestos) * 100
```

**Descripción:** Porcentaje de presupuestos que fueron aprobados (incluye aprobación condicional) sobre el total de presupuestos que pasaron por auditoría.

**Formato:** Porcentaje con 1 decimal (85.3%)

---

#### 4. Tiempo Auditoría Promedio
**Cálculo:**
```sql
AVG(TIMESTAMPDIFF(HOUR, fecha_primera_auditoria, fecha_aprobacion))
FROM (
  SELECT 
    MIN(a.fecha) as fecha_primera_auditoria,
    MAX(CASE WHEN p.estado IN ('aprobado', 'aprobado_condicional') 
        THEN p.updated_at END) as fecha_aprobacion
  FROM presupuestos p
  INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
  WHERE p.estado IN ('aprobado', 'aprobado_condicional')
  GROUP BY p.idPresupuestos
)
```

**Descripción:** Tiempo promedio en horas desde que un presupuesto entra a auditoría (primera entrada en `auditorias_presupuestos`) hasta que es aprobado. **NO incluye el tiempo en estado borrador**.

**Formato:** Horas con 1 decimal (24.5h)

**Nota importante:** Solo considera presupuestos aprobados, excluye rechazados y observados.

---

#### 5. Utilidad Total
**Cálculo:**
```sql
SUM(total_facturar - costo_total)
FROM presupuestos
WHERE es_ultima_version = 1
  AND estado NOT IN ('borrador')
  AND [filtro_periodo]
```

**Descripción:** Suma de la diferencia entre lo facturado y el costo total de todos los presupuestos del período.

**Formato:** Moneda argentina ($ 1.234.567)

---

### Ranking por Financiador (Top 10)

**Consulta:**
```sql
SELECT 
  f.Financiador,
  COUNT(p.idPresupuestos) as total_presupuestos,
  SUM(p.total_facturar) as facturacion_total,
  AVG(p.rentabilidad) as rentabilidad_promedio,
  COALESCE(f.dias_cobranza_real, f.dias_cobranza_teorico, 30) as dias_cobranza,
  fa.nombre as acuerdo
FROM presupuestos p
INNER JOIN financiador f ON p.idobra_social = f.idobra_social
LEFT JOIN financiador_acuerdo fa ON f.id_acuerdo = fa.id_acuerdo
WHERE p.es_ultima_version = 1
  AND p.estado IN ('aprobado', 'aprobado_condicional')
  AND [filtro_periodo]
GROUP BY f.idobra_social
ORDER BY facturacion_total DESC
LIMIT 10
```

**Columnas:**
1. **Financiador** - Nombre de la obra social
2. **Presupuestos** - Cantidad total de presupuestos aprobados
3. **Facturación** - Suma total facturada
4. **Rent%** - Rentabilidad promedio (con colores)
5. **Días Cobranza** - Días promedio de cobranza (real > teórico > 30 default)
6. **Acuerdo** - Tipo de acuerdo comercial

**Ordenamiento:** Por facturación total descendente

**Uso:** Identificar financiadores más rentables y con mejor volumen de negocio.

---

### Ranking por Sucursal

**Consulta:**
```sql
SELECT 
  s.Sucursales_mh as sucursal,
  COUNT(p.idPresupuestos) as total_presupuestos,
  SUM(p.total_facturar) as facturacion_total,
  AVG(p.rentabilidad) as rentabilidad_promedio,
  AVG(p.total_facturar) as ticket_promedio,
  SUM(CASE WHEN p.estado IN ('aprobado', 'aprobado_condicional') THEN 1 ELSE 0 END) as total_aprobados
FROM presupuestos p
INNER JOIN sucursales_mh s ON p.sucursal_id = s.ID
WHERE p.es_ultima_version = 1
  AND p.estado NOT IN ('borrador')
  AND [filtro_periodo]
GROUP BY p.sucursal_id
ORDER BY facturacion_total DESC
```

**Columnas:**
1. **Sucursal** - Nombre de la sucursal
2. **Presupuestos** - Cantidad total de presupuestos
3. **Facturación** - Suma total facturada
4. **Rent%** - Rentabilidad promedio (con colores)
5. **Ticket Prom** - Valor promedio por presupuesto
6. **Aprobación%** - Tasa de aprobación de la sucursal

**Cálculo Tasa Aprobación:**
```javascript
tasa_aprobacion = (total_aprobados / total_presupuestos) * 100
```

**Ordenamiento:** Por facturación total descendente

**Uso:** Comparar performance entre sucursales y detectar oportunidades de mejora.

---

## 💰 Tab 2: Análisis de Costos

### Filtros Disponibles

1. **Período** - Mes actual, Trimestre, Año, Últimos 6 meses, Todo
2. **Financiador** - Selector con búsqueda (sin opción "Todos")
3. **Servicio** - Selector con búsqueda (incluye "Todos")

**Comportamiento de Filtros:**
- Al seleccionar un **Financiador**, el selector de **Servicios** se recarga automáticamente mostrando SOLO los servicios que ese financiador tiene en el período seleccionado
- Al cambiar el **Período**, los servicios se recargan para ese nuevo período
- Si se limpia el **Financiador**, se muestran todos los servicios disponibles

---

### Tabla 1: Detalle por Financiador

**Consulta:**
```sql
SELECT 
  f.Financiador,
  s.nombre as servicio,
  s.tipo_unidad,
  COUNT(pp.id) as veces_usado,
  AVG(pp.valor_asignado) as valor_asignado_promedio,
  AVG(pp.valor_facturar) as valor_facturar_promedio,
  AVG((pp.valor_facturar - pp.valor_asignado) / pp.valor_asignado * 100) as margen_promedio,
  MAX(p.created_at) as ultima_vez_usado
FROM presupuesto_prestaciones pp
INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
INNER JOIN financiador f ON p.idobra_social = f.idobra_social
WHERE p.estado IN ('aprobado', 'aprobado_condicional')
  AND p.es_ultima_version = 1
  AND [filtro_periodo]
  AND [filtro_financiador]  -- Opcional
  AND [filtro_servicio]     -- Opcional
GROUP BY f.idobra_social, s.id_servicio
ORDER BY veces_usado DESC
LIMIT 50
```

**Columnas:**
1. **Servicio** - Nombre del servicio/prestación
2. **Financiador** - Obra social
3. **Tipo Unidad** - Tipo de unidad del servicio (consultas, sesiones, etc.)
4. **Veces Usado** - Cantidad de veces que se usó esa combinación financiador-servicio
5. **Valor Asignado Prom** - Promedio del costo negociado con el prestador
6. **Valor Facturar Prom** - Promedio del valor facturado al financiador
7. **Margen%** - Rentabilidad promedio de esa combinación
8. **Última Vez** - Fecha del último presupuesto que usó esa combinación

**Cálculo Margen:**
```javascript
margen = ((valor_facturar - valor_asignado) / valor_asignado) * 100
```

**Uso:** 
- Analizar qué servicios son más rentables por financiador
- Identificar oportunidades de renegociación de precios
- Detectar servicios con márgenes bajos que requieren atención

---

### Tabla 2: Promedios Generales por Servicio

**Consulta:**
```sql
SELECT 
  s.nombre as servicio,
  s.tipo_unidad,
  COUNT(pp.id) as veces_usado,
  AVG(pp.valor_asignado) as valor_asignado_promedio,
  AVG(pp.valor_facturar) as valor_facturar_promedio,
  AVG((pp.valor_facturar - pp.valor_asignado) / pp.valor_asignado * 100) as margen_promedio
FROM presupuesto_prestaciones pp
INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
WHERE p.estado IN ('aprobado', 'aprobado_condicional')
  AND p.es_ultima_version = 1
  AND [filtro_periodo]
  AND [filtro_servicio]  -- Opcional
GROUP BY s.id_servicio
ORDER BY veces_usado DESC
LIMIT 50
```

**Columnas:**
1. **Servicio** - Nombre del servicio (en negrita)
2. **Tipo Unidad** - Tipo de unidad
3. **Veces Usado** - Total de usos en TODOS los financiadores (en negrita)
4. **Valor Asignado Prom** - Promedio general de costos (en negrita)
5. **Valor Facturar Prom** - Promedio general de facturación (en negrita)
6. **Margen%** - Rentabilidad promedio general (en negrita y color)

**Diferencia con Tabla 1:**
- **NO agrupa por financiador** - Muestra promedios de TODOS los financiadores
- **Ignora el filtro de financiador** - Siempre calcula sobre todos
- **Respeta el filtro de servicio** - Si se selecciona un servicio, solo muestra ese

**Uso:**
- Comparar el rendimiento de un financiador específico vs el promedio del mercado
- Identificar servicios con alta demanda general
- Detectar oportunidades de mejora en precios

---

## 📋 Tab 3: Historial

Reutiliza el componente `ListaPresupuestos` con:
- `esAuditor={true}` - Muestra todos los presupuestos sin restricciones
- Filtros estándar de la lista
- Acceso a modal de detalle completo

---

## 🔄 Filtros de Período

### Opciones Disponibles

1. **Mes Actual**
   ```sql
   YEAR(created_at) = [año_actual] AND MONTH(created_at) = [mes_actual]
   ```

2. **Trimestre Actual**
   ```sql
   YEAR(created_at) = [año_actual] 
   AND MONTH(created_at) BETWEEN [mes_inicio_trimestre] AND [mes_fin_trimestre]
   ```
   - Trimestre se calcula: `Math.floor(mes / 3)`
   - Q1: Enero-Marzo (1-3)
   - Q2: Abril-Junio (4-6)
   - Q3: Julio-Septiembre (7-9)
   - Q4: Octubre-Diciembre (10-12)

3. **Año Actual**
   ```sql
   YEAR(created_at) = [año_actual]
   ```

4. **Últimos 6 Meses**
   ```sql
   created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
   ```

5. **Todo**
   ```sql
   -- Sin filtro de fecha
   ```

---

## 🎨 Códigos de Color

### Rentabilidad/Margen
- **Verde** (#40c057): ≥ 30% - Excelente rentabilidad
- **Amarillo** (#fab005): ≥ 15% y < 30% - Rentabilidad aceptable
- **Rojo** (red): < 15% - Rentabilidad baja, requiere atención

### Iconos por Sección
- **Facturación**: BanknotesIcon (#228be6 - Azul)
- **Rentabilidad**: ArrowTrendingUpIcon (#40c057 - Verde)
- **Tasa Aprobación**: CheckCircleIcon (#fab005 - Amarillo)
- **Tiempo Auditoría**: ClockIcon (#fd7e14 - Naranja)
- **Utilidad**: BanknotesIcon (#20c997 - Verde agua)

---

## 🔐 Control de Acceso

### Middleware de Autenticación
```typescript
requireGerenciaFinanciera
```

**Roles con acceso:**
- `gerencia_financiera` - Acceso completo
- `admin` - Acceso completo

**Rutas protegidas:**
- `/api/reportes/financiero/kpis`
- `/api/reportes/financiero/ranking-financiadores`
- `/api/reportes/financiero/ranking-sucursales`
- `/api/reportes/financiero/analisis-costos`
- `/api/reportes/financiero/promedios-generales`
- `/api/reportes/financiero/servicios-por-financiador`

---

## 📊 Casos de Uso

### 1. Análisis de Rentabilidad por Financiador
**Objetivo:** Identificar qué financiadores son más rentables

**Pasos:**
1. Ir a "Resumen Ejecutivo"
2. Revisar "Ranking por Financiador"
3. Ordenar mentalmente por Rent%
4. Identificar financiadores con rentabilidad < 15% (rojos)

**Acción:** Renegociar precios o revisar costos con esos financiadores

---

### 2. Comparación de Servicio entre Financiadores
**Objetivo:** Ver cómo varía el margen de un servicio específico entre financiadores

**Pasos:**
1. Ir a "Análisis de Costos"
2. Seleccionar un servicio específico (ej: "Consulta especialista")
3. NO seleccionar financiador
4. Revisar Tabla 1: Ver margen por cada financiador
5. Revisar Tabla 2: Ver promedio general del mercado

**Acción:** Identificar financiadores que pagan por debajo del promedio

---

### 3. Análisis de Performance de Sucursal
**Objetivo:** Evaluar qué sucursales tienen mejor performance

**Pasos:**
1. Ir a "Resumen Ejecutivo"
2. Revisar "Ranking por Sucursal"
3. Comparar:
   - Facturación total
   - Rentabilidad promedio
   - Tasa de aprobación
   - Ticket promedio

**Acción:** Replicar mejores prácticas de sucursales top en las de menor performance

---

### 4. Identificar Servicios Más Usados
**Objetivo:** Detectar servicios con alta demanda para negociar mejores precios

**Pasos:**
1. Ir a "Análisis de Costos"
2. Seleccionar "Todo" en período
3. NO seleccionar financiador ni servicio
4. Revisar Tabla 2: "Promedios Generales"
5. Ordenar mentalmente por "Veces Usado"

**Acción:** Negociar descuentos por volumen en servicios más usados

---

## 🔧 Arquitectura Técnica

### Backend

**Service:** `ReportesFinancierosService`
- `obtenerKPIs(periodo)` - Calcula 5 KPIs principales
- `obtenerRankingFinanciadores(periodo)` - Top 10 financiadores
- `obtenerRankingSucursales(periodo)` - Ranking de sucursales
- `obtenerAnalisisCostos(financiadorId?, servicioId?, periodo)` - Detalle por financiador
- `obtenerPromediosGenerales(servicioId?, periodo)` - Promedios sin agrupar por financiador
- `obtenerServiciosPorFinanciador(financiadorId, periodo)` - Servicios filtrados
- `getWhereClausePeriodo(periodo, useAlias)` - Helper para filtros de fecha

**Controller:** `reportesFinancierosController`
- Orquesta llamadas al service
- Maneja query params
- Retorna JSON

**Routes:** `/api/reportes/financiero/*`
- Protegidas con `requireGerenciaFinanciera`
- 6 endpoints GET

---

### Frontend

**Componente:** `GerenciaFinanciera.tsx`

**Estados:**
```typescript
- kpis: KPIs principales
- rankingFinanciadores: Top 10 financiadores
- rankingSucursales: Ranking sucursales
- analisisCostos: Detalle por financiador
- promediosGenerales: Promedios sin financiador
- financiadores: Lista de financiadores
- servicios: Lista de servicios (dinámica)
- filtroFinanciador: Financiador seleccionado
- filtroServicio: Servicio seleccionado
- periodo: Período seleccionado
```

**Efectos:**
```typescript
// Cargar financiadores al montar
useEffect(() => cargarFinanciadores(), [])

// Cargar servicios cuando cambia financiador o período
useEffect(() => cargarServicios(), [filtroFinanciador, periodo])

// Cargar datos cuando cambia tab, período o filtros
useEffect(() => {
  if (activeTab === 'resumen') cargarResumen()
  if (activeTab === 'analisis') cargarAnalisisCostos()
}, [activeTab, periodo, filtroFinanciador, filtroServicio])
```

**Funciones de Formato:**
```typescript
formatCurrency(value) // $ 1.234.567
formatPercent(value)  // 25.5%
```

---

## 📈 Optimizaciones

### Índices de Base de Datos Recomendados
```sql
-- Presupuestos
CREATE INDEX idx_presupuestos_estado_version ON presupuestos(estado, es_ultima_version);
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);
CREATE INDEX idx_presupuestos_financiador ON presupuestos(idobra_social);
CREATE INDEX idx_presupuestos_sucursal ON presupuestos(sucursal_id);

-- Prestaciones
CREATE INDEX idx_prestaciones_presupuesto ON presupuesto_prestaciones(idPresupuestos);
CREATE INDEX idx_prestaciones_servicio ON presupuesto_prestaciones(id_servicio);

-- Auditorías
CREATE INDEX idx_auditorias_presupuesto ON auditorias_presupuestos(presupuesto_id);
CREATE INDEX idx_auditorias_fecha ON auditorias_presupuestos(fecha);
```

### Límites de Resultados
- Rankings: Top 10
- Análisis de costos: Top 50 por uso
- Promedios generales: Top 50 por uso

---

## 🐛 Troubleshooting

### Error: "Column 'created_at' is ambiguous"
**Causa:** Consulta con múltiples tablas que tienen `created_at`
**Solución:** Usar `p.created_at` con alias de tabla

### Error: "Acceso denegado"
**Causa:** Usuario sin rol `gerencia_financiera`
**Solución:** Verificar rol en tabla `usuarios`

### Servicios no se cargan al seleccionar financiador
**Causa:** Endpoint `/servicios-por-financiador` no responde
**Solución:** Verificar que el backend esté corriendo y la ruta esté registrada

### KPIs muestran 0
**Causa:** No hay presupuestos aprobados en el período
**Solución:** Cambiar período o verificar que existan presupuestos aprobados

---

## 📝 Notas Importantes

1. **Solo presupuestos aprobados:** Todos los cálculos usan `estado IN ('aprobado', 'aprobado_condicional')`
2. **Solo última versión:** Filtro `es_ultima_version = 1` evita duplicados
3. **Excluye borradores:** Los KPIs no consideran presupuestos en borrador
4. **Tiempo de auditoría:** Se calcula desde primera auditoría, NO desde creación del presupuesto
5. **Filtros dinámicos:** Los servicios se recargan automáticamente al cambiar financiador o período
6. **Tabla de promedios:** Ignora el filtro de financiador para mostrar promedios generales del mercado

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Sistema Presupuestador Web
