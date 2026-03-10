# Unificación de Servicios - Plan de Implementación

## Objetivo

Unificar las tablas `servicios` y `tarifario_servicio` en una sola tabla, y migrar el sistema de convenios para que use zonas en lugar de sucursales y maneje 5 niveles de precios.

## Cambios en Base de Datos

### 1. Nuevas Tablas

#### servicios_unificados
```sql
CREATE TABLE servicios_unificados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_unidad VARCHAR(50),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tipo_unidad) REFERENCES tipos_unidad(nombre),
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### servicios_valores_tarifario
```sql
CREATE TABLE servicios_valores_tarifario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  servicio_id INT NOT NULL,
  zona_id INT NOT NULL,
  costo_1 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 1 (más bajo)',
  costo_2 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 2',
  costo_3 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 3',
  costo_4 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 4',
  costo_5 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 5 (más alto)',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  INDEX idx_vigencia (servicio_id, zona_id, fecha_inicio, fecha_fin),
  INDEX idx_servicio_zona (servicio_id, zona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### financiador_servicio_new
```sql
CREATE TABLE financiador_servicio_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  financiador_id INT NOT NULL,
  servicio_id INT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (financiador_id) REFERENCES financiador(id),
  FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id),
  UNIQUE KEY unique_financiador_servicio (financiador_id, servicio_id),
  INDEX idx_financiador (financiador_id),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### financiador_servicio_valores_new
```sql
CREATE TABLE financiador_servicio_valores_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  financiador_servicio_id INT NOT NULL,
  zona_id INT NOT NULL,
  precio_facturar DECIMAL(10,2) NOT NULL COMMENT 'Precio convenido único por zona',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financiador_servicio_id) REFERENCES financiador_servicio_new(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  INDEX idx_vigencia (financiador_servicio_id, zona_id, fecha_inicio, fecha_fin),
  INDEX idx_zona (zona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Modificaciones a Tablas Existentes

#### presupuesto_prestaciones
```sql
-- Agregar columnas para zona y orden
ALTER TABLE presupuesto_prestaciones 
ADD COLUMN servicio_id INT AFTER idPresupuestos,
ADD COLUMN zona_id INT AFTER servicio_id,
ADD COLUMN orden_costo TINYINT COMMENT '1-5: orden del costo usado' AFTER zona_id;

-- Agregar foreign keys
ALTER TABLE presupuesto_prestaciones
ADD FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id),
ADD FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id);

-- Agregar índices
ALTER TABLE presupuesto_prestaciones
ADD INDEX idx_servicio (servicio_id),
ADD INDEX idx_zona (zona_id);
```

#### presupuesto_prestaciones_tarifario
```sql
-- Cambiar tarifario_servicio_id por servicio_id
ALTER TABLE presupuesto_prestaciones_tarifario 
DROP FOREIGN KEY presupuesto_prestaciones_tarifario_ibfk_2;

ALTER TABLE presupuesto_prestaciones_tarifario 
CHANGE tarifario_servicio_id servicio_id INT NOT NULL;

ALTER TABLE presupuesto_prestaciones_tarifario 
ADD FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id);
```

### 3. Script de Migración

```sql
-- ============================================
-- MIGRACIÓN: UNIFICACIÓN DE SERVICIOS
-- ============================================

START TRANSACTION;

-- Paso 1: Crear servicios_unificados desde tarifario_servicio
INSERT INTO servicios_unificados (nombre, descripcion, tipo_unidad, activo)
SELECT nombre, descripcion, tipo_unidad, activo 
FROM tarifario_servicio;

-- Paso 2: Migrar valores del tarifario MediHome
INSERT INTO servicios_valores_tarifario (
  servicio_id, 
  zona_id, 
  costo_1, 
  costo_2, 
  costo_3, 
  costo_4, 
  costo_5, 
  fecha_inicio, 
  fecha_fin
)
SELECT 
  su.id, 
  tsv.zona_id, 
  tsv.costo_1, 
  tsv.costo_2, 
  tsv.costo_3, 
  tsv.costo_4, 
  tsv.costo_5, 
  tsv.fecha_inicio, 
  tsv.fecha_fin
FROM tarifario_servicio_valores tsv
JOIN tarifario_servicio ts ON tsv.tarifario_servicio_id = ts.id
JOIN servicios_unificados su ON su.nombre = ts.nombre;

-- Paso 3: Migrar acuerdos financiador_servicio
INSERT INTO financiador_servicio_new (financiador_id, servicio_id, activo)
SELECT 
  fs.financiador_id,
  su.id,
  fs.activo
FROM financiador_servicio fs
JOIN servicios s ON fs.id_servicio = s.id_servicio
JOIN servicios_unificados su ON su.nombre = s.nombre;

-- Paso 4: Migrar valores de convenios a zona principal
INSERT INTO financiador_servicio_valores_new (
  financiador_servicio_id, 
  zona_id, 
  precio_facturar,
  fecha_inicio, 
  fecha_fin
)
SELECT 
  fs_new.id,
  COALESCE(stz.zona_id, 1) as zona_id,
  fsv.valor_facturar,
  fsv.fecha_inicio,
  fsv.fecha_fin
FROM financiador_servicio_valores fsv
JOIN financiador_servicio fs ON fsv.financiador_servicio_id = fs.id
JOIN servicios s ON fs.id_servicio = s.id_servicio
JOIN servicios_unificados su ON su.nombre = s.nombre
JOIN financiador_servicio_new fs_new ON fs_new.servicio_id = su.id AND fs_new.financiador_id = fs.financiador_id
LEFT JOIN sucursales_tarifario_zonas stz ON stz.sucursal_id = fsv.sucursal_id AND stz.es_zona_principal = 1;

-- Paso 5: Actualizar presupuesto_prestaciones_tarifario
UPDATE presupuesto_prestaciones_tarifario ppt
JOIN tarifario_servicio ts ON ppt.tarifario_servicio_id = ts.id
JOIN servicios_unificados su ON su.nombre = ts.nombre
SET ppt.servicio_id = su.id;

-- Paso 6: Renombrar tablas legacy (backup)
RENAME TABLE servicios TO servicios_old;
RENAME TABLE tarifario_servicio TO tarifario_servicio_old;
RENAME TABLE tarifario_servicio_valores TO tarifario_servicio_valores_old;
RENAME TABLE financiador_servicio TO financiador_servicio_old;
RENAME TABLE financiador_servicio_valores TO financiador_servicio_valores_old;

-- Paso 7: Renombrar tablas nuevas
RENAME TABLE servicios_unificados TO servicios;
RENAME TABLE servicios_valores_tarifario TO tarifario_servicio_valores;
RENAME TABLE financiador_servicio_new TO financiador_servicio;
RENAME TABLE financiador_servicio_valores_new TO financiador_servicio_valores;

COMMIT;
```

## Cambios en Backend

### 1. Controllers

#### Crear: `serviciosController.ts`
```typescript
// CRUD unificado para servicios
- listarServicios()
- crearServicio()
- actualizarServicio()
- toggleActivo()
```

#### Crear: `tarifarioValoresController.ts`
```typescript
// Gestión de valores del tarifario MediHome
- listarServiciosConValores(zonaId)
- obtenerHistorico(servicioId, zonaId)
- guardarValores() // Guarda los 5 costos
```

#### Modificar: `financiadorServicioController.ts`
```typescript
// Cambiar de sucursal_id a zona_id
- listarServiciosPorFinanciador(financiadorId, zonaId)
- obtenerHistorico(financiadorServicioId, zonaId)
- guardarValores() // Guarda 1 precio convenido por zona
```

#### Modificar: `prestacionesController.ts`
```typescript
// Cambiar lógica para usar servicios unificados
- obtenerServiciosConConvenio(financiadorId, zonaId)
  // Retorna servicios donde existe financiador_servicio
  // Con costo base desde tarifario_servicio_valores
  // Y precio convenido desde financiador_servicio_valores

- obtenerServiciosTarifario(zonaId)
  // Retorna TODOS los servicios activos
  // Con costos desde tarifario_servicio_valores
```

### 2. Routes

#### Modificar: `/api/servicios`
```typescript
GET    /servicios                    // Listar todos
POST   /servicios                    // Crear
PUT    /servicios/:id                // Actualizar
PATCH  /servicios/:id/toggle         // Activar/Desactivar
```

#### Modificar: `/api/tarifario`
```typescript
GET    /tarifario/valores/zona/:zonaId              // Servicios con valores por zona
GET    /tarifario/valores/historico/:servicioId/:zonaId  // Histórico
POST   /tarifario/valores                           // Guardar valores (5 costos)
```

#### Modificar: `/api/financiador-servicio`
```typescript
GET    /financiador-servicio/:financiadorId/zona/:zonaId  // Servicios con convenio
GET    /financiador-servicio/valores/historico/:id/:zonaId // Histórico
POST   /financiador-servicio/valores                      // Guardar precio convenido (1 por zona)
```

### 3. Queries Clave

#### Obtener costo base del tarifario
```typescript
const [valores] = await pool.query(`
  SELECT costo_1, costo_2, costo_3, costo_4, costo_5
  FROM tarifario_servicio_valores
  WHERE servicio_id = ?
    AND zona_id = ?
    AND CURDATE() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
  ORDER BY fecha_inicio DESC
  LIMIT 1
`, [servicioId, zonaId]);
```

#### Obtener precio convenido
```typescript
const [valores] = await pool.query(`
  SELECT precio_facturar
  FROM financiador_servicio_valores fsv
  JOIN financiador_servicio fs ON fsv.financiador_servicio_id = fs.id
  WHERE fs.financiador_id = ?
    AND fs.servicio_id = ?
    AND fsv.zona_id = ?
    AND CURDATE() BETWEEN fsv.fecha_inicio AND COALESCE(fsv.fecha_fin, '9999-12-31')
  ORDER BY fsv.fecha_inicio DESC
  LIMIT 1
`, [financiadorId, servicioId, zonaId]);
```

## Cambios en Frontend

### 1. Admin Panel

#### Modificar: `GestionServicios.tsx`
- Unificar gestión de servicios (eliminar separación tarifario/legacy)
- CRUD único para todos los servicios

#### Modificar: `ValoresPorZona.tsx`
- Cambiar para gestionar `tarifario_servicio_valores`
- Mantener los 5 inputs de costos
- Selector de zona

#### Modificar: `ServiciosPorFinanciador.tsx`
- Cambiar de sucursal a zona
- 1 input para precio convenido (precio_facturar)
- Mostrar los 5 costos base del tarifario como referencia
- Usuario elige qué orden de costo usar al agregar al presupuesto

### 2. Presupuestos

#### Modificar: `Prestaciones.tsx` (Tab "Con Convenio")
```typescript
// Lógica actualizada:
1. Usuario selecciona financiador
2. Usuario selecciona zona (desde presupuesto)
3. Sistema carga servicios con convenio para ese financiador
4. Usuario selecciona servicio + orden (1-5)
5. Sistema obtiene:
   - valor_asignado = tarifario_servicio_valores.costo_X (orden seleccionado)
   - valor_facturar = financiador_servicio_valores.precio_facturar (único por zona)
6. Guarda en presupuesto_prestaciones
```

#### Mantener: `PrestacionesTarifario.tsx` (Tab "Por Presupuesto")
```typescript
// Lógica sin cambios:
1. Usuario selecciona zona
2. Sistema carga TODOS los servicios activos
3. Usuario selecciona servicio + orden (1-5)
4. Sistema obtiene:
   - valor_asignado = tarifario_servicio_valores.costo_X
   - valor_facturar = costo_X * (1 + markup/100)
5. Guarda en presupuesto_prestaciones_tarifario
```

## Lógica de Negocio

### Con Convenio (presupuesto_prestaciones)
```
Costo Base: tarifario_servicio_valores.costo_X (orden 1-5 seleccionado por usuario)
Precio Final: financiador_servicio_valores.precio_facturar (único por zona)
Zona: zona_id del presupuesto
Orden: 1-5 seleccionado por usuario (determina qué costo_X usar)
```

### Sin Convenio (presupuesto_prestaciones_tarifario)
```
Costo Base: tarifario_servicio_valores.costo_X (MediHome)
Precio Final: costo_X * (1 + markup/100)
Zona: zona_id del presupuesto
Orden: 1-5 seleccionado por usuario
```

## Ventajas

✅ **Un solo catálogo** de servicios
✅ **Mismos IDs** para convenios y tarifario
✅ **Por zona** (más flexible que por sucursal)
✅ **5 niveles** en tarifario y convenios
✅ **Histórico completo** con vigencias
✅ **Costo base consistente** (siempre desde tarifario MediHome)
✅ **Dos tablas de presupuesto** mantienen lógicas separadas

## Plan de Implementación

### Fase 1: Base de Datos (1 día)
1. Crear nuevas tablas
2. Ejecutar migración de datos
3. Verificar integridad de datos
4. Backup de tablas legacy

### Fase 2: Backend (2-3 días)
1. Actualizar controllers
2. Actualizar routes
3. Actualizar queries
4. Testing de endpoints

### Fase 3: Frontend (2-3 días)
1. Actualizar Admin Panel
2. Actualizar componente Prestaciones
3. Testing de flujos completos

### Fase 4: Testing & Deploy (1 día)
1. Testing integración completa
2. Deploy a producción
3. Monitoreo post-deploy

## Rollback Plan

Si algo falla:
1. Las tablas legacy están respaldadas con sufijo `_old`
2. Renombrar tablas nuevas con sufijo `_new`
3. Renombrar tablas `_old` a nombres originales
4. Restaurar código anterior desde Git

## Notas Importantes

- **Zona principal**: Migración usa `sucursales_tarifario_zonas.es_zona_principal = 1`
- **Fallback**: Si no hay zona principal, usa zona ID 1
- **Precio único**: Convenios tienen 1 precio por zona (no 5)
- **Orden de costo**: Usuario elige orden (1-5) al agregar servicio al presupuesto
- **Backward compatibility**: Tablas legacy se mantienen como backup


## Cumplimiento de Development Guidelines

### Code Quality Standards
- ✅ TypeScript strict mode habilitado
- ✅ Tipos explícitos en todos los parámetros y returns
- ✅ Interfaces con PascalCase
- ✅ No usar `any` (solo en catch blocks)

### Naming Conventions
- ✅ Variables: camelCase (`servicioId`, `zonaId`, `costoBase`)
- ✅ Functions: camelCase con verbos (`listarServicios`, `guardarValores`)
- ✅ Interfaces: PascalCase (`Servicio`, `ValorTarifario`)
- ✅ Database: snake_case (`servicio_id`, `zona_id`, `costo_1`)
- ✅ Table Text Display: Primera letra mayúscula ("Hora cuidador")

### Backend Patterns

#### Route Definition Pattern
```typescript
router.get('/servicios/:id', 
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Obtener servicio', { id: req.params.id });
    const resultado = await controller.obtenerServicio(req, res);
    return resultado;
  })
);
```

#### Service Layer Transaction Pattern
```typescript
async guardarValores(servicioId: number, zonaId: number, valores: any) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Cerrar período anterior
    await connection.query(
      'UPDATE tarifario_servicio_valores SET fecha_fin = ? WHERE servicio_id = ? AND zona_id = ? AND fecha_fin IS NULL',
      [new Date(), servicioId, zonaId]
    );
    
    // Insertar nuevos valores
    await connection.query(
      'INSERT INTO tarifario_servicio_valores (servicio_id, zona_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [servicioId, zonaId, valores.costo_1, valores.costo_2, valores.costo_3, valores.costo_4, valores.costo_5, valores.fecha_inicio]
    );
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

#### Error Handling Pattern
```typescript
try {
  const resultado = await service.method();
  return res.json(resultado);
} catch (error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  logger.error('Error inesperado', { error });
  return res.status(500).json({ error: 'Error interno del servidor' });
}
```

#### Logging Pattern
```typescript
logger.info('Guardar valores tarifario', { 
  servicioId, 
  zonaId, 
  usuario: req.user.id 
});
```

### Frontend Patterns

#### Component State Management Pattern
```typescript
export default function GestionServicios() {
  // 1. Hooks primero
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 2. Derived state con useMemo
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => s.activo);
  }, [servicios]);
  
  // 3. Callbacks con useCallback
  const handleGuardar = useCallback(async () => {
    // Logic
  }, []);
  
  // 4. Effects
  useEffect(() => {
    cargarServicios();
  }, []);
  
  // 5. Render
  return <JSX />;
}
```

#### API Call Pattern
```typescript
try {
  const response = await api.post('/servicios', data);
  
  notifications.show({
    title: 'Éxito',
    message: 'Servicio guardado correctamente',
    color: 'green',
    position: 'top-center',
    autoClose: 5000,
  });
  
  setServicios(response.data);
  
} catch (error) {
  console.error('Error:', error);
  notifications.show({
    title: 'Error',
    message: 'Error al guardar servicio',
    color: 'red',
    position: 'top-center',
    autoClose: false,
  });
}
```

#### Modal State Pattern
```typescript
const [modalOpened, setModalOpened] = useState(false);
const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

