# Módulo de Servicios por Presupuesto (Tarifario Interno)

## Objetivo
Permitir agregar servicios a presupuestos usando un tarifario interno con costos por zona y markup configurable.

## Características

### 1. Catálogo de Servicios Interno
- Servicios predefinidos (no texto libre)
- Independiente de financiadores
- Tope máximo configurable por servicio
- Tipo de unidad (días, horas, visitas, etc.)

### 2. Sistema de Zonas
- Sucursales pueden tener una o más zonas
- Costos diferenciados por zona
- 5 valores de costo por servicio/zona
- Ejemplos: "AMBA (CABA)", "AMBA (Provincia)", "Bahía Blanca Centro"

### 3. Markup Configurable
- Porcentaje global configurable desde Admin
- Se aplica a todos los costos del tarifario
- Fórmula: `valor_facturar = costo * (1 + markup/100)`
- Ejemplo: Costo $3,000 con markup 30% → Valor $3,900

### 4. Costos Fuera de Tarifario
- Usuario puede editar costo manualmente
- Se marca como "fuera_tarifario = 1"
- Registrado para auditoría y trazabilidad

### 5. Auditoría por Tope Máximo
- Si valor total > tope máximo → Alerta inmediata
- Al finalizar → Modal de auditoría (igual que auditorías automáticas)
- Estado: pendiente_comercial

## Estructura de Base de Datos

### Diseño de Zonas Geográficas

**Concepto:** Las zonas del tarifario representan áreas geográficas de cobertura, no necesariamente sucursales físicas.

**Relación Sucursales-Zonas:**
- Una sucursal puede tener múltiples zonas (ej: Bahía Blanca → CENTRO, REG AC)
- Una zona puede aplicar a múltiples sucursales
- Sucursales simples tienen 1 zona (ej: CABA, AMBA, La Plata)

**Flujo en DatosPresupuesto.tsx:**
1. Usuario selecciona sucursal (preseleccionada con su sucursal)
2. Sistema carga zonas disponibles para esa sucursal
3. Si sucursal tiene 1 zona → preseleccionar automáticamente
4. Si sucursal tiene múltiples zonas → usuario elige (ej: Bahía Blanca: CENTRO o REG AC)

### Tabla: tarifario_zonas
Catálogo de zonas geográficas para tarifario.

```sql
CREATE TABLE tarifario_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE COMMENT 'Ej: CABA, AMBA, CENTRO, REG AC',
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: sucursales_tarifario_zonas
Relación entre sucursales y zonas del tarifario.

```sql
CREATE TABLE sucursales_tarifario_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sucursal_id INT NOT NULL,
  zona_id INT NOT NULL,
  es_zona_principal TINYINT(1) DEFAULT 0 COMMENT 'Zona por defecto de la sucursal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  UNIQUE KEY idx_sucursal_zona (sucursal_id, zona_id),
  KEY idx_principal (sucursal_id, es_zona_principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: tarifario_servicio
Catálogo de servicios del tarifario interno.

```sql
CREATE TABLE tarifario_servicio (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo_unidad VARCHAR(50),
  tope_maximo_facturar DECIMAL(10,2) NOT NULL COMMENT 'Tope máximo para valor total a facturar',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_nombre (nombre),
  KEY idx_tipo_unidad (tipo_unidad),
  KEY idx_activo (activo),
  FOREIGN KEY (tipo_unidad) REFERENCES tipos_unidad(nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: sucursales_zonas
Zonas por sucursal (una sucursal puede tener múltiples zonas).

```sql
CREATE TABLE sucursales_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sucursal_id INT NOT NULL,
  nombre_zona VARCHAR(100) NOT NULL COMMENT 'Ej: AMBA (CABA), AMBA (Provincia)',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID),
  UNIQUE KEY idx_sucursal_zona (sucursal_id, nombre_zona),
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: tarifario_servicio_valores
Costos por servicio y zona (5 valores por zona) con sistema de valores históricos.

