# Database Schema Reference

## Overview
This file contains the complete MySQL database schema for the presupuestador-web system. Always reference this schema when working with database queries, migrations, or data models.

## Source
Schema extracted from `Tablas-full2.csv` - Complete structure of all MySQL tables.

## Important Notes
- **ALWAYS** verify column names, types, and constraints against this schema before writing queries
- **ALWAYS** check foreign key relationships before creating or modifying data
- **ALWAYS** respect nullable constraints and default values
- **ALWAYS** use the correct data types (especially DECIMAL precision for monetary values)

## Tables

### alertas_servicios
Alertas configurables por tipo de unidad de servicio.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| tipo_unidad | varchar(50) | NO | NULL | UNI | | FK → tipos_unidad.nombre |
| cantidad_maxima | decimal(10,2) | NO | NULL | | | |
| mensaje_alerta | text | YES | NULL | | | |
| color_alerta | varchar(20) | YES | orange | | | |
| activo | tinyint | YES | 1 | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `tipo_unidad` → `tipos_unidad.nombre`

---

### auditorias_presupuestos
Registro de auditoría de todas las transiciones de estado de presupuestos.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| presupuesto_id | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| version_presupuesto | int | NO | NULL | | | |
| auditor_id | int | NO | NULL | MUL | | FK → usuarios.id |
| estado_anterior | varchar(50) | YES | NULL | | | |
| estado_nuevo | varchar(50) | YES | NULL | | | |
| comentario | text | YES | NULL | | | |
| fecha | datetime | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `presupuesto_id` → `presupuestos.idPresupuestos`
- `auditor_id` → `usuarios.id`

---

### configuracion_sistema
Configuración del sistema (reglas de negocio, umbrales, etc.).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| clave | varchar(100) | NO | NULL | UNI | | |
| valor | decimal(10,2) | NO | NULL | | | |
| descripcion | varchar(255) | YES | NULL | | | |
| categoria | varchar(50) | YES | NULL | MUL | | |
| unidad | varchar(20) | YES | NULL | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

---

### equipamientos
Catálogo de equipamientos médicos.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(255) | NO | NULL | | | |
| descripcion | text | YES | NULL | | | |
| tipo_equipamiento_id | int | YES | NULL | MUL | | FK → tipos_equipamiento.id |
| precio_referencia | decimal(10,2) | YES | 0.00 | | | Precio por defecto si no hay acuerdo |
| unidad_tiempo | enum('mensual','diario','semanal') | YES | mensual | | | |
| activo | tinyint(1) | YES | 1 | MUL | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |
| codigo_producto | varchar(50) | YES | NULL | MUL | | Código de producto para sincronización externa (EAN, SKU) |

**Foreign Keys:**
- `tipo_equipamiento_id` → `tipos_equipamiento.id`

---

### financiador
Catálogo de financiadores (obras sociales, prepagas, etc.).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| Financiador | varchar(250) | YES | NULL | | | |
| activo | tinyint | YES | 1 | | | |
| tasa_mensual | decimal(5,2) | YES | NULL | | | Tasa mensual en porcentaje |
| dias_cobranza_teorico | int | YES | NULL | | | Días de cobranza teóricos según política |
| dias_cobranza_real | int | YES | NULL | | | Días de cobranza reales calculados |
| id_acuerdo | int | YES | NULL | MUL | | FK → financiador_acuerdo.id_acuerdo |
| porcentaje_insumos | decimal(5,2) | YES | 0.00 | | | Porcentaje adicional para cálculo de insumos (se suma al % base) |

**Foreign Keys:**
- `id_acuerdo` → `financiador_acuerdo.id_acuerdo`

---

### financiador_acuerdo
Tipos de acuerdos con financiadores.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id_acuerdo | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(150) | NO | NULL | UNI | | Nombre del tipo de acuerdo |

---

### financiador_equipamiento
Relación entre financiadores y equipamientos (acuerdos).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| financiador_id | int | NO | NULL | MUL | | FK → financiador.id |
| id_equipamiento | int | NO | NULL | MUL | | FK → equipamientos.id |
| activo | tinyint(1) | YES | 1 | MUL | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `financiador_id` → `financiador.id`
- `id_equipamiento` → `equipamientos.id`

---

