# Project Structure - Sistema Presupuestador Web

## Overview
Monorepo structure with separate backend (Node.js/Express) and frontend (React/Vite) workspaces, sharing common configuration at root level.

## Root Directory Structure

```
presupuestador-web/
├── backend/              # API REST + SSE server
├── frontend/             # React SPA client
├── .amazonq/             # Amazon Q rules and memory bank
├── docs/                 # Comprehensive documentation (*.md files)
├── docker-compose.yml    # Development environment
├── docker-compose.prod.yml # Production environment
└── package.json          # Root workspace configuration
```

## Backend Structure (`/backend`)

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.ts   # Database connection config
│   ├── controllers/      # Request handlers
│   │   ├── alertasEquipamientosController.ts    # Equipment alerts
│   │   ├── alertasServiciosController.ts        # Service alerts
│   │   ├── auditoriaMultiController.ts          # Multi-management audit
│   │   ├── authController.ts                    # Authentication
│   │   ├── configuracionController.ts           # System configuration
│   │   ├── equipamientosController.ts           # Equipment CRUD + historical values
│   │   ├── financiadoresController.ts           # Payers management
│   │   ├── insumosController.ts                 # Medical supplies
│   │   ├── notificacionesController.ts          # Notifications
│   │   ├── prestacionesController.ts            # Medical services with historical
│   │   ├── prestadorValoresController.ts        # Provider service values
│   │   ├── presupuestosControllerV2.ts          # Budget versioning
│   │   ├── sseController.ts                     # Server-Sent Events
│   │   ├── sucursalesController.ts              # Branches
│   │   ├── tiposEquipamientoController.ts       # Equipment types
│   │   ├── tiposUnidadController.ts             # Unit types
│   │   └── usuariosController.ts                # Users management
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts # Global error handling
│   │   └── rateLimiter.ts  # Rate limiting
│   ├── repositories/     # Data access layer
│   │   ├── auditoriaRepository.ts               # Audit data access
│   │   ├── equipamientosRepository.ts           # Equipment data access
│   │   ├── notificacionesRepository.ts          # Notifications data access
│   │   ├── prestacionesRepository.ts            # Services data access
│   │   └── presupuestosRepository.ts            # Budgets data access
│   ├── routes/           # API route definitions
│   │   ├── alertasEquipamientos.ts
│   │   ├── alertasServicios.ts
│   │   ├── auditoriaMulti.ts
│   │   ├── auth.ts
│   │   ├── configuracion.ts
│   │   ├── equipamientos.ts
│   │   ├── financiadores.ts
│   │   ├── insumos.ts
│   │   ├── notificaciones.ts
│   │   ├── prestaciones.ts
│   │   ├── prestadorValores.ts
│   │   ├── presupuestos.ts
│   │   ├── sse.ts
│   │   ├── sucursales.ts
│   │   ├── tiposEquipamiento.ts
│   │   ├── tiposUnidad.ts
│   │   └── usuarios.ts
│   ├── services/         # Business logic layer
│   │   ├── auditoriaMultiService.ts             # Multi-management audit logic
│   │   ├── equipamientosService.ts              # Equipment business logic
│   │   ├── notificacionesService.ts             # Notifications logic
│   │   ├── pdfService.ts                        # PDF generation
│   │   ├── prestacionesService.ts               # Services business logic
│   │   ├── presupuestosService.ts               # Budgets business logic
│   │   └── sseService.ts                        # SSE connection management
│   ├── types/            # TypeScript type definitions
│   │   ├── auditoria.types.ts
│   │   ├── equipamiento.types.ts
│   │   ├── notificacion.types.ts
│   │   ├── prestacion.types.ts
│   │   └── presupuesto.types.ts
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # Winston logger configuration
│   │   └── validators.ts # Input validation helpers
│   ├── app.ts            # Express app configuration
│   ├── db.ts             # MySQL connection pool
│   └── swagger.ts        # Swagger/OpenAPI configuration
├── migrations/           # Database migrations (SQL)
│   ├── 001_migrate_multi_gerencial.sql          # Multi-management system
│   ├── 006_create_tipos_equipamiento.sql        # Equipment types
│   ├── 007_move_alertas_to_tipos.sql            # Alerts to types
│   ├── 008_estandarizar_nombres_alertas.sql     # Standardize alert names
│   ├── create_prestador_servicio_valores.sql    # Historical values
│   ├── add_sucursal_to_valores.sql              # Branch values
│   └── add_performance_indexes.sql              # Performance indexes
├── scripts/              # Utility scripts
│   ├── analytics/        # Analytics scripts
│   ├── maintenance/      # Maintenance scripts
│   └── migrations/       # Migration helpers
├── tests/                # Test files
│   └── api.test.ts
├── logs/                 # Winston logs (daily rotation)
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Backend dependencies
└── tsconfig.json         # TypeScript configuration
```

### Backend Key Components

#### Controllers
Handle HTTP requests, validate input, call services, return responses. Thin layer focused on HTTP concerns.

#### Services
Contain business logic, orchestrate repositories, implement complex workflows (versioning, audit rules, notifications).

#### Repositories
Direct database access using mysql2, execute queries, map results to types. Single source of truth for data access.

#### Middleware
- `auth.ts`: JWT token validation, role-based access control
- `errorHandler.ts`: Centralized error handling with logging
- `rateLimiter.ts`: Prevent abuse with express-rate-limit

#### SSE (Server-Sent Events)
- `sseService.ts`: Manages client connections, broadcasts events
- `sseController.ts`: Handles SSE endpoint, connection lifecycle
- Real-time notifications for audit state changes, new pending cases

## Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── api/              # API client configuration
│   │   └── api.ts        # Axios instance with interceptors
│   ├── components/       # Reusable React components
│   │   ├── Equipamiento.tsx                     # Equipment selector
│   │   ├── Insumos.tsx                          # Supplies selector
│   │   ├── ModalAuditoriaMulti.tsx              # Multi-audit modal
│   │   ├── ModalDetallePresupuesto.tsx          # Budget detail modal
│   │   ├── ModalEditarPresupuesto.tsx           # Budget edit modal
│   │   ├── ModalNuevoPresupuesto.tsx            # New budget modal
│   │   ├── Prestaciones.tsx                     # Services selector
│   │   └── ProtectedRoute.tsx                   # Route guard
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.tsx                      # Authentication state
│   ├── hooks/            # Custom React hooks
│   │   ├── useAlertaCotizador.tsx               # Outdated value alerts
│   │   ├── useApiInterceptor.tsx                # 401 error handling
│   │   ├── usePdfGenerator.tsx                  # PDF generation
│   │   └── useSessionExpiredNotification.tsx    # Session expiry notification
│   ├── pages/            # Page components (routes)
│   │   ├── admin/        # Admin panel pages
│   │   │   ├── AdminDashboard.tsx               # Main admin panel
│   │   │   ├── GestionAlertasEquipamientos.tsx  # Equipment alerts config
│   │   │   ├── GestionAlertasServicios.tsx      # Service alerts config
│   │   │   ├── GestionEquipamientos.tsx         # Equipment agreements
│   │   │   ├── GestionEquipamientosBase.tsx     # Equipment CRUD
│   │   │   ├── GestionFinanciadores.tsx         # Payers management
│   │   │   ├── GestionInsumos.tsx               # Supplies management
│   │   │   ├── GestionPrestaciones.tsx          # Services management
│   │   │   ├── GestionReglas.tsx                # Business rules config
│   │   │   ├── GestionSucursales.tsx            # Branches management
│   │   │   ├── GestionTiposEquipamiento.tsx     # Equipment types
│   │   │   ├── GestionTiposUnidad.tsx           # Unit types
│   │   │   ├── GestionUsuarios.tsx              # Users management
│   │   │   └── ServiciosPorPrestador.tsx        # Service values management
│   │   ├── gerencias/    # Management dashboards
│   │   │   ├── GerenciaAdministrativa.tsx       # Administrative management
│   │   │   ├── GerenciaFinanciera.tsx           # Financial management (read-only)
│   │   │   ├── GerenciaGeneral.tsx              # General management
│   │   │   └── GerenciaPrestacional.tsx         # Service management
│   │   ├── Login.tsx     # Login page
│   │   ├── Prestaciones.tsx                     # Services page with historical
│   │   └── UserDashboard.tsx                    # User dashboard
│   ├── services/         # API service layer
│   │   ├── auditoriaMultiService.ts             # Multi-audit API calls
│   │   ├── equipamientosService.ts              # Equipment API calls
│   │   ├── notificacionesService.ts             # Notifications API calls
│   │   ├── pdfClientService.ts                  # PDF generation client
│   │   ├── prestacionesService.ts               # Services API calls
│   │   └── presupuestosService.ts               # Budgets API calls
│   ├── styles/           # CSS files
│   │   └── global.css    # Global styles
│   ├── types/            # TypeScript type definitions
│   │   ├── auditoria.types.ts
│   │   ├── equipamiento.types.ts
│   │   ├── notificacion.types.ts
│   │   ├── prestacion.types.ts
│   │   └── presupuesto.types.ts
│   ├── utils/            # Utility functions
│   │   ├── formatters.ts # Date, currency formatters
│   │   └── validators.ts # Form validation
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # React entry point
│   └── index.css         # Base styles
├── public/               # Static assets
│   ├── favicon.ico
│   ├── logoMH.png
│   └── icon.png
├── .env                  # Environment variables
├── index.html            # HTML template
├── package.json          # Frontend dependencies
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

### Frontend Key Components

#### Pages
Full-page components mapped to routes. Handle page-level state, orchestrate multiple components.

#### Components
Reusable UI components. Focused on presentation and user interaction. Examples:
- `Equipamiento.tsx`: Equipment selector with search, filters, historical values
- `Insumos.tsx`: Supplies selector with percentage calculation
- `Prestaciones.tsx`: Services selector with financier-specific values
- `ModalAuditoriaMulti.tsx`: Multi-management audit actions (approve, reject, escalate, observe)

#### Hooks
Custom React hooks for reusable logic:
- `usePdfGenerator`: PDF generation logic shared across dashboards
- `useApiInterceptor`: Global 401 error detection with Observer pattern
- `useSessionExpiredNotification`: Session expiry notification
- `useAlertaCotizador`: Outdated value alerts (>45 days)

#### Services
API client layer using axios. Centralized API calls with error handling, token management.

#### Contexts
React Context for global state:
- `AuthContext`: User authentication, role, permissions, logout

## Architectural Patterns

### Backend Patterns

#### Layered Architecture
```
Routes → Controllers → Services → Repositories → Database
```
- **Routes**: Define endpoints, apply middleware
- **Controllers**: Handle HTTP, validate input
- **Services**: Business logic, orchestration
- **Repositories**: Data access, SQL queries

#### Repository Pattern
Abstracts database access. Services don't write SQL, they call repository methods. Enables easier testing and database changes.

#### Service Layer Pattern
Business logic separated from HTTP concerns. Services can be called from controllers, scheduled jobs, or tests.

#### Observer Pattern (SSE)
- Clients subscribe to SSE endpoint
- Server broadcasts events to all connected clients
- Used for real-time notifications, audit state changes

### Frontend Patterns

#### Component Composition
Small, focused components composed into larger features. Example: `UserDashboard` uses `Insumos`, `Prestaciones`, `Equipamiento` components.

#### Custom Hooks Pattern
Extract reusable logic into hooks:
```typescript
const { generarPDF } = usePdfGenerator(datos);
const useApiInterceptor(); // Global 401 handling
```

#### Service Layer Pattern
API calls abstracted into service modules. Components don't use axios directly, they call service methods.

#### Context + Hooks Pattern
Global state (auth) in Context, accessed via custom hook:
```typescript
const { user, logout } = useAuth();
```

#### Protected Routes Pattern
`ProtectedRoute` component wraps routes requiring authentication. Checks auth state, redirects to login if needed.

## Data Flow

### Creating a Budget
1. User fills form in `ModalNuevoPresupuesto`
2. Component calls `presupuestosService.crear()`
3. Service sends POST to `/api/presupuestos`
4. Backend controller validates, calls service
5. Service calculates totals, evaluates audit rules
6. Repository inserts into database
7. If audit required, SSE broadcasts to management dashboards
8. Response returns to frontend, modal closes, dashboard refreshes

### Multi-Management Audit Flow
1. Budget triggers audit rules → estado: `pendiente_auditoria`
2. SSE notifies management dashboards
3. Manager opens dashboard, sees pending case
4. Manager clicks "Tomar Caso" → FCFS lock with FOR UPDATE
5. Estado changes to `en_revision_administrativa`
6. Manager reviews, chooses action (approve, reject, escalate, observe)
7. Service executes transition, updates estado, creates audit record
8. SSE notifies user and other managers
9. If escalated, next management level receives notification
10. Process repeats until final approval/rejection

### Historical Values Query
1. Component needs service values for financier + branch + date
2. Calls `prestacionesService.obtenerValoresVigentes(financiadorId, sucursalId, fecha)`
3. Backend queries `prestador_servicio_valores` with date range
4. Applies priority logic: specific recent > general > specific obsolete
5. Returns values with metadata (fecha_inicio, fecha_fin, sucursal)
6. Component displays values, stores in budget items

## Database Schema Highlights

### Core Tables
- `presupuestos`: Main budget table with versioning (es_ultima_version, version_numero)
- `presupuesto_insumos`: Budget supplies with costo, precio_facturar
- `presupuesto_prestaciones`: Budget services with valor_asignado, valor_facturar
- `presupuesto_equipamientos`: Budget equipment with costo, precio_facturar
- `auditorias_presupuestos`: Audit trail with estado_anterior, estado_nuevo, accion, justificacion

### Historical Values
- `prestador_servicio_valores`: Service values with fecha_inicio, fecha_fin, sucursal_id
- `equipamiento_valores`: Equipment values with fecha_inicio, fecha_fin, sucursal_id

### Configuration
- `tipos_unidad`: Unit types with alert configuration (cantidad_maxima, mensaje_alerta, activo_alerta)
- `tipos_equipamiento`: Equipment types with alert configuration
- `configuracion_sistema`: System-wide settings (audit thresholds)

### Indexes
9 optimized indexes for high-volume queries:
- `idx_presupuestos_estado_fecha`: Estado + fecha_creacion
- `idx_presupuestos_usuario_estado`: Usuario + estado
- `idx_auditorias_presupuesto_fecha`: Presupuesto + fecha
- `idx_valores_vigencia`: Fecha_inicio + fecha_fin for historical queries
- And more for performance

## Configuration Files

### Backend
- `.env`: Database credentials, JWT secret, port (4000), CORS origin
- `tsconfig.json`: TypeScript strict mode, ES2020 target
- `.eslintrc.json`: TypeScript ESLint rules
- `.prettierrc`: Code formatting rules

### Frontend
- `.env`: API URL (http://localhost:4000)
- `vite.config.ts`: Vite dev server, build config
- `tsconfig.json`: TypeScript strict mode, React JSX

### Root
- `package.json`: Workspace configuration, concurrently scripts
- `docker-compose.yml`: MySQL + backend + frontend services
- `docker-compose.prod.yml`: Production configuration with nginx

## Documentation Structure

### Technical Docs
- `ARCHITECTURE_V2.md`: System architecture and design
- `RUTAS_API.md`: API endpoint documentation
- `SISTEMA_MULTI_GERENCIAL_V3.md`: Multi-management audit system
- `IMPLEMENTACION_VALORES_HISTORICOS.md`: Historical values system
- `SISTEMA_NOTIFICACIONES.md`: SSE and notifications
- `MODULO_EQUIPAMIENTO_ESPECIFICACION.md`: Equipment module spec

### User Docs
- `MANUAL_USUARIO_V2.md`: Complete user guide
- `README.md`: Project overview, installation, features

### Development Docs
- `BUENAS_PRACTICAS.md`: Development best practices
- `DEVOPS_ONBOARDING.md`: DevOps setup guide
- `DOCKER.md`: Docker deployment guide
