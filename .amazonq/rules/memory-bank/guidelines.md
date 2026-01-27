# Development Guidelines

## Code Quality Standards

### TypeScript Configuration
- **Strict Mode**: TypeScript strict mode enabled in tsconfig.json
- **Type Safety**: Explicit types for all function parameters and return values
- **No Any**: Avoid `any` type; use proper interfaces or generics
- **Type Definitions**: Custom types defined in dedicated `types/` directories
- **Interface Naming**: PascalCase for interfaces (e.g., `Presupuestos`, `FinanciadorServicio`)

### Code Formatting
- **Indentation**: 2 spaces (consistent across backend and frontend)
- **Line Length**: No strict limit, but prefer readability
- **Semicolons**: Required at end of statements
- **Quotes**: Single quotes for strings in backend, double quotes acceptable in frontend
- **Trailing Commas**: Used in multi-line objects and arrays
- **Arrow Functions**: Preferred over function expressions

### Naming Conventions
- **Variables**: camelCase (e.g., `presupuestoId`, `financiadorInfo`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `ICON_SIZE`, `DEFAULT_RULES`)
- **Functions**: camelCase with descriptive verbs (e.g., `handleFinalizarPresupuesto`, `tomarCaso`)
- **Classes**: PascalCase (e.g., `AuditoriaMultiService`, `AppError`)
- **Interfaces**: PascalCase (e.g., `Presupuestos`, `RowDataPacket`)
- **Files**: camelCase for utilities, PascalCase for components (e.g., `UserDashboard.tsx`, `asyncHandler.ts`)
- **Database Tables**: snake_case (e.g., `presupuesto_insumos`, `auditorias_presupuestos`)
- **Database Columns**: snake_case (e.g., `valor_asignado`, `fecha_inicio`)

### Documentation
- **JSDoc Comments**: Used for API routes with Swagger annotations
- **Inline Comments**: Explain complex business logic, not obvious code
- **Section Headers**: Use comment blocks to separate logical sections (e.g., `// ============================================`)
- **TODO Comments**: Avoided; use issue tracking instead

## Semantic Patterns

### Backend Patterns

#### 1. Route Definition Pattern
```typescript
// Validation middleware first
const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID debe ser un número válido' });
  }
  next();
};

// Route with middleware chain
router.get('/admin/:id', 
  authenticateToken,      // Auth first
  requireAdmin,           // Role check second
  validateId,             // Validation third
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Action description', { id, usuario: req.user.id });
    const resultado = await controller.method(req, res, () => {});
    return resultado;
  })
);
```

**Frequency**: Used in 100% of route definitions (equipamientos.ts, all route files)

#### 2. Service Layer Transaction Pattern
```typescript
async methodName(id: number, userId: number) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. Query with FOR UPDATE for pessimistic locking
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM table WHERE id = ? FOR UPDATE',
      [id]
    );
    
    // 2. Validation
    if (rows.length === 0) throw new AppError(404, 'Not found');
    if (rows[0].field !== expected) throw new AppError(403, 'Forbidden');
    
    // 3. Update operations
    await connection.query('UPDATE ...', [params]);
    
    // 4. Audit trail
    await connection.query('INSERT INTO auditorias ...', [params]);
    
    // 5. Notifications
    await this.notificarGerencia(connection, ...);
    
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

**Frequency**: Used in 100% of service methods with database writes (auditoriaMultiService.ts)

#### 3. Error Handling Pattern
```typescript
// Custom error class
throw new AppError(statusCode, 'User-friendly message');

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Frequency**: Used in 100% of async route handlers

#### 4. Logging Pattern
```typescript
logger.info('Action description', { 
  presupuestoId: id, 
  usuario: req.user.id,
  additionalContext: value 
});

logger.warn('Warning message', { context });
logger.error('Error message', { error, context });
```

**Frequency**: Used at entry and exit of all critical operations

#### 5. Configuration with Fallback Pattern
```typescript
const DEFAULT_RULES = {
  category: {
    field: defaultValue,
  },
};

let cachedRules = { ...DEFAULT_RULES };
let lastFetch = 0;
const CACHE_TTL = 60000;

async function loadFromDB() {
  try {
    // Load from database
    lastFetch = Date.now();
  } catch (error) {
    console.error('Using defaults:', error);
  }
}

export async function getRules() {
  if (Date.now() - lastFetch > CACHE_TTL) {
    await loadFromDB();
  }
  return cachedRules;
}
```

**Frequency**: Used for all configurable business rules (businessRules.ts)

### Frontend Patterns

#### 1. Custom Hook Pattern
```typescript
export function useCustomHook(dependencies: any) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handler = useCallback(() => {
    // Logic
  }, [dependencies]);
  
  return { state, handler };
}
```

**Frequency**: Used for all reusable logic (usePresupuesto, useTotales, useFinanciador)

