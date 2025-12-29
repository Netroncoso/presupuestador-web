# Development Guidelines - Sistema Presupuestador Web

## Code Quality Standards

### TypeScript Strict Mode
- **Strict type checking enabled** in all tsconfig.json files
- **No implicit any**: All variables must have explicit types
- **Null safety**: Use optional chaining (?.) and nullish coalescing (??)
- **Type definitions**: Separate type files in `/types` directories

Example from codebase:
```typescript
// ✅ Explicit types with interfaces
interface PresupuestoData {
  cliente: string;
  dni: string;
  sucursal: string;
  presupuestoId: number;
  totales: {
    totalInsumos: number;
    totalPrestaciones: number;
    rentabilidad: number;
  };
}

// ✅ Optional chaining for safe property access
if (presupuesto[0]?.version && presupuesto[0]?.usuario_id) {
  // Process data
}
```

### Naming Conventions

#### Variables and Functions
- **camelCase** for variables and functions
- **Descriptive names** that explain purpose
- **Boolean prefixes**: `is`, `has`, `should`, `can`

```typescript
// ✅ Good naming
const insumosSeleccionados = [];
const esCargaHistorial = false;
const handleFinalizarPresupuesto = () => {};
const notificarGerencia = async () => {};

// ❌ Avoid abbreviations
const ins = [];
const flag = false;
const handle = () => {};
```

#### React Components
- **PascalCase** for component names
- **Descriptive component names** that indicate purpose
- **File names match component names**

```typescript
// ✅ Component naming
export default function UserDashboard() {}
export const ModalAuditoria = () => {};
export const ConnectionStatus = () => {};
```

#### Constants
- **UPPER_SNAKE_CASE** for true constants
- **camelCase** for configuration objects

```typescript
// ✅ Constants
const ICON_SIZE = { width: 20, height: 20 };
const TAB_HOVER_STYLE = { "&:hover": { backgroundColor: "#dff1db" } };
const DIAS_ALERTA_OBSOLESCENCIA = 45;
```

#### Database Conventions
- **snake_case** for column names (MySQL convention)
- **Descriptive table names** in plural
- **Foreign keys**: `{table}_id` format

```sql
-- ✅ Database naming
CREATE TABLE presupuestos (
  idPresupuestos INT PRIMARY KEY,
  usuario_id INT,
  sucursal_id INT,
  fecha_creacion DATETIME,
  es_ultima_version TINYINT(1)
);
```

### Code Formatting

#### Indentation and Spacing
- **2 spaces** for indentation (TypeScript/JavaScript)
- **No trailing whitespace**
- **Empty line between logical blocks**
- **Consistent spacing** around operators

#### Import Organization
Group imports in this order:
1. External libraries (React, third-party)
2. Internal modules (contexts, hooks, services)
3. Components
4. Types
5. Styles/assets

```typescript
// ✅ Organized imports
// External
import { useState, useCallback, useMemo } from "react";
import { Tabs, Container, Title, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

// Internal
import { useAuth } from "../contexts/AuthContext";
import { useNotificationCount } from "../hooks/useNotificationCount";
import { api } from "../api/api";

// Components
import DatosPresupuesto from "./DatosPresupuesto";
import Notificaciones from "./Notificaciones";

// Icons
import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
```

### Documentation Standards

#### JSDoc Comments
- **Document public APIs** and complex functions
- **Explain "why" not "what"**
- **Include parameter descriptions** and return types

```typescript
/**
 * Servicio de Auditoría Multi-Gerencial
 * Maneja transiciones de estado con asignación de casos y notificaciones
 */
export class AuditoriaMultiService {
  /**
   * Notifica a todos los usuarios de una gerencia específica
   * @param connection - Database connection (transaction)
   * @param presupuestoId - ID del presupuesto
   * @param version - Versión del presupuesto
   * @param rol - Rol de la gerencia a notificar
   * @param mensaje - Mensaje de notificación
   * @param tipo - Tipo de notificación (default: 'pendiente')
   */
  private async notificarGerencia(
    connection: any,
    presupuestoId: number,
    version: number,
    rol: string,
    mensaje: string,
    tipo: string = 'pendiente'
  ) {
    // Implementation
  }
}
```

#### Inline Comments
- **Explain complex logic** or business rules
- **Use section headers** for logical groupings
- **Avoid obvious comments**

```typescript
// ✅ Good comments
// Sistema anti-obsolescencia: valores específicos > 30 días pierden prioridad
if (diasDiferencia > 30) {
  return valorGeneral;
}

// ============================================================================
// GERENCIA ADMINISTRATIVA
// ============================================================================

// ❌ Avoid obvious comments
// Set estado to aprobado
estado = 'aprobado';
```