const openModal = useCallback((servicio: Servicio) => {
  setEditingServicio(servicio);
  setModalOpened(true);
}, []);

const closeModal = useCallback(() => {
  setModalOpened(false);
  setEditingServicio(null);
}, []);
```

### Database Query Patterns

#### Parameterized Queries (ALWAYS)
```typescript
// ✅ CORRECT
await connection.query(
  'SELECT * FROM servicios WHERE id = ? AND zona_id = ?',
  [servicioId, zonaId]
);

// ❌ WRONG
await connection.query(
  `SELECT * FROM servicios WHERE id = ${servicioId}`
);
```

#### Avoid Multiple JOINs with Aggregations
```typescript
// ✅ CORRECT - Separate queries
const [servicio] = await pool.query('SELECT * FROM servicios WHERE id = ?', [id]);
const [valores] = await pool.query('SELECT * FROM tarifario_servicio_valores WHERE servicio_id = ?', [id]);

// ❌ WRONG - Multiple JOINs multiply values
await pool.query(`
  SELECT s.*, SUM(v.costo_1) 
  FROM servicios s 
  LEFT JOIN tarifario_servicio_valores v ON s.id = v.servicio_id
`);
```

### Mantine UI Component Usage

#### Form Components
```typescript
<TextInput
  label="Nombre"
  value={value}
  onChange={(e) => setValue(e.currentTarget.value)}
  required