#### 2. Component State Management Pattern
```typescript
export default function Component() {
  // 1. Hooks first
  const { user, logout } = useAuth();
  const [localState, setLocalState] = useState(initial);
  
  // 2. Derived state with useMemo
  const computed = useMemo(() => {
    return calculation(state);
  }, [state]);
  
  // 3. Callbacks with useCallback
  const handleAction = useCallback(async () => {
    // Logic
  }, [dependencies]);
  
  // 4. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 5. Render
  return <JSX />;
}
```

**Frequency**: Used in 100% of functional components (UserDashboard.tsx)

#### 3. API Call Pattern
```typescript
try {
  const response = await api.post('/endpoint', data);
  
  notifications.show({
    title: 'Success',
    message: 'Operation completed',
    color: 'green',
    position: 'top-center',
    autoClose: 5000,
  });
  
  // Update state
  setState(response.data);
  
} catch (error) {
  console.error('Error:', error);
  notifications.show({
    title: 'Error',
    message: 'Operation failed',
    color: 'red',
    position: 'top-center',
    autoClose: false,
  });
}
```

**Frequency**: Used in 100% of API interactions

#### 4. Modal State Pattern
```typescript
const [modalOpened, setModalOpened] = useState(false);
const [modalData, setModalData] = useState<any>(null);

const openModal = useCallback((data: any) => {
  setModalData(data);
  setModalOpened(true);
}, []);

const closeModal = useCallback(() => {
  setModalOpened(false);
  setModalData(null);
}, []);

// In JSX
<Modal opened={modalOpened} onClose={closeModal}>
  {/* Content */}
</Modal>
```

**Frequency**: Used for all modal interactions

#### 5. Conditional Rendering Pattern
```typescript
// Boolean conditions
{condition && <Component />}

// Ternary for alternatives
{condition ? <ComponentA /> : <ComponentB />}

// Multiple conditions
{state === 'loading' && <Loader />}
{state === 'error' && <Error />}
{state === 'success' && <Content />}

// Role-based rendering
{user?.rol === 'admin' && <AdminPanel />}
```

**Frequency**: Used throughout all components

## Internal API Usage

### Database Query Patterns

#### 1. Parameterized Queries (ALWAYS)
```typescript
// ✅ CORRECT - Prevents SQL injection
await connection.query(
  'SELECT * FROM table WHERE id = ? AND status = ?',
  [id, status]
);

// ❌ WRONG - SQL injection vulnerability
await connection.query(
  `SELECT * FROM table WHERE id = ${id}`
);
```

#### 2. Transaction with FOR UPDATE
```typescript
// For FCFS assignment and concurrent updates
const [rows] = await connection.query<RowDataPacket[]>(
  'SELECT * FROM presupuestos WHERE id = ? FOR UPDATE',
  [id]
);
```

**Use Case**: Prevents race conditions in multi-user scenarios (audit assignment)

#### 3. Typed Query Results
```typescript
// Use custom interfaces from types/database.ts
const [presupuestos] = await pool.query<Presupuestos[]>(
  'SELECT * FROM presupuestos WHERE estado = ?',
  [estado]
);

// Access with type safety
presupuestos.forEach(p => {
  console.log(p.idPresupuestos, p.Nombre_Apellido);
});
```

#### 4. Avoid Multiple JOINs with Aggregations (CRITICAL)
```typescript
// ❌ WRONG - Multiple LEFT JOINs with SUM() multiply values
await pool.query(`
  SELECT p.*, 
    SUM(i.costo * i.cantidad) as total_insumos,
    SUM(pr.valor_facturar * pr.cantidad) as total_prestaciones
  FROM presupuestos p
  LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
  LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
  WHERE p.idPresupuestos = ?
`, [id]);

// ✅ CORRECT - Separate queries or read from pre-calculated columns
const [presupuesto] = await pool.query(
  'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
  [id]
);
const [insumos] = await pool.query(
  'SELECT * FROM presupuesto_insumos WHERE idPresupuestos = ?',
  [id]
);
const [prestaciones] = await pool.query(
  'SELECT * FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
  [id]
);
```

**Use Case**: Prevents value multiplication bug when querying related tables

### Mantine UI Component Usage

#### 1. Form Components
```typescript
import { TextInput, Select, Checkbox, Button } from '@mantine/core';

<TextInput
  label="Label"
  value={value}
  onChange={(e) => setValue(e.currentTarget.value)}
  required
  error={error}
/>

<Select
  label="Label"
  data={options}
  value={value}
  onChange={setValue}
  searchable
  clearable
/>
```

#### 2. Layout Components
```typescript
import { Group, Stack, Flex, Grid, Paper } from '@mantine/core';

// Horizontal layout
<Group gap="xs" justify="space-between">
  <Component1 />
  <Component2 />
</Group>

// Vertical layout
<Stack gap="md">
  <Component1 />
  <Component2 />
</Stack>

// Flexible layout
<Flex direction="column" gap="sm" align="center">
  <Component />
</Flex>
```

