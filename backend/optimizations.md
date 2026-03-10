# Reporte de Optimizaciones de Base de Datos - Backend

Este documento detalla las oportunidades de optimización identificadas en el backend, enfocándose principalmente en el rendimiento de las consultas SQL, la escalabilidad y la eficiencia de los recursos.

## 1. Optimización en Cálculos de Presupuesto (`PresupuestoCalculosService`)

### Problema: Exceso de Roundtrips (N+1 implícito)
El método `recalcularTotales` ejecuta 6 consultas secuenciales a la base de datos cada vez que se llama. Esto introduce una latencia significativa debido al tiempo de ida y vuelta (RTT) entre el servidor de aplicaciones y la base de datos.

**Archivo:** `src/services/presupuestoCalculosService.ts`

**Código Actual:**
```typescript
const [insumos] = await pool.query(...);
const [prestacionesConvenio] = await pool.query(...);
const [prestacionesTarifario] = await pool.query(...);
const [equipamiento] = await pool.query(...);
const [presupuesto] = await pool.query(...);
// ... cálculos en memoria ...
await pool.query('UPDATE ...');
```

**Solución Propuesta:**
Consolidar las lecturas en una sola consulta utilizando `LEFT JOIN` con subconsultas de agregación (para evitar la explosión de filas producto cartesiano) o utilizar una transacción con una única conexión para reducir el overhead de obtener conexiones del pool repetidamente.

**Query Optimizada Sugerida (Concepto):**
```sql
UPDATE presupuestos p
LEFT JOIN (
    SELECT idPresupuestos, SUM(costo * cantidad) as total_insumos_costo, SUM(precio_facturar * cantidad) as total_insumos_facturar
    FROM presupuesto_insumos GROUP BY idPresupuestos
) i ON p.idPresupuestos = i.idPresupuestos
-- ... otros joins para prestaciones y equipamiento ...
SET 
    p.total_insumos = COALESCE(i.total_insumos_facturar, 0),
    p.costo_total = COALESCE(i.total_insumos_costo, 0) + ...
WHERE p.idPresupuestos = ?
```
*Alternativamente, si se prefiere mantener la lógica en aplicación, usar `Promise.all` para ejecutar los SELECTs en paralelo.*

## 2. Ineficiencia en Filtros de Fechas (`ReportesFinancierosService`)

### Problema: Uso de funciones en columnas indexadas (SARGable)
El uso de funciones como `YEAR(col)` y `MONTH(col)` en la cláusula `WHERE` impide que MySQL utilice índices en la columna de fecha (`created_at` o `updated_at`). Esto obliga a la base de datos a realizar un "Full Table Scan", revisando cada fila de la tabla.

**Archivo:** `src/services/reportesFinancierosService.ts`

**Código Actual:**
```sql
WHERE YEAR(p.created_at) = 2024 AND MONTH(p.created_at) = 2
```

**Solución Propuesta:**
Reemplazar por rangos de fechas. Esto permite el uso de índices.

**Query Optimizada:**
```sql
WHERE p.created_at >= '2024-02-01 00:00:00' AND p.created_at < '2024-03-01 00:00:00'
```
*Se recomienda refactorizar `getWhereClausePeriodo` para devolver rangos de fechas.*

## 3. Problema de Escalabilidad en Insumos (`AdminInsumosService`)

### Problema: Carga de todos los registros sin paginación
El método `obtenerTodos` recupera **todos** los insumos de la base de datos sin límite. A medida que crezca el catálogo de insumos, esta consulta consumirá excesiva memoria y tiempo, pudiendo bloquear el event loop de Node.js al procesar una lista enorme.

**Archivo:** `src/services/adminInsumosService.ts`

**Código Actual:**
```sql
SELECT ... FROM insumos ORDER BY producto
```

**Solución Propuesta:**
Implementar paginación (LIMIT y OFFSET), similar a como se hace en `UsuariosService`.

## 4. Índices Faltantes (Revisión General)

Basado en las consultas observadas, se recomienda verificar e implementar los siguientes índices en la base de datos para acelerar los `JOIN` y `WHERE`:

*   **Tabla `presupuestos`**:
    *   `INDEX(financiador_id)`: Para JOINs con `financiador`.
    *   `INDEX(sucursal_id)`: Para JOINs con `sucursales_mh`.
    *   `INDEX(es_ultima_version, estado)`: Filtro muy común en reportes.
    *   `INDEX(created_at)`: Para reportes por fecha.

*   **Tablas de detalle (`presupuesto_insumos`, `presupuesto_prestaciones`, etc.)**:
    *   `INDEX(idPresupuestos)`: Crítico para calcular totales rápidamente (usado en todos los cálculos).

## 5. Optimización de Conteo (`COUNT`)

En `ReportesFinancierosService`, se utiliza `COUNT(*)` junto con otras sumas. Si el objetivo es solo verificar existencia o contar, asegúrese de que esta operación esté dentro de una transacción si depende de la consistencia de los datos calculados previamente, para evitar condiciones de carrera.

## 6. Recomendación de Seguridad y Performance

En `PresupuestoRepository.ts`, método `actualizarTotales`, se actualizan muchos campos. Asegúrese de que esta operación esté dentro de una transacción si depende de la consistencia de los datos calculados previamente.

---

### Resumen de Prioridades

1.  **Alta:** Refactorizar `PresupuestoCalculosService.recalcularTotales` (mejora inmediata de tiempos de respuesta al guardar/editar).
2.  **Alta:** Corregir filtros de fecha en `ReportesFinancierosService` (evita colapso de reportes con muchos datos).
3.  **Media:** Agregar paginación en `AdminInsumosService`.
4.  **Media:** Crear índices sugeridos en base de datos.
