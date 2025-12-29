# Technology Stack - Sistema Presupuestador Web

## Programming Languages

### TypeScript 5.9.3
- **Usage**: Primary language for both backend and frontend
- **Configuration**: Strict mode enabled, ES2020 target
- **Benefits**: Type safety, better IDE support, reduced runtime errors

### JavaScript (ES2020+)
- **Usage**: Build scripts, configuration files
- **Files**: `vite.config.ts`, migration scripts, utility scripts

### SQL
- **Usage**: Database migrations, queries, stored procedures
- **Dialect**: MySQL 8.0+ specific syntax

## Backend Stack

### Runtime & Framework
- **Node.js 18+**: JavaScript runtime
- **Express 4.18.2**: Web framework for REST API
- **tsx 4.20.6**: TypeScript execution for development (watch mode)

### Database
- **MySQL 8.0+**: Relational database
- **mysql2 3.3.0**: MySQL client with promise support
- **Connection Pool**: Configured in `src/db.ts`

### Authentication & Security
- **jsonwebtoken 9.0.2**: JWT token generation and validation
- **bcrypt 6.0.0**: Password hashing (10 rounds)
- **helmet 7.2.0**: Security headers middleware
- **express-rate-limit 7.5.1**: Rate limiting (100 req/15min)
- **cors 2.8.5**: Cross-Origin Resource Sharing

### Logging
- **winston 3.19.0**: Logging framework
- **winston-daily-rotate-file 5.0.0**: Log rotation
- **Configuration**: 
  - Combined logs: `logs/combined-YYYY-MM-DD.log`
  - Error logs: `logs/error-YYYY-MM-DD.log`
  - Retention: 14 days
  - Max size: 20MB per file

### Caching
- **node-cache 5.1.2**: In-memory caching
- **Usage**: Configuration values, frequently accessed data
- **TTL**: Configurable per cache entry

### API Documentation
- **swagger-jsdoc 6.2.8**: Generate OpenAPI spec from JSDoc
- **swagger-ui-express 5.0.1**: Serve Swagger UI
- **Endpoint**: `/api-docs`
- **Authentication**: Basic auth for production

### Development Tools
- **ts-node 10.9.2**: TypeScript execution
- **ts-node-dev 2.0.0**: Development server with auto-reload
- **eslint 8.57.1**: Linting with TypeScript support
- **prettier 3.6.2**: Code formatting
- **jest 29.7.0**: Testing framework
- **supertest 6.3.4**: HTTP assertions for testing

## Frontend Stack

### Framework & Build Tool
- **React 18.2.0**: UI library
- **Vite 7.2.2**: Build tool and dev server
- **@vitejs/plugin-react 4.7.0**: React plugin for Vite

### UI Framework
- **@mantine/core 7.17.8**: Component library
- **@mantine/hooks 7.17.8**: React hooks collection
- **@mantine/form 8.3.8**: Form management
- **@mantine/notifications 7.17.8**: Toast notifications
- **@emotion/react 11.14.0**: CSS-in-JS styling

### Data Tables
- **mantine-react-table 2.0.0-beta.9**: Advanced data tables
- **@tanstack/react-table 8.21.3**: Headless table library

### PDF Generation
- **jspdf 3.0.3**: PDF generation library
- **jspdf-autotable 5.0.2**: Table plugin for jsPDF

### HTTP Client
- **axios**: HTTP client (via api.ts wrapper)
- **Configuration**: 
  - Base URL: `http://localhost:4000`
  - Timeout: 30 seconds
  - Interceptors: 401 handling, token injection

### Icons
- **@heroicons/react 2.2.0**: Icon library

### Development Tools
- **TypeScript 5.9.3**: Type checking
- **terser 5.44.1**: JavaScript minification

## Database Technology

### MySQL 8.0+
- **Storage Engine**: InnoDB (default)
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Connection Pool**: 
  - Min: 5 connections
  - Max: 20 connections
  - Idle timeout: 60 seconds

### Key Features Used
- **Foreign Keys**: Referential integrity
- **Indexes**: 9 optimized indexes for performance
- **Transactions**: ACID compliance for audit operations
- **FOR UPDATE**: Row-level locking for FCFS assignment
- **Date Functions**: CURDATE(), DATE_ADD(), DATEDIFF()
- **JSON**: Not used (normalized schema)