### financiador_equipamiento_valores
Valores históricos de equipamientos por financiador y sucursal.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| id_financiador_equipamiento | int | NO | NULL | MUL | | FK → financiador_equipamiento.id |
| valor_asignado | decimal(10,2) | NO | NULL | | | Costo del equipamiento |
| valor_facturar | decimal(10,2) | NO | NULL | | | Precio a facturar |
| fecha_inicio | date | NO | NULL | MUL | | |
| fecha_fin | date | YES | NULL | MUL | | |
| sucursal_id | int | YES | NULL | MUL | | NULL = todas las sucursales, FK → sucursales_mh.ID |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `id_financiador_equipamiento` → `financiador_equipamiento.id`
- `sucursal_id` → `sucursales_mh.ID`

---

### financiador_servicio
Relación entre financiadores y servicios (acuerdos).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| financiador_id | int | NO | NULL | MUL | | FK → financiador.id |
| id_servicio | int | NO | NULL | MUL | | FK → servicios.id_servicio |
| valor_facturar | decimal(10,2) | NO | NULL | | | |
| total_mes | decimal(10,2) | YES | NULL | | | |
| condicion | text | YES | NULL | | | |
| activo | tinyint | YES | 1 | | | |
| cant_total | int | YES | NULL | | | |
| valor_sugerido | decimal(10,2) | YES | NULL | | | Valor recomendado |

**Foreign Keys:**
- `financiador_id` → `financiador.id`
- `id_servicio` → `servicios.id_servicio`

---

### financiador_servicio_valores
Valores históricos de servicios por financiador y sucursal (sistema timelapse).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| financiador_servicio_id | int | NO | NULL | MUL | | FK → financiador_servicio.id |
| sucursal_id | int | YES | NULL | MUL | | NULL = todas las sucursales, FK → sucursales_mh.ID |
| valor_asignado | decimal(10,2) | NO | NULL | | | |
| valor_facturar | decimal(10,2) | NO | NULL | | | |
| fecha_inicio | date | NO | NULL | MUL | | |
| fecha_fin | date | YES | NULL | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `financiador_servicio_id` → `financiador_servicio.id`
- `sucursal_id` → `sucursales_mh.ID`

---

### insumos
Catálogo de insumos médicos.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| idInsumos | int | NO | NULL | PRI | auto_increment | |
| producto | varchar(255) | NO | NULL | UNI | | |
| costo | decimal(10,2) | YES | 0.00 | | | |
| codigo_producto | varchar(50) | YES | NULL | MUL | | Código de producto para sincronización externa (EAN, SKU) |
| fecha_actualizacion | datetime | YES | CURRENT_TIMESTAMP | MUL | on update CURRENT_TIMESTAMP | Última actualización del precio |
| critico | tinyint(1) | NO | 0 | MUL | | Insumo crítico que fuerza auditoría obligatoria |

---

### notificaciones
Sistema de notificaciones para usuarios.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| usuario_id | int | NO | NULL | MUL | | FK → usuarios.id |
| presupuesto_id | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| version_presupuesto | int | YES | 1 | | | |
| tipo | varchar(50) | NO | NULL | | | |
| mensaje | varchar(512) | YES | NULL | | | |
| estado | enum('nuevo','leido') | YES | nuevo | MUL | | |
| creado_en | datetime | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `usuario_id` → `usuarios.id`
- `presupuesto_id` → `presupuestos.idPresupuestos`

---

### presupuesto_equipamiento
Equipamientos incluidos en un presupuesto.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| idPresupuestos | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| id_equipamiento | int | NO | NULL | MUL | | FK → equipamientos.id |
| nombre | varchar(255) | NO | NULL | | | |
| tipo | varchar(50) | YES | NULL | | | |
| cantidad | int | NO | 1 | | | |
| costo | decimal(10,2) | NO | NULL | | | Precio usado: acuerdo o manual |
| precio_facturar | decimal(10,2) | NO | NULL | | | Precio final |
| tiene_acuerdo | tinyint(1) | YES | 0 | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `idPresupuestos` → `presupuestos.idPresupuestos`
- `id_equipamiento` → `equipamientos.id`

---