/>

<Select
  label="Zona"
  data={zonas.map(z => ({ value: String(z.id), label: z.nombre }))}
  value={zonaId}
  onChange={setZonaId}
/>
```

#### Layout Components
```typescript
<Group gap="xs" justify="space-between">
  <Component1 />
  <Component2 />
</Group>

<Stack gap="md">
  <Component1 />
  <Component2 />
</Stack>

<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.List grow>
    <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

#### Notification System
```typescript
notifications.show({
  title: 'Título',
  message: 'Mensaje',
  color: 'green' | 'red' | 'blue',
  position: 'top-center',
  autoClose: 5000,
});
```

### Code Idioms

```typescript
// Optional Chaining
const valor = servicio?.valores?.costo_1;

// Nullish Coalescing
const zona = zonaId ?? 1;

// Destructuring
const { id, nombre, activo } = servicio;

// Spread Operator
const updated = { ...servicio, activo: 1 };

// Template Literals
const mensaje = `Servicio ${nombre} guardado`;

// Async/Await (always)
const resultado = await api.get('/servicios');

// Array Methods
const activos = servicios.filter(s => s.activo);
const nombres = servicios.map(s => s.nombre);
```

### Best Practices

#### Security
- ✅ Parameterized queries
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Input validation

#### Performance
- ✅ Connection pooling
- ✅ Indexes on frequently queried columns
- ✅ Batch operations when possible
- ✅ Memoize expensive calculations

