# Technology Stack

## Programming Languages

### Backend
- **TypeScript 5.9.3**: Primary language for backend development
- **Node.js 18+**: Runtime environment
- **SQL**: Database queries and migrations

### Frontend
- **TypeScript 5.9.3**: Primary language for frontend development
- **JavaScript (JSX/TSX)**: React components
- **CSS**: Styling

## Frameworks & Libraries

### Backend Stack
- **Express 4.18.2**: Web framework for REST API
- **mysql2 3.3.0**: MySQL database driver with promise support
- **jsonwebtoken 9.0.2**: JWT authentication
- **bcrypt 6.0.0**: Password hashing
- **winston 3.19.0**: Logging framework
- **winston-daily-rotate-file 5.0.0**: Log rotation
- **node-cache 5.1.2**: In-memory caching
- **helmet 7.2.0**: Security headers
- **cors 2.8.5**: Cross-origin resource sharing
- **express-rate-limit 7.5.1**: Rate limiting
- **cookie-parser 1.4.7**: Cookie parsing
- **swagger-jsdoc 6.2.8**: API documentation generation
- **swagger-ui-express 5.0.1**: API documentation UI

### Frontend Stack
- **React 18.2.0**: UI framework
- **Vite 7.2.2**: Build tool and dev server
- **@mantine/core 7.17.8**: UI component library
- **@mantine/hooks 7.17.8**: React hooks collection
- **@mantine/notifications 7.17.8**: Toast notifications
- **@mantine/form 8.3.8**: Form management
- **@tanstack/react-table 8.21.3**: Data table component
- **mantine-react-table 2.0.0-beta.9**: Advanced table features
- **jspdf 3.0.3**: PDF generation
- **jspdf-autotable 5.0.2**: PDF table generation
- **@emotion/react 11.14.0**: CSS-in-JS styling
- **@heroicons/react 2.2.0**: Icon library

### Development Tools
- **tsx 4.20.6**: TypeScript execution for development
- **ts-node 10.9.2**: TypeScript execution
- **jest 29.7.0**: Testing framework
- **ts-jest 29.4.5**: Jest TypeScript support
- **supertest 6.3.4**: HTTP testing
- **eslint 8.57.1**: Code linting
- **prettier 3.6.2**: Code formatting
- **concurrently 8.2.2**: Run multiple commands

## Database

### MySQL 8.0+
- **Connection Pooling**: mysql2 with promise support
- **Migrations**: SQL files in backend/migrations/
- **Indexes**: Optimized for high-volume queries
- **Transactions**: FOR UPDATE locks for FCFS assignment
- **Temporal Data**: Historical values with validity periods

### Key Tables
- **presupuestos**: Budget main table with versioning
- **presupuesto_insumos**: Budget supplies with historical prices
- **presupuesto_prestaciones**: Budget services with historical values
- **presupuesto_equipamientos**: Budget equipment with historical values
- **prestador_servicio_valores**: Historical service values by period/branch
- **equipamiento_valores**: Historical equipment values by period/branch
- **auditorias_presupuestos**: Audit trail with complete history
- **tipos_unidad**: Service types with configurable alerts
- **tipos_equipamiento**: Equipment types with configurable alerts
- **usuarios**: User management with roles and branch assignment

## Build Systems

### Backend Build
- **TypeScript Compiler (tsc)**: Compiles TS to JS
- **tsx**: Development execution with watch mode
- **Output**: dist/ directory

### Frontend Build
- **Vite**: Fast build tool with HMR
- **esbuild**: JavaScript bundler (used by Vite)
- **Rollup**: Production bundler (used by Vite)
- **Output**: dist/ directory

## Development Commands

### Root Level (Workspace)
```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Run both backend and frontend concurrently
npm run dev
```

### Backend Commands
```bash
cd backend

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Frontend Commands
```bash
cd frontend

# Development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Commands
```bash
# Run migration
mysql -u root -p mh_1 < backend/migrations/[migration_file].sql

# Example: Historical values migration
mysql -u root -p mh_1 < backend/migrations/create_prestador_servicio_valores.sql

# Example: Multi-management migration
mysql -u root -p mh_1 < backend/migrations/001_migrate_multi_gerencial.sql

# Example: Equipment types migration
mysql -u root -p mh_1 < backend/migrations/006_create_tipos_equipamiento.sql
```

## Environment Configuration

### Backend (.env)
```env
# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mh_1

# Server
PORT=4000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:4000
```

## Port Configuration
- **Backend API**: Port 4000 (not 3000)
- **Frontend Dev Server**: Port 5173 (Vite default)
- **Database**: Port 3306 (MySQL default)

## Testing

### Backend Testing
- **Framework**: Jest with ts-jest
- **Test Files**: backend/tests/
- **Coverage**: Unit tests for services, integration tests for API
- **Mocking**: Supertest for HTTP testing

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- auditoria-multi.test.ts
```

## Code Quality Tools

### Linting
- **ESLint**: TypeScript-specific rules
- **Config**: .eslintrc.json
- **Plugins**: @typescript-eslint/eslint-plugin

### Formatting
- **Prettier**: Consistent code formatting
- **Config**: .prettierrc
- **Integration**: Works with ESLint

### Type Checking
- **TypeScript**: Strict mode enabled
- **Config**: tsconfig.json
- **Type Definitions**: @types/* packages

## Security

### Authentication
- **JWT**: Token-based authentication
- **Expiration**: 1 hour default
- **Storage**: localStorage (frontend)
- **Transmission**: HTTP headers (Authorization: Bearer)

### Password Security
- **Hashing**: bcrypt with salt rounds
- **Storage**: Hashed passwords in database
- **Validation**: Minimum length requirements

### API Security
- **Helmet**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Express rate limit middleware
- **Input Validation**: Request validation middleware

## Real-Time Communication

### SSE (Server-Sent Events)
- **Endpoint**: /api/sse/stream
- **Protocol**: HTTP with text/event-stream
- **Reconnection**: Automatic client-side reconnection
- **Events**: Budget state changes, audit notifications
- **Connection Indicator**: Visual indicator in all dashboards

## Logging

### Winston Configuration
- **Levels**: error, warn, info, debug
- **Transports**: Console, daily rotate file
- **Location**: backend/logs/
- **Rotation**: Daily with date suffix
- **Format**: JSON with timestamps

## Docker Support

### Containers
- **Backend**: Node.js container
- **Frontend**: Nginx container
- **Database**: MySQL container

### Docker Compose
- **File**: docker-compose.yml
- **Production**: docker-compose.prod.yml
- **Networks**: Internal network for services

## API Documentation

### Swagger/OpenAPI
- **Endpoint**: /api-docs
- **Generator**: swagger-jsdoc
- **UI**: swagger-ui-express
- **Documentation**: SWAGGER_DOCUMENTACION_COMPLETA.md

## Version Control

### Git
- **.gitignore**: Excludes node_modules, .env, logs, dist
- **.gitattributes**: Line ending configuration
- **Branches**: Feature branches, main branch

## Performance Optimization

### Backend
- **Connection Pooling**: MySQL connection pool
- **Caching**: node-cache for configuration
- **Indexes**: Optimized database indexes
- **Query Optimization**: Avoid N+1 queries

### Frontend
- **Code Splitting**: Vite automatic splitting
- **Lazy Loading**: React.lazy for routes
- **Memoization**: React.memo for components
- **Bundle Optimization**: Terser minification
