# Project Structure

## Directory Organization

```
presupuestador-web/
├── backend/                    # API REST + SSE Server
│   ├── src/
│   │   ├── config/            # Configuration files (business rules, cache)
│   │   ├── controllers/       # Request handlers
│   │   │   ├── prestadorValoresController.ts      # Historical service values
│   │   │   ├── equipamientosController.ts         # Equipment and values
│   │   │   ├── prestacionesController.ts          # Services with historical
│   │   │   ├── presupuestosControllerV2.ts        # Versioning system
│   │   │   └── alertasEquipamientosController.ts  # Equipment alerts
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth, error handling, validation
│   │   ├── repositories/      # Database access layer
│   │   ├── services/          # Business logic
│   │   │   └── auditoriaMultiService.ts           # Multi-management audit
│   │   ├── types/             # TypeScript type definitions
│   │   │   └── database.ts                        # Database types
│   │   ├── utils/             # Helper functions
│   │   ├── app.ts             # Express app setup
│   │   ├── db.ts              # Database connection
│   │   └── swagger.ts         # API documentation
│   ├── migrations/            # Database migrations
│   │   ├── create_prestador_servicio_valores.sql  # Historical values
│   │   ├── 001_migrate_multi_gerencial.sql        # Multi-management v3.0
│   │   ├── 006_create_tipos_equipamiento.sql      # Equipment types
│   │   ├── 007_move_alertas_to_tipos.sql          # Alerts to types
│   │   └── 008_estandarizar_nombres_alertas.sql   # Alert name standardization
│   ├── tests/                 # Unit and integration tests
│   └── logs/                  # Application logs
│
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/              # API client configuration
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Equipamiento.tsx                   # Equipment selector
│   │   │   └── Insumos.tsx                        # Supplies selector
│   │   ├── contexts/         # React contexts (auth, notifications)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   │   ├── admin/
│   │   │   │   ├── ServiciosPorPrestador.tsx      # Service values management
│   │   │   │   ├── GestionEquipamientos.tsx       # Equipment agreements
│   │   │   │   ├── GestionEquipamientosBase.tsx   # Equipment CRUD
│   │   │   │   ├── GestionAlertasServicios.tsx    # Alerts by type
│   │   │   │   └── GestionInsumos.tsx             # Supplies management
│   │   │   ├── UserDashboard.tsx                  # User main dashboard
│   │   │   ├── DatosPresupuesto.tsx               # Budget data form
│   │   │   └── Prestaciones.tsx                   # Historical integration
│   │   ├── services/         # Business logic services
│   │   ├── styles/           # CSS and styling
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Helper functions
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   └── public/               # Static assets
│
└── docs/                     # Additional documentation
    ├── ARCHITECTURE_V2.md
    ├── MANUAL_USUARIO_V2.md
    ├── SISTEMA_MULTI_GERENCIAL_V3.md
    └── MODULO_EQUIPAMIENTO_ESPECIFICACION.md
```

## Core Components

### Backend Architecture

#### Controllers Layer
- **presupuestosControllerV2.ts**: Budget versioning, CRUD operations, state transitions
- **prestadorValoresController.ts**: Historical service values by period and branch
- **equipamientosController.ts**: Equipment management with historical values
- **prestacionesController.ts**: Services with historical value integration
- **alertasEquipamientosController.ts**: Configurable alerts by equipment type
- **auditoriaController.ts**: Multi-management audit workflow

#### Services Layer
- **auditoriaMultiService.ts**: FCFS assignment, auto-release, state transitions
- Business logic separation from controllers
- Database transaction management
- Notification dispatching

#### Repositories Layer
- Database access abstraction
- Query optimization
- Connection pooling

#### Middleware
- **authMiddleware.ts**: JWT authentication, role-based access control
- **errorHandler.ts**: Centralized error handling
- **validation.ts**: Request validation

### Frontend Architecture

#### Pages
- **UserDashboard.tsx**: Main user interface for budget creation/editing
- **DatosPresupuesto.tsx**: Patient data and financier selection
- **Admin Pages**: Management interfaces for system configuration
- **Management Dashboards**: Specialized dashboards for each management role

#### Components
- **Equipamiento.tsx**: Equipment selector with historical values
- **Insumos.tsx**: Supplies selector with percentage calculation
- **Prestaciones.tsx**: Services selector with historical integration
- Reusable UI components (modals, tables, forms)

#### Hooks
- **useApiInterceptor**: Global 401 error detection
- **useSessionExpiredNotification**: Session expiration handling
- **usePdfGenerator**: PDF generation for budgets
- Custom hooks for data fetching and state management

#### Contexts
- **AuthContext**: User authentication state
- **NotificationContext**: SSE connection and notifications

## Architectural Patterns

### Backend Patterns
1. **Layered Architecture**: Controllers → Services → Repositories → Database
2. **Repository Pattern**: Database access abstraction
3. **Service Layer**: Business logic encapsulation
4. **Middleware Chain**: Request processing pipeline
5. **Observer Pattern**: SSE for real-time notifications
6. **Transaction Management**: Database consistency with FOR UPDATE locks

### Frontend Patterns
1. **Component Composition**: Reusable UI components
2. **Custom Hooks**: Logic extraction and reuse
3. **Context API**: Global state management
4. **Observer Pattern**: SSE event handling
5. **Form Management**: Mantine forms with validation
6. **Conditional Rendering**: Role-based UI

### Database Patterns
1. **Historical Values**: Temporal data with validity periods
2. **Soft Deletes**: Logical deletion with active flags
3. **Versioning**: Complete change history
4. **Optimistic Locking**: Version numbers for concurrency
5. **FCFS with FOR UPDATE**: Pessimistic locking for audit assignment
6. **Denormalization**: Performance optimization with calculated fields

## Key Relationships

### Data Flow
1. **Budget Creation**: User → DatosPresupuesto → API → Database
2. **Item Selection**: Component → API (historical values) → Display
3. **Audit Flow**: Budget → FCFS Assignment → Management Dashboard → State Transition
4. **Notifications**: State Change → SSE → All Connected Clients
5. **Versioning**: Edit Finalized → Create New Version → Update References

### Integration Points
- **Authentication**: JWT tokens in HTTP headers
- **Real-Time**: SSE connection on /api/sse/stream
- **API**: REST endpoints on /api/*
- **Database**: MySQL connection pool
- **File Generation**: jsPDF for PDF export

## Module Dependencies

### Backend Dependencies
- **express**: Web framework
- **mysql2**: Database driver
- **jsonwebtoken**: Authentication
- **bcrypt**: Password hashing
- **winston**: Logging
- **node-cache**: In-memory caching
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing

### Frontend Dependencies
- **react**: UI framework
- **@mantine/core**: UI component library
- **@mantine/notifications**: Toast notifications
- **jspdf**: PDF generation
- **@tanstack/react-table**: Data tables
- **vite**: Build tool

## Configuration Files

### Backend
- **.env**: Environment variables (DB credentials, JWT secret, ports)
- **tsconfig.json**: TypeScript configuration
- **jest.config.js**: Test configuration
- **.eslintrc.json**: Linting rules
- **.prettierrc**: Code formatting

### Frontend
- **.env**: API URL configuration
- **tsconfig.json**: TypeScript configuration
- **vite.config.ts**: Build configuration
- **index.html**: Entry HTML

### Root
- **package.json**: Workspace configuration with concurrently scripts
- **docker-compose.yml**: Container orchestration
- **.gitignore**: Version control exclusions