### presupuesto_insumos
Insumos incluidos en un presupuesto.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| idPresupuestos | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| producto | varchar(255) | NO | NULL | | | |
| costo | decimal(10,2) | NO | NULL | | | |
| precio_facturar | decimal(10,2) | NO | 0.00 | | | |
| cantidad | int | NO | NULL | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |
| id_insumo | int | YES | NULL | MUL | | FK → insumos.idInsumos |

**Foreign Keys:**
- `idPresupuestos` → `presupuestos.idPresupuestos`
- `id_insumo` → `insumos.idInsumos`

---

### presupuesto_prestaciones
Prestaciones (servicios) incluidas en un presupuesto.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| idPresupuestos | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| id_servicio | varchar(50) | NO | NULL | | | |
| prestacion | varchar(255) | NO | NULL | | | |
| cantidad | int | NO | NULL | | | |
| valor_asignado | decimal(10,2) | NO | NULL | | | |
| valor_facturar | decimal(10,2) | NO | 0.00 | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `idPresupuestos` → `presupuestos.idPresupuestos`

---

### presupuesto_prestaciones_tarifario
Servicios del tarifario interno incluidos en un presupuesto (separado de convenios).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| idPresupuestos | int | NO | NULL | MUL | | FK → presupuestos.idPresupuestos |
| tarifario_servicio_id | int | NO | NULL | MUL | | FK → tarifario_servicio.id |
| prestacion | varchar(255) | NO | NULL | | | Nombre del servicio |
| cantidad | int | NO | NULL | | | Cantidad de unidades |
| zona_id | int | NO | NULL | MUL | | FK → tarifario_zonas.id |
| orden_costo | tinyint | NO | NULL | MUL | | Orden del costo usado (1-5) |
| valor_asignado | decimal(10,2) | NO | NULL | | | Costo prestacional |
| valor_facturar | decimal(10,2) | NO | NULL | | | Valor con markup aplicado |
| fuera_tarifario | tinyint(1) | YES | 0 | MUL | | Usuario editó costo manualmente |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `idPresupuestos` → `presupuestos.idPresupuestos`
- `tarifario_servicio_id` → `tarifario_servicio.id`
- `zona_id` → `tarifario_zonas.id`

---

### presupuestos
Tabla principal de presupuestos con sistema de versionado.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| idPresupuestos | int | NO | NULL | PRI | auto_increment | |
| Nombre_Apellido | varchar(45) | YES | NULL | | | |
| DNI | varchar(20) | NO | NULL | MUL | | |
| sucursal_id | int | YES | NULL | MUL | | |
| zona_id | int | YES | NULL | MUL | | FK → tarifario_zonas.id |
| total_insumos | decimal(10,2) | YES | 0.00 | | | |
| dificil_acceso | varchar(2) | NO | NULL | | | |
| total_prestaciones | decimal(10,2) | YES | 0.00 | | | |
| total_equipamiento | decimal(10,2) | YES | 0.00 | | | |
| financiador_id | int | YES | NULL | MUL | | FK → financiador.id |
| costo_total | decimal(10,2) | YES | 0.00 | | | |
| created_at | datetime | YES | CURRENT_TIMESTAMP | MUL | DEFAULT_GENERATED | |
| updated_at | datetime | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |
| total_facturar | decimal(10,2) | YES | 0.00 | | | |
| rentabilidad | decimal(5,2) | YES | 0.00 | | | |
| rentabilidad_con_plazo | decimal(5,2) | YES | NULL | | | |
| usuario_id | int | YES | NULL | MUL | | FK → usuarios.id |
| presupuesto_padre | int | YES | NULL | MUL | | FK → presupuestos.idPresupuestos (self-reference) |
| es_ultima_version | tinyint | YES | 1 | MUL | | |
| estado | enum(...) | YES | borrador | MUL | | Ver valores en sección Estados |
| resultado_auditoria | enum('aprobado','aprobado_condicional','rechazado') | YES | NULL | | | Resultado final de la auditoría (si aplica) |
| revisor_id | int | YES | NULL | MUL | | FK → usuarios.id |
| revisor_asignado_at | timestamp | YES | NULL | MUL | | |
| version | int | YES | 1 | | | |
| porcentaje_insumos | decimal(5,2) | YES | 0.00 | | | Porcentaje de margen aplicado a insumos |
| referencia_externa | varchar(255) | YES | NULL | MUL | | Referencia/ID en Softwerk para búsqueda |