#### Maintainability
- ✅ Small, focused functions
- ✅ Descriptive variable names
- ✅ Separation of concerns (controllers, services, repositories)
- ✅ Self-documenting code
- ✅ TypeScript for type safety

#### Error Handling
- ✅ Custom error classes (AppError)
- ✅ User-friendly error messages
- ✅ Logging with context
- ✅ Always rollback transactions on error
- ✅ Show notifications to users

### UI Patterns

#### ActionIcons
```typescript
<ActionIcon variant="transparent" onClick={handleEdit}>
  <PencilSquareIcon width={20} height={20} />
</ActionIcon>
```

#### Switches
```typescript
<Switch
  checked={activo}
  onChange={handleToggle}
  color="green"
  size="sm"
/>
```

#### CurrencyInput
```typescript
<CurrencyInput
  value={precio}
  onChange={setPrecio}
  min={0}
  step={100}
  w={200}
/>
```

#### Tables
```typescript
<Table striped highlightOnHover fontSize="xs">
  <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
    <Table.Tr>
      <Table.Th>Columna</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td><Text size="sm">{valor}</Text></Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

#### Spacing
```typescript
// Tabs
<Tabs value={activeTab} onChange={setActiveTab} mt="lg">
  <Tabs.List grow>...</Tabs.List>
  <Tabs.Panel value="tab1" pt="lg">...</Tabs.Panel>