## Development Environment

### Package Manager
- **npm**: Primary package manager
- **Workspaces**: Monorepo with backend/frontend workspaces

### Development Commands

#### Root Level
```bash
npm run dev                    # Start both backend and frontend
npm run install:all            # Install all dependencies
```

#### Backend
```bash
cd backend
npm run dev                    # Start dev server with watch mode (tsx)
npm run build                  # Compile TypeScript to JavaScript
npm start                      # Run compiled JavaScript
npm run lint                   # Run ESLint
npm run lint:fix               # Fix ESLint errors
npm run format                 # Format code with Prettier
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
```

#### Frontend
```bash
cd frontend
npm run dev                    # Start Vite dev server (port 5173)
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Environment Variables

#### Backend (.env)
```env
DB_HOST=127.0.0.1              # Database host
DB_USER=root                   # Database user
DB_PASSWORD=your_password      # Database password
DB_NAME=mh_1                   # Database name
PORT=4000                      # Server port (NOT 3000)
NODE_ENV=development           # Environment
FRONTEND_URL=http://localhost:5173  # CORS origin
SESSION_SECRET=your_secret     # Session secret
JWT_SECRET=your_jwt_secret     # JWT signing key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000  # Backend API URL
```

## Build & Deployment

### Development Build
- **Backend**: `tsx watch src/app.ts` (no compilation)
- **Frontend**: Vite dev server with HMR
- **Hot Reload**: Both backend and frontend support hot reload

### Production Build
- **Backend**: 
  - Compile: `tsc` → `dist/` folder
  - Run: `node dist/app.js`
- **Frontend**: 
  - Build: `vite build` → `dist/` folder
  - Serve: nginx or static file server

### Docker Support
- **Development**: `docker-compose.yml`
  - MySQL service
  - Backend service (port 4000)
  - Frontend service (port 5173)
- **Production**: `docker-compose.prod.yml`
  - MySQL service
  - Backend service
  - Frontend service with nginx

### Docker Commands
```bash
docker-compose up -d           # Start all services
docker-compose down            # Stop all services
docker-compose logs -f backend # View backend logs
docker-compose logs -f frontend # View frontend logs
```

## Database Migrations

### Migration Files
- **Location**: `backend/migrations/*.sql`
- **Naming**: `NNN_description.sql` (e.g., `001_migrate_multi_gerencial.sql`)
- **Execution**: Manual via MySQL CLI

### Running Migrations
```bash
# Connect to database
mysql -u root -p mh_1

# Run migration
mysql -u root -p mh_1 < backend/migrations/001_migrate_multi_gerencial.sql

# Verify
mysql -u root -p mh_1 -e "SHOW TABLES;"
```

### Key Migrations
- `create_prestador_servicio_valores.sql`: Historical values system
- `add_sucursal_to_valores.sql`: Branch-specific values
- `add_performance_indexes.sql`: Performance optimization
- `001_migrate_multi_gerencial.sql`: Multi-management system v3.0
- `006_create_tipos_equipamiento.sql`: Equipment types
- `007_move_alertas_to_tipos.sql`: Alerts to types
- `008_estandarizar_nombres_alertas.sql`: Standardize alert names

## Testing

### Backend Testing
- **Framework**: Jest 29.7.0
- **Assertions**: Supertest for HTTP testing
- **Configuration**: `jest.config.js`
- **Coverage**: Not yet configured
- **Run**: `npm test`

### Frontend Testing
- **Framework**: Not yet configured
- **Planned**: Vitest + React Testing Library

## Code Quality Tools

### Linting
- **ESLint 8.57.1**: JavaScript/TypeScript linting
- **@typescript-eslint/eslint-plugin 6.21.0**: TypeScript rules
- **@typescript-eslint/parser 6.21.0**: TypeScript parser
- **Configuration**: `.eslintrc.json`

### Formatting
- **Prettier 3.6.2**: Code formatting
- **Configuration**: `.prettierrc`
- **Integration**: ESLint + Prettier

### Type Checking
- **TypeScript 5.9.3**: Static type checking
- **Strict Mode**: Enabled
- **Configuration**: `tsconfig.json`

## API Communication

### REST API
- **Protocol**: HTTP/1.1
- **Format**: JSON
- **Authentication**: JWT Bearer tokens
- **Base URL**: `http://localhost:4000/api`

### Server-Sent Events (SSE)
- **Endpoint**: `/api/sse/stream`
- **Protocol**: text/event-stream
- **Reconnection**: Automatic with exponential backoff
- **Events**: 
  - `notification`: Audit state changes
  - `alert`: New pending cases
  - `connection`: Connection status

### Request/Response Format
```typescript
// Request
POST /api/presupuestos
Authorization: Bearer <token>
Content-Type: application/json

{
  "paciente": "Juan Pérez",
  "financiador_id": 1,
  "sucursal_id": 2
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "estado": "borrador",
    "version_numero": 1
  }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Performance Considerations

### Backend Optimizations
- **Connection Pooling**: Reuse database connections
- **Caching**: node-cache for configuration values
- **Indexes**: 9 optimized indexes for common queries
- **Pagination**: Limit results for large datasets
- **Lazy Loading**: Load related data only when needed

### Frontend Optimizations
- **Code Splitting**: Vite automatic code splitting
- **Lazy Loading**: React.lazy for route components
- **Memoization**: useMemo, useCallback for expensive computations
- **Debouncing**: Search inputs debounced (300ms)
- **Virtual Scrolling**: mantine-react-table for large datasets

### Database Optimizations
- **Indexes**: 
  - `idx_presupuestos_estado_fecha`: Estado + fecha_creacion
  - `idx_presupuestos_usuario_estado`: Usuario + estado
  - `idx_auditorias_presupuesto_fecha`: Presupuesto + fecha
  - `idx_valores_vigencia`: Fecha_inicio + fecha_fin
- **Query Optimization**: Avoid N+1 queries with JOINs
- **Connection Pooling**: Reuse connections

## Security Measures

### Authentication
- **JWT Tokens**: 1 hour expiration
- **Refresh Strategy**: Re-login required
- **Password Hashing**: bcrypt with 10 rounds
- **Token Storage**: localStorage (frontend)

### Authorization
- **Role-Based Access Control (RBAC)**: 
  - usuario_normal
  - gerencia_administrativa
  - gerencia_prestacional
  - gerencia_general
  - gerencia_financiera
  - super_admin
- **Middleware**: `auth.ts` validates roles per route

### Security Headers
- **helmet**: Sets security headers
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block

### Rate Limiting
- **express-rate-limit**: 100 requests per 15 minutes per IP
- **Endpoints**: All API routes

### CORS
- **Allowed Origins**: FRONTEND_URL from .env
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, PATCH

### Input Validation
- **Backend**: Manual validation in controllers
- **Frontend**: Mantine form validation
- **SQL Injection**: Prevented by parameterized queries (mysql2)

## Logging & Monitoring

### Winston Logger
- **Levels**: error, warn, info, debug
- **Transports**: 
  - Console (development)
  - File (production)
- **Format**: JSON with timestamps
- **Rotation**: Daily, 14 days retention

### Log Files
- `logs/combined-YYYY-MM-DD.log`: All logs
- `logs/error-YYYY-MM-DD.log`: Error logs only

### Monitoring
- **Not yet implemented**: 
  - Application Performance Monitoring (APM)
  - Error tracking (Sentry)
  - Metrics (Prometheus)

## Version Control

### Git
- **Repository**: Local/Private
- **Branching**: Not specified
- **Commit Convention**: Conventional Commits recommended
  - `feat:` New features
  - `fix:` Bug fixes
  - `refactor:` Code refactoring
  - `docs:` Documentation changes

## Dependencies Summary

### Backend Core Dependencies
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.3.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "cors": "^2.8.5",
  "helmet": "^7.2.0",
  "winston": "^3.19.0",
  "node-cache": "^5.1.2"
}
```

### Frontend Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@mantine/core": "^7.17.8",
  "@mantine/hooks": "^7.17.8",
  "@mantine/notifications": "^7.17.8",
  "jspdf": "^3.0.3",
  "jspdf-autotable": "^5.0.2"
}
```

## Browser Support

### Target Browsers
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- No IE11 support

### Required Features
- ES2020 support
- EventSource (SSE)
- localStorage
- Fetch API
- Promises/async-await