**Estados posibles:**
- `borrador`
- `pendiente_administrativa`
- `en_revision_administrativa`
- `pendiente_prestacional`
- `en_revision_prestacional`
- `pendiente_general`
- `en_revision_general`
- `aprobado`
- `aprobado_condicional`
- `pendiente_carga`
- `en_carga`
- `cargado`
- `rechazado`

**Foreign Keys:**
- `financiador_id` → `financiador.id`
- `usuario_id` → `usuarios.id`
- `presupuesto_padre` → `presupuestos.idPresupuestos`
- `revisor_id` → `usuarios.id`
- `zona_id` → `tarifario_zonas.id`

---

### servicios
Catálogo de servicios médicos.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id_servicio | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(100) | NO | NULL | MUL | | |
| tipo_unidad | varchar(50) | YES | NULL | MUL | | FK → tipos_unidad.nombre |
| max_unidades_sugerido | int | YES | NULL | | | |

**Foreign Keys:**
- `tipo_unidad` → `tipos_unidad.nombre`

---

### sucursales_mh
Catálogo de sucursales.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| ID | int | NO | NULL | PRI | auto_increment | |
| Sucursales_mh | varchar(45) | NO | NULL | UNI | | |
| suc_porcentaje_dificil_acceso | int | YES | NULL | | | |
| suc_porcentaje_insumos | int | YES | NULL | | | |

---

### sucursales_tarifario_zonas
Relación entre sucursales y zonas del tarifario (N:M).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| sucursal_id | int | NO | NULL | MUL | | FK → sucursales_mh.ID |
| zona_id | int | NO | NULL | MUL | | FK → tarifario_zonas.id |
| es_zona_principal | tinyint(1) | YES | 0 | MUL | | Zona por defecto de la sucursal |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `sucursal_id` → `sucursales_mh.ID`
- `zona_id` → `tarifario_zonas.id`

---

### tarifario_servicio
Catálogo de servicios del tarifario interno.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(255) | NO | NULL | UNI | | Ej: HORA CUIDADOR, HORA ENFERMERIA ADULTO |
| descripcion | text | YES | NULL | | | |
| tipo_unidad | varchar(50) | YES | NULL | MUL | | FK → tipos_unidad.nombre |
| activo | tinyint(1) | YES | 1 | MUL | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

**Foreign Keys:**
- `tipo_unidad` → `tipos_unidad.nombre`

---

### tarifario_servicio_valores
Valores históricos de servicios del tarifario por zona (5 costos por zona).

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| tarifario_servicio_id | int | NO | NULL | MUL | | FK → tarifario_servicio.id |
| zona_id | int | NO | NULL | MUL | | FK → tarifario_zonas.id |
| costo_1 | decimal(10,2) | NO | NULL | | | Costo orden 1 (más bajo) |
| costo_2 | decimal(10,2) | NO | NULL | | | Costo orden 2 |
| costo_3 | decimal(10,2) | NO | NULL | | | Costo orden 3 |
| costo_4 | decimal(10,2) | NO | NULL | | | Costo orden 4 |
| costo_5 | decimal(10,2) | NO | NULL | | | Costo orden 5 (más alto) |
| fecha_inicio | date | NO | NULL | MUL | | Inicio de vigencia |
| fecha_fin | date | YES | NULL | | | Fin de vigencia (NULL = vigente) |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |

**Foreign Keys:**
- `tarifario_servicio_id` → `tarifario_servicio.id`
- `zona_id` → `tarifario_zonas.id`

---

### tarifario_zonas
Catálogo de zonas geográficas para tarifario.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(100) | NO | NULL | UNI | | Ej: CABA, AMBA, Centro, Reg AC |
| descripcion | text | YES | NULL | | | |
| activo | tinyint(1) | YES | 1 | MUL | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

---

### tipos_equipamiento
Tipos de equipamiento con alertas configurables.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(50) | NO | NULL | UNI | | |
| descripcion | varchar(255) | YES | NULL | | | |
| activo | tinyint(1) | YES | 1 | | | |
| activo_alerta | tinyint(1) | YES | 0 | | | |
| cantidad_maxima | int | YES | NULL | | | |
| mensaje_alerta | varchar(255) | YES | NULL | | | |
| color_alerta | varchar(20) | YES | orange | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