</Tabs>
```

## Checklist de Implementación

### Base de Datos
- [ ] Crear tablas nuevas con índices apropiados
- [ ] Ejecutar migración de datos
- [ ] Verificar integridad referencial
- [ ] Backup de tablas legacy
- [ ] Actualizar schema documentation (database-schema.md)

### Backend
- [ ] Crear controllers con patrones establecidos
- [ ] Implementar service layer con transacciones
- [ ] Definir routes con middleware chain
- [ ] Usar queries parametrizadas
- [ ] Implementar logging apropiado
- [ ] Agregar validación de inputs
- [ ] Testing de endpoints

### Frontend
- [ ] Actualizar componentes admin con UI patterns
- [ ] Implementar state management correcto
- [ ] Usar Mantine components consistentemente
- [ ] Agregar notifications apropiadas
- [ ] Implementar error handling
- [ ] Testing de flujos completos

### Documentation
- [ ] Actualizar database-schema.md
- [ ] Actualizar README.md
- [ ] Documentar cambios en CHANGELOG
- [ ] Actualizar Swagger/API docs

### Testing
- [ ] Unit tests para services
- [ ] Integration tests para API
- [ ] E2E tests para flujos críticos
- [ ] Testing de migración en ambiente staging

### Deploy
- [ ] Deploy a staging
- [ ] Smoke testing
- [ ] Deploy a producción
- [ ] Monitoreo post-deploy
- [ ] Rollback plan listo