## Architectural Patterns

### Backend Patterns

#### Layered Architecture
**Strict separation of concerns** across layers:

```
Routes → Controllers → Services → Repositories → Database
```

**Routes** (`/routes`):
- Define endpoints and HTTP methods
- Apply middleware (auth, validation)
- No business logic

```typescript
// ✅ Route definition
router.post('/aprobar/:id', 
  authenticateToken, 
  requireRole(['gerencia_administrativa']),
  auditoriaMultiController.aprobarAdministrativa
);
```

**Controllers** (`/controllers`):
- Handle HTTP request/response
- Validate input
- Call service methods
- Return formatted responses

```typescript
// ✅ Controller pattern
export const aprobarAdministrativa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const auditorId = req.user.id;
    
    const result = await auditoriaMultiService.aprobarAdministrativa(
      parseInt(id), 
      auditorId, 
      comentario
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

**Services** (`/services`):
- Business logic implementation
- Orchestrate multiple operations
- Transaction management
- Call repositories for data access

```typescript
// ✅ Service pattern with transaction
async aprobarAdministrativa(id: number, auditorId: number, comentario?: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Business logic
    const [presupuesto] = await connection.query(/* ... */);
    await connection.query(/* Update estado */);
    await connection.query(/* Insert auditoria */);
    await this.notificarUsuario(/* ... */);
    
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

**Repositories** (`/repositories`):
- Direct database access
- Execute SQL queries
- Map results to types
- No business logic

#### DRY Principle - Generic Methods
**Extract common patterns** into reusable methods:

```typescript
// ✅ Generic method pattern
private async aprobarGenerico(
  id: number,
  auditorId: number,
  estadoAnterior: string,
  estadoNuevo: string,
  gerenciaNombre: string,
  comentario?: string
) {
  // Shared approval logic
}

// Usage
async aprobarAdministrativa(id: number, auditorId: number, comentario?: string) {
  return this.aprobarGenerico(
    id, 
    auditorId, 
    'en_revision_administrativa', 
    'aprobado', 
    'G. Administrativa', 
    comentario
  );
}
```

#### Error Handling Pattern
**Centralized error handling** with custom error class:

```typescript
// ✅ Custom error class
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage in services
if (presupuesto.length === 0) {
  throw new AppError(404, 'Presupuesto no encontrado');
}

if (presupuesto[0].revisor_id !== auditorId) {
  throw new AppError(403, 'No tienes permiso para auditar este caso');
}
```

#### Transaction Pattern
**Always use transactions** for multi-step operations:

```typescript
// ✅ Transaction pattern
const connection = await pool.getConnection();

try {
  await connection.beginTransaction();
  
  // Multiple operations
  await connection.query(/* Operation 1 */);
  await connection.query(/* Operation 2 */);
  await connection.query(/* Operation 3 */);
  
  await connection.commit();
  return { success: true };
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release(); // Always release connection
}
```

#### Logging Pattern
**Structured logging** with Winston:

```typescript
// ✅ Logging pattern
import { logger } from '../utils/logger';

// Info logs
logger.info('Presupuesto aprobado', { 
  presupuestoId: id, 
  auditor: auditorId, 
  gerencia: gerenciaNombre 
});

// Warning logs
logger.warn('Presupuesto rechazado', { 
  presupuestoId: id, 
  motivo: comentario 
});

// Error logs
logger.error('Error al procesar presupuesto', { 
  error: error.message,
  stack: error.stack 
});
```

### Frontend Patterns

#### Custom Hooks Pattern
**Extract reusable logic** into custom hooks:

```typescript
// ✅ Custom hook pattern
export const usePdfGenerator = (data: PresupuestoData) => {
  const generarPDF = useCallback(() => {
    pdfClientService.generarYDescargar(data);
  }, [data]);
  
  return { generarPDF };
};

// Usage in components
const { generarPDF } = usePdfGenerator({
  presupuestoId,
  datosHistorial,
  insumosSeleccionados,
  // ... other data
});
```

#### State Management Pattern
**Local state with useState**, **derived state with useMemo**:

```typescript
// ✅ State management
const [insumosSeleccionados, setInsumosSeleccionados] = useState<any[]>([]);
const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<any[]>([]);

// Derived state with useMemo
const rentabilidadFinal = useMemo(
  () => financiadorInfo?.dias_cobranza_real ? rentabilidadConPlazo : rentabilidad,
  [financiadorInfo, rentabilidadConPlazo, rentabilidad]
);
```

#### Callback Optimization
**Use useCallback** for functions passed as props:

```typescript
// ✅ useCallback for optimization
const handleNuevoPresupuesto = useCallback(() => {
  resetPresupuesto();
  resetTotales();
  setInsumosSeleccionados([]);
  setPrestacionesSeleccionadas([]);
  setActiveTab('datos');
}, [resetPresupuesto, resetTotales]);

const handleFinanciadorChange = useCallback(
  (id: string | null, info: any) => {
    setFinanciadorId(id);
    setFinanciadorInfo(info);
  },
  [setFinanciadorId, setFinanciadorInfo]
);
```

#### Component Composition
**Small, focused components** composed into larger features:

```typescript
// ✅ Component composition
export default function UserDashboard() {
  return (
    <Container>
      <Tabs>
        <Tabs.Panel value="datos">
          <DatosPresupuesto {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="insumos">
          <Insumos {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="prestaciones">
          <Prestaciones {...props} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
```

#### Service Layer Pattern
**Centralized API calls** in service modules:

```typescript
// ✅ Service layer
export const pdfClientService = {
  generarYDescargar(data: PresupuestoData) {
    const doc = new jsPDF();
    // PDF generation logic
    doc.save(`presupuesto-${data.presupuestoId}.pdf`);
  }
};

// Usage in components
import { pdfClientService } from '../services/pdfClientService';

const generarPDF = () => {
  pdfClientService.generarYDescargar(datos);
};
```

## Common Code Idioms

### Database Query Patterns

#### Parameterized Queries
**Always use parameterized queries** to prevent SQL injection:

```typescript
// ✅ Parameterized queries
const [presupuesto] = await connection.query<RowDataPacket[]>(
  'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
  [id]
);

// Multiple parameters
await connection.query(
  `INSERT INTO auditorias_presupuestos 
   (presupuesto_id, version_presupuesto, auditor_id, comentario)
   VALUES (?, ?, ?, ?)`,
  [id, version, auditorId, comentario]
);
```

#### FOR UPDATE Locking
**Use FOR UPDATE** for FCFS (First Come First Served) assignment:

```typescript
// ✅ Row-level locking pattern
const [presupuesto] = await connection.query<RowDataPacket[]>(
  `SELECT p.*, u.username as revisor_nombre
   FROM presupuestos p
   LEFT JOIN usuarios u ON p.revisor_id = u.id
   WHERE p.idPresupuestos = ? 
   FOR UPDATE`,
  [presupuestoId]
);

// Check if already assigned
if (caso.revisor_id !== null && caso.revisor_id !== usuarioId) {
  throw new AppError(409, `Ya está siendo revisado por ${caso.revisor_nombre}`);
}
```

#### Bulk Insert Pattern
**Insert notifications** for all users in a role:

```typescript
// ✅ Bulk insert with subquery
await connection.query(`
  INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
  SELECT u.id, ?, ?, ?, ?
  FROM usuarios u 
  WHERE u.rol = ? AND u.activo = 1
`, [presupuestoId, version, tipo, mensaje, rol]);
```

### React Patterns

#### Conditional Rendering
**Use logical AND (&&)** for simple conditionals:

```typescript
// ✅ Conditional rendering
{presupuestoId && (
  <Paper>
    <Text>Presupuesto #{presupuestoId}</Text>
  </Paper>
)}

{alertas.length > 0 && (
  <Paper>
    <Text>Alertas ({alertas.length})</Text>
  </Paper>
)}
```

#### Array Mapping
**Map arrays to components** with proper keys:

```typescript
// ✅ Array mapping
{data.insumos.map(i => [
  i.producto,
  i.cantidad.toString(),
  `$${Number(i.costo).toFixed(2)}`,
  `$${(Number(i.costo) * i.cantidad).toFixed(2)}`
])}
```

#### Event Handler Pattern
**Async event handlers** with try-catch:

```typescript
// ✅ Async event handler
const handlePedirAuditoria = useCallback(
  async (mensaje: string) => {
    if (!presupuestoId) return;
    
    setEnviandoAuditoria(true);
    try {
      await finalizarPresupuesto(totales);
      await api.put(`/auditoria/pedir/${presupuestoId}`, { mensaje });
      
      notifications.show({
        title: "Auditoría Solicitada",
        message: "La Gerencia será notificada",
        color: "blue",
      });
      
      handleNuevoPresupuesto();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Error al solicitar auditoría",
        color: "red",
      });
    } finally {
      setEnviandoAuditoria(false);
    }
  },
  [presupuestoId, finalizarPresupuesto, handleNuevoPresupuesto]
);
```

### Utility Functions

#### Currency Formatting
**Consistent currency formatting** with Intl.NumberFormat:

```typescript
// ✅ Currency formatter
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);

// Usage
<Text>{formatCurrency(totalFacturar)}</Text>
```

#### Date Formatting
**Locale-aware date formatting**:

```typescript
// ✅ Date formatting
doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 20, yPos);
doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, 105, 285);
```

## Security Best Practices

### Authentication & Authorization

#### JWT Token Validation
**Middleware pattern** for protected routes:

```typescript
// ✅ Auth middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};
```

#### Role-Based Access Control
**Check user roles** before executing actions:

```typescript
// ✅ Role validation
if (presupuesto[0].revisor_id !== auditorId) {
  throw new AppError(403, 'No tienes permiso para auditar este caso');
}

// Middleware for role checking
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};
```

### Input Validation

#### Parameter Validation
**Validate all inputs** before processing:

```typescript
// ✅ Input validation
if (!id || !auditorId) {
  throw new AppError(400, 'ID de presupuesto y auditor son requeridos');
}

if (!motivo || motivo.trim().length < 10) {
  throw new AppError(400, 'Debe especificar motivo (mínimo 10 caracteres)');
}
```

### CORS Configuration
**Whitelist allowed origins**:

```typescript
// ✅ CORS configuration
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting
**Prevent abuse** with rate limiting:

```typescript
// ✅ Rate limiting
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // 500 requests per window
}));
```

## Performance Optimization

### Database Optimization

#### Use Indexes
**Create indexes** for frequently queried columns:

```sql
-- ✅ Performance indexes
CREATE INDEX idx_presupuestos_estado_fecha ON presupuestos(estado, fecha_creacion);
CREATE INDEX idx_presupuestos_usuario_estado ON presupuestos(usuario_id, estado);
CREATE INDEX idx_auditorias_presupuesto_fecha ON auditorias_presupuestos(presupuesto_id, fecha_auditoria);
```

#### Connection Pooling
**Reuse database connections**:

```typescript
// ✅ Connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});
```

### Frontend Optimization

#### Memoization
**Use useMemo** for expensive computations:

```typescript
// ✅ Memoization
const rentabilidadFinal = useMemo(
  () => financiadorInfo?.dias_cobranza_real ? rentabilidadConPlazo : rentabilidad,
  [financiadorInfo, rentabilidadConPlazo, rentabilidad]
);
```

#### Callback Optimization
**Use useCallback** to prevent unnecessary re-renders:

```typescript
// ✅ useCallback
const handleFinalizarPresupuesto = useCallback(async () => {
  // Logic
}, [dependencies]);
```

## Testing Patterns

### Backend Testing
**Use Jest + Supertest** for API testing:

```typescript
// ✅ API test pattern
describe('POST /api/auditoria-multi/aprobar/:id', () => {
  it('should approve budget', async () => {
    const response = await request(app)
      .post('/api/auditoria-multi/aprobar/123')
      .set('Authorization', `Bearer ${token}`)
      .send({ comentario: 'Aprobado' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Documentation Requirements

### README Updates
**Update README.md** when adding features:
- Add to "Características Principales" section
- Update version number
- Add to "Historial de Versiones"

### API Documentation
**Document endpoints** in RUTAS_API.md:
- Endpoint path and method
- Request parameters
- Response format
- Example usage

### Architecture Documentation
**Update ARCHITECTURE_V2.md** when changing structure:
- New components or services
- Data flow changes
- Database schema changes

## Git Workflow

### Commit Messages
**Use conventional commits**:

```bash
# ✅ Good commit messages
git commit -m "feat: agregar hook usePdfGenerator para reutilización"
git commit -m "fix: corregir puerto backend de 3000 a 4000"
git commit -m "refactor: extraer lógica de PDF a servicio separado"
git commit -m "docs: actualizar SISTEMA_MULTI_GERENCIAL_V3.md"

# Prefixes
# feat: New feature
# fix: Bug fix
# refactor: Code refactoring
# docs: Documentation changes
# style: Code formatting
# test: Adding tests
# chore: Maintenance tasks
```

### Branch Strategy
**Feature branches** for new development:

```bash
# Create feature branch
git checkout -b feature/nombre-feature

# Merge to main when complete
git checkout main
git merge feature/nombre-feature
```

## Code Review Checklist

Before submitting code:
- [ ] No duplicated code (DRY principle)
- [ ] Proper error handling with try-catch
- [ ] Input validation for all user inputs
- [ ] Transactions for multi-step database operations
- [ ] Logging for important operations
- [ ] TypeScript types defined (no `any` unless necessary)
- [ ] Comments for complex logic
- [ ] Imports organized and unused imports removed
- [ ] No console.logs in production code
- [ ] Documentation updated (README, API docs, etc.)
- [ ] Commit messages follow convention