---

### tipos_unidad
Tipos de unidad para servicios.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| nombre | varchar(50) | NO | NULL | UNI | | |
| descripcion | varchar(255) | YES | NULL | | | |
| activo | tinyint | YES | 1 | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | | on update CURRENT_TIMESTAMP | |

---

### usuarios
Usuarios del sistema con roles.

| Column | Type | Nullable | Default | Key | Extra | Comment |
|--------|------|----------|---------|-----|-------|---------|
| id | int | NO | NULL | PRI | auto_increment | |
| username | varchar(50) | NO | NULL | UNI | | |
| password | varchar(255) | NO | NULL | | | |
| rol | enum(...) | YES | user | | | Ver valores en sección Roles |
| activo | tinyint | YES | 1 | | | |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | | DEFAULT_GENERATED | |
| sucursal_id | int | YES | NULL | MUL | | FK → sucursales_mh.ID |

**Roles posibles:**
- `user`
- `gerencia_administrativa`
- `gerencia_prestacional`
- `gerencia_financiera`
- `gerencia_general`
- `operador_carga`
- `admin`

**Foreign Keys:**
- `sucursal_id` → `sucursales_mh.ID`

---

## Key Relationships

### Presupuestos Flow
```
presupuestos
├── presupuesto_insumos (1:N)
├── presupuesto_prestaciones (1:N) - Servicios con convenio
├── presupuesto_prestaciones_tarifario (1:N) - Servicios del tarifario
├── presupuesto_equipamiento (1:N)
├── auditorias_presupuestos (1:N)
├── notificaciones (1:N)
├── financiador (N:1)
├── sucursales_mh (N:1)
├── usuarios (N:1) - usuario_id
├── usuarios (N:1) - revisor_id
└── presupuestos (N:1) - presupuesto_padre (self-reference)
```

### Financiador Agreements
```
financiador
├── financiador_servicio (1:N)
│   └── financiador_servicio_valores (1:N)
└── financiador_equipamiento (1:N)
    └── financiador_equipamiento_valores (1:N)
```

### Tarifario System
```
tarifario_servicio
└── tarifario_servicio_valores (1:N)
    └── tarifario_zonas (N:1)

sucursales_mh
└── sucursales_tarifario_zonas (1:N)
    └── tarifario_zonas (N:1)

presupuestos
└── presupuesto_prestaciones_tarifario (1:N)
    ├── tarifario_servicio (N:1)
    └── tarifario_zonas (N:1)
```

### Catalog Tables
```
servicios → tipos_unidad
equipamientos → tipos_equipamiento
insumos (standalone)
sucursales_mh (standalone)
tarifario_servicio → tipos_unidad
tarifario_zonas (standalone)
```

## Important Constraints

### Monetary Values
- All monetary columns use `decimal(10,2)` for amounts
- Percentages use `decimal(5,2)` (e.g., 15.50%)

### Timestamps
- Most tables have `created_at` and `updated_at` with automatic timestamps
- Use `CURRENT_TIMESTAMP` for defaults
- Use `on update CURRENT_TIMESTAMP` for updated_at

### Soft Deletes
- Tables use `activo` (tinyint) for soft deletes
- Default value is `1` (active)
- Set to `0` to deactivate instead of DELETE

### Versioning
- `presupuestos` table has versioning system
- `es_ultima_version` flag indicates current version
- `presupuesto_padre` links to parent version

### Tarifario System
- `tarifario_servicio_valores` stores 5 costs per service/zone (costo_1 to costo_5)
- `orden_costo` in `presupuesto_prestaciones_tarifario` indicates which cost was used (1-5)
- `fuera_tarifario = 1` marks manually edited costs
- `markup_tarifario` in `configuracion_sistema` defines global markup percentage (default: 50%)
- Formula: `valor_facturar = valor_asignado * (1 + markup/100)`
- `total_prestaciones` = SUM(presupuesto_prestaciones) + SUM(presupuesto_prestaciones_tarifario)

---

**Last Updated:** January 2025  
**Source:** Tablas-full2.csv + Tarifario migrations (001-005)