```sql
CREATE TABLE tarifario_servicio_valores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tarifario_servicio_id INT NOT NULL,
  zona_id INT NOT NULL COMMENT 'FK a tarifario_zonas',
  costo_prestacional DECIMAL(10,2) NOT NULL COMMENT 'Valor del costo',
  orden TINYINT NOT NULL COMMENT 'Orden 1-5 (5 valores por zona)',
  fecha_inicio DATE NOT NULL COMMENT 'Fecha de inicio de vigencia',
  fecha_fin DATE NULL COMMENT 'Fecha de fin de vigencia (NULL = vigente)',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tarifario_servicio_id) REFERENCES tarifario_servicio(id) ON DELETE CASCADE,
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  KEY idx_servicio_zona (tarifario_servicio_id, zona_id),
  KEY idx_vigencia (fecha_inicio, fecha_fin),
  KEY idx_activo (activo),
  UNIQUE KEY idx_unique_costo (tarifario_servicio_id, zona_id, orden, fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Tabla: presupuesto_prestaciones_tarifario
Nueva tabla para servicios del tarifario (separada de convenios).

```sql
CREATE TABLE presupuesto_prestaciones_tarifario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  idPresupuestos INT NOT NULL,
  tarifario_servicio_id INT NOT NULL COMMENT 'FK → tarifario_servicio.id',
  prestacion VARCHAR(255) NOT NULL COMMENT 'Nombre del servicio',
  cantidad INT NOT NULL,
  zona_id INT NOT NULL COMMENT 'FK → tarifario_zonas.id',
  orden_costo TINYINT NOT NULL COMMENT 'Orden del costo usado (1-5)',
  valor_asignado DECIMAL(10,2) NOT NULL COMMENT 'Costo prestacional',
  valor_facturar DECIMAL(10,2) NOT NULL COMMENT 'Valor con markup aplicado',
  fuera_tarifario TINYINT(1) DEFAULT 0 COMMENT 'Usuario editó costo manualmente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
  FOREIGN KEY (tarifario_servicio_id) REFERENCES tarifario_servicio(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  KEY idx_presupuesto (idPresupuestos),
  KEY idx_servicio (tarifario_servicio_id),
  KEY idx_zona (zona_id),
  KEY idx_fuera_tarifario (fuera_tarifario),
  KEY idx_orden_costo (orden_costo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

**Nota:** Esta tabla es completamente independiente de `presupuesto_prestaciones` (convenios). No se modifica la tabla existente para evitar romper código actual.

### Configuración: Markup Global
Agregar parámetro de markup en configuracion_sistema.

```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad)
VALUES ('markup_tarifario', 50.00, 'Porcentaje de markup para calcular valor a facturar desde tarifario', 'tarifario', '%');
```

## API Endpoints

### Gestión de Servicios (Admin)
```
GET    /api/tarifario-servicio              - Listar todos los servicios
GET    /api/tarifario-servicio/:id          - Obtener un servicio
POST   /api/tarifario-servicio              - Crear servicio
PUT    /api/tarifario-servicio/:id          - Actualizar servicio
DELETE /api/tarifario-servicio/:id          - Eliminar servicio (soft delete)
```

### Gestión de Zonas (Admin)
```
GET    /api/tarifario-zonas                    - Listar todas las zonas
GET    /api/tarifario-zonas/:id                - Obtener una zona
POST   /api/tarifario-zonas                    - Crear zona
PUT    /api/tarifario-zonas/:id                - Actualizar zona
DELETE /api/tarifario-zonas/:id                - Eliminar zona (soft delete)
GET    /api/sucursales/:id/zonas               - Zonas de una sucursal
POST   /api/sucursales/:id/zonas/:zonaId       - Asignar zona a sucursal
DELETE /api/sucursales/:id/zonas/:zonaId       - Desasignar zona de sucursal
```

### Gestión de Costos (Admin)
```
GET    /api/tarifario-servicio/:id/valores?zona_id=X  - Valores de un servicio por zona
POST   /api/tarifario-servicio/:id/valores            - Agregar valor
PUT    /api/tarifario-servicio/valores/:valorId       - Actualizar valor
DELETE /api/tarifario-servicio/valores/:valorId       - Eliminar valor
POST   /api/tarifario-servicio/importar-csv           - Importar desde CSV
```

### Configuración (Admin)
```
GET    /api/configuracion-sistema/markup_tarifario      - Obtener markup actual
PUT    /api/configuracion-sistema/markup_tarifario      - Actualizar markup
```

### Para Presupuestos (Usuario)
```
GET    /api/tarifario-servicio/activos                           - Servicios activos
GET    /api/sucursales/:sucursalId/zonas                         - Zonas de sucursal
GET    /api/tarifario-servicio/:id/valores-vigentes?zona_id=X    - 5 valores vigentes por zona
```

## Flujo de Uso

```
Usuario crea presupuesto
  ↓
Pestaña "Datos del Presupuesto" (DatosPresupuesto.tsx)
  ↓
1. Usuario selecciona SUCURSAL (preseleccionada con sucursal del usuario)
   ↓
2. Sistema carga selector de ZONA debajo de sucursal
   (Zonas disponibles según sucursal seleccionada)
   ↓
3. Usuario selecciona ZONA
   ↓
Pestaña "Prestaciones"
  ↓
Tabs: "Con Convenio" | "Por Presupuesto (Tarifario)"
  ↓
Usuario selecciona "Por Presupuesto"
  ↓
4. Selecciona SERVICIO del catálogo
   ↓
5. Sistema trae 5 COSTOS del tarifario para la zona seleccionada en Datos
   (Ordenados de menor a mayor: orden 1, 2, 3, 4, 5)
   ↓
6. Usuario ingresa CANTIDAD de unidades
   ↓
7. Usuario selecciona uno de los 5 costos
   O
   Usuario edita manualmente el costo
   ↓
8. Si selecciona costo con orden = 5 (valor MÁS ALTO):
   → Mostrar AVISO VISUAL inmediato
   → "Este servicio requiere autorización de Gerencia Prestacional"
   → Se registra para auditoría prestacional
   → Badge "Valor Más Alto" visible en el item
   ↓
9. Si edita manualmente:
   - fuera_tarifario = 1
   - Se registra para auditoría
   - Badge "Fuera de Tarifario" visible
   ↓
10. Sistema obtiene MARKUP desde configuracion_sistema (50% por defecto)
    ↓
11. Sistema calcula automáticamente:
    valor_facturar_unitario = costo * (1 + markup/100)
    valor_facturar_total = valor_facturar_unitario * cantidad
    ↓
12. ¿Valor total > tope_maximo?
    ├─ SÍ → Mostrar ALERTA inmediata
    │       "Este presupuesto requiere auditoría comercial"
    │       ↓
    │       Usuario puede continuar agregando items
    │       ↓
    │       Al FINALIZAR → Modal de auditoría
    │       "Supera tope máximo del tarifario"
    │       ↓
    │       Estado: pendiente_comercial
    │
    └─ NO → Continuar normal
            ↓
            ¿Cantidad excede max_unidades_sugerido del tipo?
              └─ Mostrar alerta configurada en alertas_servicios
```

## Cálculo de Valor a Facturar

### Fórmula con Markup
```javascript
// Obtener markup desde configuracion_sistema
const markup = await getConfigValue('markup_tarifario'); // Por defecto: 50.00

// Calcular valor a facturar
const valor_facturar_unitario = costo_prestacional * (1 + markup / 100);

// Ejemplo: Costo $3,000 con markup 50%
// valor_facturar = 3000 * (1 + 50/100) = 3000 * 1.50 = $4,500

// Totales
const costo_total = costo_prestacional * cantidad;
const valor_facturar_total = valor_facturar_unitario * cantidad;
```

### Comportamiento en Frontend
```tsx
const [markup, setMarkup] = useState(50); // Cargar desde API (por defecto 50%)

// Al seleccionar costo
const handleCostoChange = (costoId: number) => {
  const costo = costosDisponibles.find(c => c.id === costoId);
  if (costo) {
    const valorCalculado = costo.costo_prestacional * (1 + markup / 100);
    setValorAsignado(costo.costo_prestacional);
    setValorFacturar(valorCalculado);
    setFueraTarifario(false);
    
    // Aviso visual si selecciona valor más alto (PERSISTENTE)
    if (costo.orden === 5) {
      notifications.show({
        title: 'Requiere Autorización',
        message: 'Este servicio requiere autorización de Gerencia Prestacional',
        color: 'orange',
        autoClose: false, // Usuario debe cerrar manualmente
        position: 'top-center'
      });
      setRequiereAutorizacion(true);
    }
  }
};

// Si usuario edita costo manualmente
const handleCostoManualChange = (nuevoCosto: number) => {
  const valorCalculado = nuevoCosto * (1 + markup / 100);
  setValorAsignado(nuevoCosto);
  setValorFacturar(valorCalculado);
  setFueraTarifario(true); // Marcar como fuera de tarifario
};
```

## Flujo de Auditoría

### Regla de Auditoría
```javascript
const costo_total = costo_prestacional * cantidad;
const valor_facturar_total = (costo_prestacional * (1 + markup/100)) * cantidad;

// Regla 1: Selecciona valor más alto (orden = 5) → Auditoría prestacional
if (costo_seleccionado.orden === 5) {
  // Aviso visual inmediato al agregar item (PERSISTENTE)
  notifications.show({
    title: 'Requiere Autorización',
    message: 'Este servicio requiere autorización de Gerencia Prestacional',
    color: 'orange',
    autoClose: false, // Usuario debe cerrar manualmente
    position: 'top-center'
  });
  
  // Al finalizar presupuesto
  if (usuario_finaliza) {
    estado = 'pendiente_prestacional';
    requiere_auditoria = true;
    motivo = 'Seleccionó valor más alto del tarifario';
  }
}

// Regla 2: Supera tope máximo → Auditoría comercial obligatoria
if (valor_facturar_total > tope_maximo) {
  // Alerta inmediata al agregar item
  mostrarAlerta({
    title: 'Requiere Auditoría Comercial',
    message: `El valor total ($${valor_facturar_total}) supera el tope máximo ($${tope_maximo})`,
    color: 'orange',
    autoClose: false
  });
  
  // Al finalizar presupuesto
  if (usuario_finaliza) {
    mostrarModalAuditoria({
      titulo: 'Auditoría Comercial Requerida',
      mensaje: 'Este presupuesto supera el tope máximo del tarifario',
      motivo: 'Supera tope máximo'
    });
    
    estado = 'pendiente_comercial';
    requiere_auditoria = true;
  }
}
```

### Sistema de Alertas

#### 1. Alerta de Valores Desactualizados
```javascript
// Backend: Calcular días desde última actualización
const diasDesactualizacion = DATEDIFF(CURDATE(), fecha_inicio);

if (diasDesactualizacion > 45) {
  return {
    ...costo,
    alerta_desactualizado: true,
    dias_desactualizacion: diasDesactualizacion,
    mensaje: `Valor sin actualizar hace ${diasDesactualizacion} días`
  };
}
```

#### 2. Alertas por Tipo de Unidad
```javascript
// Reutilizar sistema existente de alertas_servicios
if (cantidad > max_unidades_sugerido) {
  const alerta = await obtenerAlertaPorTipo(tipo_unidad);
  
  if (alerta.activo) {
    mostrarAlerta(alerta.mensaje_alerta, alerta.color_alerta);
  }
}
```

#### 3. Alerta de Valor Más Alto (Orden 5)
```javascript
// Frontend: Mostrar aviso al seleccionar orden = 5 (PERSISTENTE)
if (costo_seleccionado.orden === 5) {
  notifications.show({
    title: 'Requiere Autorización',
    message: 'Este servicio requiere autorización de Gerencia Prestacional',
    color: 'orange',
    autoClose: false, // Usuario debe cerrar manualmente con botón X
    position: 'top-center'
  });
  
  // Mostrar badge en el item agregado
  item.badge = 'Valor Más Alto';
  item.requiere_autorizacion = true;
}
```

**Nota:** Esta alerta funciona igual que las alertas de valores desactualizados:
- Posición: top-center
- Persistente: `autoClose: false`
- Usuario debe cerrar manualmente con botón X
- Color: naranja (orange)

## Componentes Frontend

### Admin
- **GestionServiciosPresupuesto.tsx**
  - CRUD de servicios del tarifario
  - Gestión de zonas por sucursal
  - Gestión de costos por zona (5 valores)
  - Importación masiva desde CSV
  - Sistema de valores históricos (timelapse)
  - Configuración de topes máximos
  - Indicador visual de costos desactualizados (> 45 días)

- **ConfiguracionSistema.tsx** (modificar)
  - Agregar campo "Markup Tarifario (%)"
  - Validación: 0-100%
  - Aplicable a todos los servicios del tarifario

### Presupuestos
- **DatosPresupuesto.tsx** (modificar)
  - Agregar selector de ZONA debajo de selector de sucursal
  - Cargar zonas según sucursal seleccionada
  - Preseleccionar sucursal del usuario
  - Guardar zona_id en contexto del presupuesto

- **PrestacionesPresupuesto.tsx**
  - Selector de servicios por presupuesto
  - Obtener zona_id desde contexto del presupuesto (DatosPresupuesto)
  - Input de cantidad (según tipo_unidad del servicio)
  - Select de 5 costos disponibles para la zona (ordenados 1-5)
  - **Aviso visual inmediato** si selecciona orden = 5
  - Badge "Valor Más Alto" si selecciona orden = 5
  - Opción de editar costo manualmente (marca fuera_tarifario)
  - Valor a facturar calculado automáticamente con markup (50% por defecto)
  - Badge "Fuera de Tarifario" si aplica
  - Alerta inmediata si supera tope máximo
  - Alerta de valores desactualizados (> 45 días)
  - Alertas por tipo de unidad

- **PrestacionesPresupuesto.tsx**
  - Selector de servicios por presupuesto
  - Selector de zona (según sucursal del usuario)
  - Input de cantidad (según tipo_unidad del servicio)
  - Select de 5 costos disponibles para la zona
  - Opción de editar costo manualmente (marca fuera_tarifario)
  - Valor a facturar calculado automáticamente con markup
  - Badge "Fuera de Tarifario" si aplica
  - Alerta inmediata si supera tope máximo
  - Alerta de valores desactualizados (> 45 días)
  - Alertas por tipo de unidad

- **Prestaciones.tsx** (modificar)
  - Agregar tabs: "Con Convenio" / "Por Presupuesto"
  - Integrar componente PrestacionesPresupuesto

## Formato de Importación CSV

### Estructura del Archivo CSV

El archivo CSV debe tener el siguiente formato exacto para importación sin errores:

```csv
servicio,zona,costo_1,costo_2,costo_3,costo_4,costo_5
HORA CUIDADOR,AMBA (CABA),2000,2500,2800,3000,3500
HORA CUIDADOR,AMBA (Provincia),2000,2200,2500,2800,3000
HORA ENFERMERIA ADULTO,AMBA (CABA),3200,3500,4000,4200,5000
HORA ENFERMERIA ADULTO,La Plata,3000,3500,4000,4500,5000
VISITA MEDICA CLINICA,AMBA (CABA),15000,18000,20000,25000,30000
```

### Reglas de Formato

1. **Primera fila**: Encabezados (servicio, zona, costo_1, costo_2, costo_3, costo_4, costo_5)
2. **Columna servicio**: Nombre exacto del servicio (debe existir en tabla tarifario_servicio)
3. **Columna zona**: Nombre exacto de la zona (debe existir en tabla sucursales_zonas)
4. **Columnas costo_1 a costo_5**: Valores numéricos sin símbolos (ej: 2000, no $2,000)
5. **Orden**: costo_1 < costo_2 < costo_3 < costo_4 < costo_5 (de menor a mayor)
6. **Separador**: Coma (,)
7. **Codificación**: UTF-8
8. **Sin espacios extras**: Trimear valores automáticamente

### Ejemplo Completo

```csv
servicio,zona,costo_1,costo_2,costo_3,costo_4,costo_5
HORA CUIDADOR,AMBA (CABA),2000,2200,2500,2800,3000
HORA CUIDADOR,AMBA (Provincia),2000,2200,2500,2800,3000
HORA CUIDADOR,LA PLATA,1000,1200,1500,1800,2000
HORA CUIDADOR,SALADILLO,1000,1200,1500,1800,2000
HORA CUIDADOR,BAHIA BLANCA CENTRO,2000,2300,2500,3000,3000
HORA ENFERMERIA ADULTO,AMBA (CABA),3200,3500,4000,4200,5000
HORA ENFERMERIA ADULTO,AMBA (Provincia),3200,3500,4000,4200,5000
HORA ENFERMERIA ADULTO,LA PLATA,2000,2500,3000,3500,4000
HORA ENFERMERIA ADULTO,ROJAS,1800,2000,2200,2500,2500
VISITA MEDICA CLINICA,AMBA (CABA),15000,18000,20000,25000,30000
VISITA MEDICA CLINICA,AMBA (Provincia),15000,18000,20000,25000,30000
VISITA MEDICA CLINICA,LA PLATA,15000,16500,18000,19000,20000
KINESIOLOGIA,AMBA (CABA),5000,5500,6000,7000,8000
KINESIOLOGIA,BAHIA BLANCA CENTRO,10000,12000,14000,15000,22000
```

### Validaciones en Importación

- ✅ Servicio debe existir en tarifario_servicio
- ✅ Zona debe existir en sucursales_zonas
- ✅ Exactamente 5 costos por fila
- ✅ Costos deben ser numéricos > 0
- ✅ Costos deben estar ordenados (costo_1 ≤ costo_2 ≤ costo_3 ≤ costo_4 ≤ costo_5)
- ✅ No duplicar combinación servicio+zona en el mismo archivo

### Comportamiento de Importación
1. **Cierre automático**: Costos vigentes actuales se cierran (fecha_fin = fecha_importación - 1 día)
2. **Nuevos registros**: Se crean con fecha_inicio = fecha_importación, fecha_fin = NULL
3. **Orden automático**: costo_1 → orden=1, costo_2 → orden=2, ..., costo_5 → orden=5
4. **Errores**: Si hay error en una fila, se reporta pero continúa con las demás
5. **Log**: Se genera reporte de importación con filas exitosas y fallidas

### Endpoint de Importación

```typescript
POST /api/tarifario-servicio/importar-csv
Content-Type: multipart/form-data

Body:
  file: archivo.csv

Response:
{
  success: true,
  total_filas: 150,
  importadas: 145,
  errores: 5,
  detalles: [
    { fila: 23, error: "Servicio 'HORA CUIDADORR' no existe" },
    { fila: 45, error: "Zona 'AMBA (CABAA)' no existe" },
    { fila: 67, error: "Costos no están ordenados" }
  ]
}
```

## Validaciones

### Backend
- ✅ Tope máximo no puede ser negativo o cero
- ✅ Costo prestacional debe ser > 0
- ✅ Markup debe estar entre 0 y 100
- ✅ Cantidad debe ser > 0
- ✅ Máximo 5 costos por servicio/zona
- ✅ Si valor total > tope máximo → auditoría comercial obligatoria
- ✅ Validar cantidad contra max_unidades_sugerido del tipo_unidad
- ✅ Nombre de servicio único
- ✅ Nombre de zona único por sucursal

### Frontend
- ✅ Mostrar alerta inmediata si valor > tope
- ✅ Modal de auditoría al finalizar si supera tope
- ✅ Badge "Fuera de Tarifario" si usuario editó costo
- ✅ Mostrar costos solo de zona seleccionada
- ✅ Permitir edición manual de costo
- ✅ Alerta persistente si costos > 45 días sin actualizar
- ✅ Alertas por tipo de unidad (reutiliza alertas_servicios)

## Ejemplos de Uso

### Ejemplo 1: Uso Normal con Tarifario
```
Servicio: "HORA ENFERMERIA ADULTO"
Tipo: Horas
Tope Máximo: $150,000
Markup: 50%

En DatosPresupuesto.tsx:
  Usuario selecciona sucursal: CABA (preseleccionada)
  Sistema carga zonas disponibles
  Usuario selecciona zona: "AMBA (CABA)"

En Prestaciones > Por Presupuesto:
  Usuario selecciona servicio: "HORA ENFERMERIA ADULTO"
  Sistema trae costos para zona "AMBA (CABA)":

Costos disponibles (5 valores ordenados):
  Orden 1: $3,200
  Orden 2: $3,500
  Orden 3: $4,000
  Orden 4: $4,200
  Orden 5: $5,000 ⚠️ (Valor más alto)

Usuario ingresa cantidad: 20 horas
Usuario elige costo: $3,500/hora (orden 2)
Sistema calcula valor a facturar: $3,500 * 1.50 = $5,250/hora

Costo total: $3,500 × 20 = $70,000
Valor total a facturar: $5,250 × 20 = $105,000
Margen real: 50%
fuera_tarifario: 0

¿$105,000 > $150,000? NO
Resultado: Solo auditoría prestacional ✅
```

### Ejemplo 2: Selección de Valor Más Alto (Orden 5)
```
Servicio: "VISITA MEDICA CLINICA"
Tipo: Visitas
Tope Máximo: $300,000
Markup: 50%

En DatosPresupuesto.tsx:
  Zona seleccionada: "AMBA (CABA)"

Costos disponibles:
  Orden 1: $15,000
  Orden 2: $18,000
  Orden 3: $20,000
  Orden 4: $25,000
  Orden 5: $30,000 ⚠️ (Valor más alto)

Usuario ingresa cantidad: 5 visitas
Usuario elige costo: $30,000/visita (orden 5) 🚨

Sistema muestra AVISO VISUAL inmediato (PERSISTENTE):
⚠️ "Requiere Autorización"
"Este servicio requiere autorización de Gerencia Prestacional"
(Alerta persistente, color naranja, posición top-center, usuario debe cerrar con X)

Sistema calcula valor a facturar: $30,000 * 1.50 = $45,000/visita

Costo total: $30,000 × 5 = $150,000
Valor total a facturar: $45,000 × 5 = $225,000
fuera_tarifario: 0

Badge: "Valor Más Alto - Requiere Autorización"
¿$225,000 > $300,000? NO
Pero seleccionó orden = 5 → Requiere autorización

Estado: pendiente_prestacional
Resultado: Auditoría prestacional obligatoria 🚨
```

### Ejemplo 3: Costo Fuera de Tarifario
```
Servicio: "VISITA MEDICA CLINICA"
Tipo: Visitas
Tope Máximo: $200,000
Markup: 50%

En DatosPresupuesto.tsx:
  Zona seleccionada: "Bahía Blanca Centro"

Costos disponibles:
  $15,000
  $18,000
  $20,000
  $24,000
  $30,000

Usuario ingresa cantidad: 5 visitas
Usuario NO encuentra prestador en esos valores
Usuario edita manualmente: $22,000/visita
Sistema calcula valor a facturar: $22,000 * 1.50 = $33,000/visita

Costo total: $22,000 × 5 = $110,000
Valor total a facturar: $33,000 × 5 = $165,000
fuera_tarifario: 1 ⚠️

Badge: "Fuera de Tarifario"
¿$165,000 > $200,000? NO
Resultado: Solo auditoría prestacional (pero marcado fuera de tarifario) ✅
```

### Ejemplo 4: Supera Tope Máximo
```
Servicio: "KINESIOLOGIA"
Tipo: Sesiones
Tope Máximo: $100,000
Markup: 50%

En DatosPresupuesto.tsx:
  Zona seleccionada: "AMBA (Provincia)"

Costos disponibles:
  $5,000
  $6,000
  $7,000
  $8,000
  $10,000

Usuario ingresa cantidad: 15 sesiones
Usuario elige costo: $8,000/sesión (orden 4)
Sistema calcula valor a facturar: $8,000 * 1.50 = $12,000/sesión

Costo total: $8,000 × 15 = $120,000
Valor total a facturar: $12,000 × 15 = $180,000

¿$180,000 > $100,000? SÍ 🚨

Sistema muestra ALERTA inmediata:
⚠️ "Requiere Auditoría Comercial"
"El valor total ($180,000) supera el tope máximo ($100,000)"

Usuario puede continuar agregando más items...

Al FINALIZAR presupuesto:
Modal de Auditoría:
"Auditoría Comercial Requerida"
"Este presupuesto supera el tope máximo del tarifario"

Estado: pendiente_comercial
Resultado: Auditoría comercial obligatoria 🚨
```

### Ejemplo 5: Alerta de Valores Desactualizados
```
Servicio: "FONOAUDIOLOGIA"
Tipo: Sesiones
Zona: "Córdoba"
Última actualización de costos: Hace 60 días

Sistema muestra alerta:
⚠️ "Valores Desactualizados"
"FONOAUDIOLOGIA - Córdoba: 60 días sin actualizar"
(Alerta persistente, color naranja, posición top-center)

Usuario puede continuar pero queda registrado en auditoría
```

## Migración de Datos

### Datos Iniciales
```sql
-- 1. Importar zonas del tarifario
INSERT INTO tarifario_zonas (nombre, descripcion) VALUES
('CABA', 'Ciudad Autónoma de Buenos Aires'),
('AMBA', 'Área Metropolitana de Buenos Aires'),
('LA PLATA', 'La Plata'),
('SALADILLO', 'Saladillo'),
('CENTRO', 'Bahía Blanca - Zona Centro'),
('REG AC', 'Bahía Blanca - Región AC'),
('SALTA', 'Salta'),
('TANDIL', 'Tandil'),
('MAR DE AJO', 'Mar de Ajo'),
('ROJAS', 'Rojas');

-- 2. Asignar zonas a sucursales (ejemplo)
-- Nota: Ajustar sucursal_id según IDs reales en sucursales_mh
INSERT INTO sucursales_tarifario_zonas (sucursal_id, zona_id, es_zona_principal) VALUES
(1, 1, 1),  -- CABA → zona CABA (principal)
(2, 2, 1),  -- AMBA → zona AMBA (principal)
(3, 3, 1),  -- La Plata → zona LA PLATA (principal)
(4, 5, 1),  -- Bahía Blanca → zona CENTRO (principal)
(4, 6, 0),  -- Bahía Blanca → zona REG AC (secundaria)
(5, 7, 1),  -- Salta → zona SALTA (principal)
-- ... etc

-- 3. Importar servicios
INSERT INTO tarifario_servicio (nombre, tipo_unidad, tope_maximo_facturar) VALUES
('HORA CUIDADOR', 'Horas', 150000),
('HORA ENFERMERIA ADULTO', 'Horas', 200000),
('HORA ENFERMERIA PEDIATRICA', 'Horas', 200000),
('VISITA ENFERMERIA', 'Visitas', 250000),
('VISITA ENFERMERIA PEDIATRICA', 'Visitas', 250000),
('VISITA MEDICA CLINICA', 'Visitas', 300000),
('VISITA MEDICO PEDIATRA', 'Visitas', 300000),
('KINESIOLOGIA', 'Sesiones', 200000),
('FONOAUDIOLOGIA', 'Sesiones', 200000),
('TERAPIA OCUPACIONAL', 'Sesiones', 200000);

-- 4. Importar costos desde CSV (usar endpoint de importación)
```

No requiere migración de datos existentes en presupuesto_prestaciones. Los servicios actuales (con convenio) siguen funcionando con `tipo_servicio = 'convenio'`.

## Roadmap de Implementación

### Fase 1: Base de Datos
- [x] Crear tabla tarifario_zonas
- [x] Crear tabla sucursales_tarifario_zonas
- [x] Crear tabla tarifario_servicio
- [x] Crear tabla tarifario_servicio_valores
- [x] Crear tabla presupuesto_prestaciones_tarifario
- [x] Agregar configuración markup_tarifario
- [x] Insertar datos iniciales de zonas
- [x] Mapear sucursales a zonas
- [x] Script de importación desde CSV
- [x] Actualizar schema documentation
- [x] Agregar zona_id a presupuestos
- [x] Corregir tipos_unidad en tarifario_servicio

### Fase 2: Backend
- [x] Crear tipos TypeScript
- [x] Endpoints de servicios
- [x] Endpoints de zonas (CRUD + asignación a sucursales)
- [x] Endpoints de costos
- [x] Endpoint de importación CSV
- [x] Endpoint de configuración markup
- [x] **Endpoint: GET /api/sucursales/:id/zonas** (para selector en DatosPresupuesto)
- [x] **Endpoints CRUD para presupuesto_prestaciones_tarifario**
  - [x] POST /api/presupuestos/:id/prestaciones-tarifario (agregar)
  - [x] PUT /api/presupuestos/:id/prestaciones-tarifario/:itemId (editar)
  - [x] DELETE /api/presupuestos/:id/prestaciones-tarifario/:itemId (eliminar)
  - [x] GET /api/presupuestos/:id/prestaciones-tarifario (listar)
- [x] **Modificar cálculo de totales para incluir servicios por tarifario**
  - [x] Actualizar queries de total_prestaciones (sumar presupuesto_prestaciones + presupuesto_prestaciones_tarifario)
  - [x] Modificar lógica de recálculo de totales
  - [x] Actualizar triggers/stored procedures si existen
- [x] Implementar validaciones
- [x] Implementar cálculo de días desactualizados
- [x] Registrar en app.ts
- [x] Soporte para costos manuales (fuera_tarifario)

### Fase 3: Frontend Admin
- [ ] Crear GestionTarifario.tsx (componente principal)
- [ ] Configuración de Markup Global
- [ ] Gestión de zonas (CRUD)
- [ ] Asignación de zonas a sucursales
- [ ] Gestión de servicios del tarifario (CRUD)
- [ ] Gestión de costos (5 por zona)
- [ ] Importador CSV
- [ ] Histórico de costos (timelapse)
- [ ] Indicador visual de costos desactualizados
- [ ] Agregar tab en AdminDashboard

**Nota**: Ver especificación completa en `SESION_ADMIN_TARIFARIO_PENDIENTE.md`

### Fase 4: Frontend Presupuestos
- [x] **Modificar DatosPresupuesto.tsx**
  - [x] Agregar selector de zona debajo de sucursal
  - [x] Cargar zonas según sucursal seleccionada
  - [x] Preseleccionar zona si sucursal tiene solo 1
  - [x] Guardar zona_id en contexto del presupuesto
  - [x] Optimizar carga paralela para eliminar lag visual
- [x] **Crear PrestacionesTarifario.tsx** (componente separado)
  - [x] Obtener zona_id desde contexto
  - [x] Select de 5 costos
  - [x] Opción editar costo (fuera de tarifario)
  - [x] Cálculo automático con markup
  - [x] Badge "Fuera de Tarifario"
  - [x] Badge "Valor Más Alto" si orden = 5
  - [x] Alerta persistente si selecciona orden = 5
  - [x] Alerta inmediata si supera tope
  - [x] Modal de auditoría al finalizar
  - [x] Tabla de items agregados (separada de convenios)
  - [x] Alertas por tipo de unidad
- [x] Modificar Prestaciones.tsx (agregar tabs)
  - [x] Tab "Con Convenio" (componente actual)
  - [x] Tab "Por Presupuesto (Tarifario)" (nuevo componente)
  - [x] Iconos en tabs (DocumentCheckIcon y CurrencyDollarIcon)
- [x] **Actualizar cálculo de totales en frontend**
  - [x] Modificar useTotales hook (sumar presupuesto_prestaciones + presupuesto_prestaciones_tarifario)
  - [x] Actualizar visualización de total_prestaciones
  - [x] Recalcular totales al agregar/eliminar servicios por tarifario
- [x] Implementar alertas de valores desactualizados
- [x] Reutilizar sistema de alertas por tipo_unidad
- [x] Visualización en modal de detalle

### Fase 5: Testing & Documentación
- [ ] Tests unitarios backend
- [ ] Tests integración
- [ ] Actualizar manual de usuario
- [ ] Actualizar arquitectura
- [ ] Testing en producción con usuarios reales

---

**Versión:** 2.0  
**Fecha:** Enero 2025  
**Estado**: ✅ Fases 1, 2, 4 Completadas | 🚧 **Fase 3 Pendiente** (Admin) | 🚧 Fase 5 Pendiente  
**Rama:** `feature/servicios-presupuesto-tarifario`

## 📊 Resumen de Completitud

### ✅ Fase 1: Base de Datos (100%)
Todas las tablas creadas, migraciones ejecutadas, datos iniciales cargados.

### ✅ Fase 2: Backend (100%)
Todos los endpoints implementados, validaciones completas, soporte para costos manuales.

### 🚧 Fase 3: Frontend Admin (0%) - **PENDIENTE**
**Ver especificación completa en**: `SESION_ADMIN_TARIFARIO_PENDIENTE.md`

Falta implementar:
- Configuración de Markup Global
- Gestión de Zonas Geográficas
- Gestión de Servicios del Tarifario
- Gestión de Costos por Zona (5 valores)
- Importador CSV
- Histórico de Costos

### ✅ Fase 4: Frontend Presupuestos (100%)
Selector de zona optimizado, componente PrestacionesTarifario completo con todas las alertas y validaciones, tabs con iconos, visualización en modal de detalle.

### 🚧 Fase 5: Testing & Documentación (Pendiente)
Próximos pasos: testing exhaustivo y actualización de documentación de usuario.
