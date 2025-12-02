# Análisis de Base de Datos - Problemas Identificados

## 🔴 PROBLEMAS CRÍTICOS

### 1. Inconsistencias en Tipos de Datos

#### Tabla `presupuestos`
- ❌ `total_insumos`: INT (debería ser DECIMAL(10,2))
- ❌ `total_prestaciones`: INT (debería ser DECIMAL(10,2))
- ❌ `costo_total`: INT (debería ser DECIMAL(10,2))
- ❌ `DNI`: INT (debería ser VARCHAR para manejar DNI con letras/extranjeros)

#### Tabla `insumos`
- ❌ `costo`: INT (debería ser DECIMAL(10,2))
- ❌ `producto`: PK compuesta innecesaria (solo debería ser idInsumos)

#### Tabla `sucursales_mh`
- ❌ `Sucursales_mh`: PK compuesta innecesaria (solo debería ser ID)

### 2. Foreign Keys Faltantes

#### Tabla `presupuestos`
- ❌ `idobra_social` → No tiene FK a `financiador(idobra_social)`
- ❌ `Sucursal` → No tiene FK a `sucursales_mh` (usa nombre en lugar de ID)

#### Tabla `presupuesto_prestaciones`
- ❌ `id_servicio` → No tiene FK a `servicios(id_servicio)` (es VARCHAR debería ser INT)

#### Tabla `insumos`
- ⚠️ No tiene relación con ninguna tabla (tabla maestra sin FK)

### 3. Problemas de Diseño

#### Duplicación de Datos
- `presupuestos.Sucursal` almacena NOMBRE en lugar de ID
- `presupuesto_prestaciones.prestacion` duplica nombre del servicio
- `presupuesto_insumos.producto` duplica nombre del insumo

#### Campos Calculados Almacenados
- `presupuestos.total_insumos` (se puede calcular)
- `presupuestos.total_prestaciones` (se puede calcular)
- `presupuestos.costo_total` (se puede calcular)
- `presupuestos.total_facturar` (se puede calcular)
- `presupuestos.rentabilidad` (se puede calcular)

### 4. Índices Faltantes

```sql
-- Índices recomendados para mejorar performance
presupuestos.estado
presupuestos.es_ultima_version
presupuestos.created_at
notificaciones.estado
notificaciones.creado_en
```

## ✅ SOLUCIÓN PROPUESTA

### Orden de Ejecución para Backup/Restore

1. **Tablas Maestras (sin FK)**
   - usuarios
   - sucursales_mh
   - financiador_acuerdo
   - financiador
   - servicios
   - insumos

2. **Tablas con FK Simples**
   - prestador_servicio (FK: financiador, servicios)
   - prestador_servicio_valores (FK: prestador_servicio)

3. **Tabla Principal de Negocio**
   - presupuestos (FK: usuarios, sucursales_mh, financiador, presupuestos)

4. **Tablas Dependientes de Presupuestos**
   - presupuesto_insumos (FK: presupuestos)
   - presupuesto_prestaciones (FK: presupuestos)
   - auditorias_presupuestos (FK: presupuestos, usuarios)
   - notificaciones (FK: presupuestos, usuarios)

### Cambios Recomendados

#### CRÍTICOS (Afectan integridad)
1. Agregar FK `presupuestos.idobra_social` → `financiador.idobra_social`
2. Cambiar `presupuestos.Sucursal` de VARCHAR a INT con FK a `sucursales_mh.ID`
3. Cambiar `presupuesto_prestaciones.id_servicio` de VARCHAR(50) a INT con FK
4. Cambiar tipos INT a DECIMAL para campos monetarios

#### RECOMENDADOS (Mejoran diseño)
1. Eliminar campos calculados de `presupuestos` (calcular en queries)
2. Agregar índices para mejorar performance
3. Normalizar nombres de columnas (snake_case consistente)

## 📋 SCRIPT DE MIGRACIÓN

Ver: `reorganizar_base_datos.sql`