#### 3. Notification System
```typescript
import { notifications } from '@mantine/notifications';

notifications.show({
  title: 'Title',
  message: 'Message',
  color: 'green' | 'red' | 'blue' | 'orange',
  position: 'top-center',
  autoClose: 5000, // or false for persistent
});
```

### Authentication & Authorization

#### 1. JWT Token Pattern
```typescript
// Backend middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

#### 2. Role-Based Access Control
```typescript
// Backend
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  
  if (user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  next();
};

// Frontend
const { user } = useAuth();
{user?.rol === 'admin' && <AdminComponent />}
```

## Code Idioms

### 1. Optional Chaining
```typescript
// Safe property access
const value = object?.property?.nestedProperty;

// Safe array access
const first = array?.[0];

// Safe function call
callback?.();
```

**Frequency**: Used extensively throughout codebase

### 2. Nullish Coalescing
```typescript
// Default values for null/undefined
const value = input ?? defaultValue;

// Different from || which treats 0, '', false as falsy
const count = userInput ?? 0; // Preserves 0 if provided
```

**Frequency**: Used for all default value assignments

### 3. Destructuring
```typescript
// Object destructuring
const { id, nombre, activo } = objeto;

// Array destructuring
const [first, second] = array;

// Function parameters
function handler({ id, nombre }: { id: number; nombre: string }) {}
```

**Frequency**: Used in 90%+ of variable assignments

### 4. Spread Operator
```typescript
// Object spread
const updated = { ...original, field: newValue };

// Array spread
const combined = [...array1, ...array2];

// Function arguments
function fn(...args: any[]) {}
```

**Frequency**: Used for all immutable updates

### 5. Template Literals
```typescript
// String interpolation
const message = `Presupuesto ${id} de ${nombre}`;

// Multi-line strings
const query = `
  SELECT * 
  FROM table 
  WHERE condition
`;
```

**Frequency**: Used for all string concatenation

### 6. Async/Await
```typescript
// Always use async/await over .then()
async function handler() {
  try {
    const result = await asyncOperation();
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

**Frequency**: Used in 100% of asynchronous code

### 7. Array Methods
```typescript
// Map for transformation
const names = users.map(u => u.nombre);

// Filter for selection
const active = users.filter(u => u.activo);

// Find for single item
const user = users.find(u => u.id === targetId);

// Reduce for aggregation
const total = items.reduce((sum, item) => sum + item.precio, 0);
```

**Frequency**: Used instead of for loops in 95% of cases

## Popular Annotations

### Backend Swagger/JSDoc
```typescript
/**
 * @swagger
 * /api/endpoint/{id}:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success response
 *       404:
 *         description: Not found
 */
```

**Frequency**: Used on all public API routes

### TypeScript Type Annotations
```typescript
// Function signatures
async function method(
  id: number,
  userId: number,
  options?: { flag: boolean }
): Promise<{ success: boolean }> {
  // Implementation
}

// Interface extensions
interface Extended extends Base {
  additionalField: string;
}

// Generic types
function generic<T>(items: T[]): T | undefined {
  return items[0];
}
```

**Frequency**: Used on all functions and complex types

## Best Practices Summary

### Security
- Always use parameterized queries
- Validate all user input
- Use JWT for authentication
- Implement role-based access control
- Hash passwords with bcrypt
- Use HTTPS in production

### Performance
- Use connection pooling for database
- Implement caching for configuration
- Use indexes on frequently queried columns
- Batch database operations when possible
- Lazy load components in frontend
- Memoize expensive calculations

### Maintainability
- Keep functions small and focused
- Use descriptive variable names
- Separate concerns (controllers, services, repositories)
- Write self-documenting code
- Use TypeScript for type safety
- Follow DRY principle

### Testing
- Write unit tests for services
- Write integration tests for API endpoints
- Mock external dependencies
- Test error cases
- Use meaningful test descriptions

### Error Handling
- Use custom error classes
- Provide user-friendly error messages
- Log errors with context
- Handle errors at appropriate levels
- Always rollback transactions on error
- Show notifications to users

### Database Query Best Practices
- **NEVER use multiple LEFT JOINs with SUM()** - causes value multiplication
- Use separate queries for each related table (insumos, prestaciones, equipamientos)
- Read pre-calculated totals from presupuestos table columns directly
- Only recalculate totals when items are added/removed/updated
- Store "a facturar" values in total_* columns, not cost values

### Code Organization
- Group related functionality
- Use barrel exports (index.ts)
- Keep files focused and small
- Use consistent file structure
- Separate business logic from presentation
- Use dependency injection where appropriate
