# Arquitectura del Sistema - Presupuestador Web V2

## Índice
1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura General](#estructura-general)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Sistema de Notificaciones](#sistema-de-notificaciones)
6. [Sistema de Auditoría](#sistema-de-auditoría)
7. [Optimizaciones](#optimizaciones)
8. [Seguridad](#seguridad)
9. [Configuración de Alertas](#configuración-de-alertas)
10. [Configuración de Cálculos](#configuración-de-cálculos)

---

## Stack Tecnológico

### Backend
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js 4.18.2
- **Base de Datos**: MySQL 8.0+ con mysql2 driver
- **Autenticación**: JWT + bcrypt
- **Seguridad**: Helmet, CORS, Rate Limiting, CSRF Protection
- **Desarrollo**: tsx, ts-node, nodemon
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier

### Frontend
- **Framework**: React 18.2.0 + TypeScript
- **Build Tool**: Vite 7.2.2
- **UI Library**: Mantine 7.17.8
- **Tablas**: Mantine React Table + TanStack Table 8.21.3
- **Iconos**: Heroicons React 2.2.0
- **PDF**: jsPDF 3.0.3 + jsPDF-AutoTable 5.0.2
- **Estado**: React Hooks + Context API

### DevOps & Herramientas
- **Control de Versiones**: Git
- **Gestión de Dependencias**: npm
- **Variables de Entorno**: dotenv
- **Logging**: Winston (implementado)
- **Migraciones**: Scripts SQL personalizados

---

## Estructura General

```
presupuestador-web/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Lógica de endpoints
│   │   ├── middleware/       # Auth, CSRF, errores, validación
│   │   ├── routes/           # Definición de rutas
│   │   │   ├── admin/        # Rutas administrativas
│   │   │   ├── auth.ts       # Autenticación
│   │   │   ├── notificaciones-simple.ts
│   │   │   ├── auditoria-simple.ts
│   │   │   └── sse.ts        # Server-Sent Events
│   │   ├── utils/            # Utilidades (logger, validators)
│   │   ├── app.ts            # Configuración Express
│   │   └── db.ts             # Pool de conexiones MySQL
│   ├── migrations/           # Scripts SQL de migración
│   ├── scripts/              # Scripts de utilidad y migración
│   └── tests/                # Tests automatizados
│
└── frontend/
    ├── src/
    │   ├── components/       # Componentes React
    │   │   ├── alerts/       # Sistema de alertas inteligentes
    │   │   ├── Notificaciones.tsx
    │   │   └── Auditoria.tsx
    │   ├── hooks/            # Custom hooks
    │   │   └── useNotificationCount.tsx
    │   ├── pages/            # Páginas principales
    │   ├── services/         # Lógica de negocio y API
    │   ├── types/            # TypeScript types compartidos
    │   └── utils/            # Utilidades y constantes
    │       ├── calculations.ts
    │       ├── constants.ts
    │       └── sanitize.ts
    └── ...
```

---

## Backend

### Arquitectura en Capas Mejorada

```
Request → Rate Limit → CORS → Helmet → CSRF → Auth → Controller → Database → Response
            ↓           ↓       ↓        ↓      ↓         ↓
         (500/15min)  (Origin) (Headers) (Token) (JWT)  (asyncHandler)
                                                          (AppError)
                                                          (Logger)
```

### Componentes Clave

#### 1. Middleware Avanzado
- **`auth.ts`**: Autenticación JWT con refresh tokens
- **`csrf.ts`**: Protección CSRF con whitelist de orígenes
- **`errorHandler.ts`**: Manejo centralizado con logging
- **`validateInput.ts`**: Validaciones reutilizables con sanitización
- **Rate Limiting**: 500 requests por 15 minutos por IP

#### 2. Controllers Optimizados
- Uso de `asyncHandler` para manejo automático de errores
- Transacciones para operaciones complejas
- Paginación implementada (100 registros por defecto)
- Queries paralelas con `Promise.all`

#### 3. Database Layer
- **Connection Pool**: 10 conexiones máximo
- **Transacciones**: Para operaciones atómicas
- **Índices Optimizados**: En columnas de búsqueda frecuente
- **Queries Parametrizadas**: Prevención SQL injection

#### 4. Nuevas Funcionalidades
- **Sistema de Notificaciones**: Triggers automáticos + API REST
- **Sistema de Auditoría**: Workflow de aprobación médica
- **Server-Sent Events**: Notificaciones en tiempo real
- **Sistema de Versiones**: Control de cambios en presupuestos

---

## Frontend

### Arquitectura Reactiva Mejorada

```
UI Components → Hooks → Services → API
     ↓           ↓        ↓
  (Mantine)  (Estado)  (Lógica)
     ↓           ↓        ↓
  (Alerts)   (Memo)   (Retry)
     ↓           ↓        ↓
  (PDF)    (Callback) (Timeout)
```

### Componentes Principales

#### 1. Dashboard Unificado
- **UserDashboard**: 6 pestañas integradas
  - Datos Paciente
  - Insumos
  - Prestaciones
  - Historial
  - Notificaciones (con contador en tiempo real)
  - Auditoría (solo para auditor médico)

#### 2. Sistema de Alertas Inteligentes
- **Alertas de Rentabilidad**: 7 niveles con colores
- **Alertas de Monto**: Umbrales configurables
- **Alertas de Cobranza**: Basadas en días
- **Alertas de Tasa**: Detección de tasas altas

#### 3. Optimizaciones React
- **useMemo**: Filtrado de datos memoizado
- **useCallback**: Handlers optimizados
- **Lazy Loading**: Componentes bajo demanda
- **Error Boundaries**: Manejo de errores en UI

#### 4. Integración PDF Avanzada
- **jsPDF**: Generación de PDFs
- **AutoTable**: Tablas formateadas
- **Logos y Branding**: Personalización visual

---

## Sistema de Notificaciones

### Arquitectura Event-Driven

```
Database Trigger → Notificación → API → Frontend → UI Update
       ↓              ↓           ↓        ↓         ↓
   (Automático)   (Persistida)  (REST)  (Hook)   (Contador)
```

### Componentes

#### 1. Base de Datos
```sql
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT NOT NULL,
    tipo ENUM('nueva_version', 'aprobacion_requerida', 'estado_cambio'),
    mensaje TEXT NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Triggers Automáticos
- **Nueva Versión**: Notifica cuando se requiere aprobación
- **Cambio de Estado**: Informa cambios de estado
- **Asignación Automática**: A usuarios con permisos

#### 3. API Endpoints
- `GET /api/notificaciones` - Lista paginada
- `GET /api/notificaciones/count` - Contador no leídas
- `PUT /api/notificaciones/:id/leer` - Marcar como leída

#### 4. Frontend Integration
- **useNotificationCount**: Hook para contador en tiempo real
- **Componente Notificaciones**: Lista completa con filtros
- **Dot Rojo**: Indicador visual en pestaña

---

## Sistema de Auditoría

### Workflow de Aprobación

```
Usuario → Pedir Auditoría → Auditor Médico → Aprobar/Rechazar → Notificación
   ↓           ↓                ↓               ↓                ↓
(Crea)    (Cambia Estado)   (Revisa)      (Actualiza)      (Informa)
```

### Componentes

#### 1. Roles y Permisos
- **Usuario Normal**: Puede solicitar auditoría
- **Auditor Médico**: Puede aprobar/rechazar
- **Admin**: Gestión completa del sistema

#### 2. Estados de Presupuesto
- **borrador**: En edición
- **pendiente**: Requiere aprobación
- **aprobado**: Aprobado por auditor
- **rechazado**: Rechazado con comentarios

#### 3. Reglas Automáticas
```javascript
function evaluarEstadoAutomatico(datos) {
    if (datos.rentabilidad < 15) return 'pendiente';
    if (datos.costo_total > 150000) return 'pendiente';
    return 'borrador';
}
```

#### 4. Dashboard de Auditoría
- Lista de presupuestos pendientes
- Detalles completos del presupuesto
- Botones de Aprobar/Rechazar
- Campo de comentarios obligatorio

---

## Optimizaciones

### Backend Performance

#### 1. Database Optimizations
- **Connection Pooling**: 10 conexiones reutilizables
- **Query Optimization**: Índices en columnas críticas
- **Paginación**: Límite de 100 registros por consulta
- **Transacciones**: Operaciones atómicas

#### 2. API Optimizations
- **Parallel Queries**: `Promise.all` para consultas independientes
- **Error Handling**: Manejo centralizado con rollback
- **Logging**: Structured logging con Winston
- **Rate Limiting**: Protección contra abuso

### Frontend Performance

#### 1. React Optimizations
- **Memoization**: `useMemo` para cálculos pesados
- **Callback Optimization**: `useCallback` para handlers
- **Component Splitting**: Lazy loading de componentes

#### 2. Network Optimizations
- **Retry Logic**: 3 intentos con backoff exponencial
- **Timeout**: 10 segundos por request
- **Request Batching**: Múltiples operaciones en una llamada

### Recomendaciones Futuras
- **Redis Cache**: Para datos frecuentemente accedidos
- **CDN**: Para assets estáticos
- **Service Worker**: Cache offline
- **Virtual Scrolling**: Para listas largas

---

## Seguridad

### Implementaciones de Seguridad

#### 1. Autenticación y Autorización
- **JWT Tokens**: Con expiración configurable
- **Password Hashing**: bcrypt con salt rounds
- **Role-Based Access**: Permisos por rol de usuario
- **Session Management**: Tokens seguros

#### 2. Protecciones Web
- **CSRF Protection**: Validación de origen
- **XSS Prevention**: Sanitización de inputs
- **SQL Injection**: Queries parametrizadas
- **Rate Limiting**: 500 requests/15min por IP

#### 3. Headers de Seguridad (Helmet)
- **Content Security Policy**: Prevención XSS
- **X-Frame-Options**: Prevención clickjacking
- **X-Content-Type-Options**: Prevención MIME sniffing
- **Strict-Transport-Security**: HTTPS enforcement

#### 4. Validación de Datos
- **Input Sanitization**: Limpieza de datos de entrada
- **Type Validation**: Validación de tipos TypeScript
- **Business Logic Validation**: Reglas de negocio

### Variables de Entorno Seguras

```env
# Base de datos
DB_HOST=127.0.0.1
DB_USER=usuario_seguro
DB_PASSWORD=password_complejo_64_chars
DB_NAME=presupuestador_db

# Seguridad
JWT_SECRET=jwt_secret_aleatorio_64_caracteres
SESSION_SECRET=session_secret_aleatorio_64_caracteres

# CORS
FRONTEND_URL=http://localhost:5173,https://dominio-produccion.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

---

## Configuración de Alertas

### Sistema de Alertas Inteligentes

#### Ubicación
**Archivo:** `frontend/src/utils/constants.ts`

#### 1. Umbrales de Rentabilidad (7 Niveles)

```typescript
export const RENTABILIDAD_THRESHOLDS = {
  DESAPROBADO: 0,        // < 0% → Rojo crítico
  MEJORAR: 1,            // 1-35% → Naranja
  AUTORIZADO_MEJORA: 35, // 35-40% → Amarillo
  AUTORIZADO: 40,        // 40-50% → Azul
  FELICITACIONES: 50,    // 50-60% → Verde
  SUPER_RENTABLE: 60,    // 60-70% → Teal
  EXCEPCIONAL: 70,       // 70%+ → Violeta
} as const;
```

#### 2. Umbrales de Monto

```typescript
export const MONTO_THRESHOLDS = {
  ELEVADO: 1000000,  // $1M → Alerta naranja
  CRITICO: 5000000,  // $5M → Alerta roja
} as const;
```

#### 3. Umbrales de Cobranza

```typescript
export const DIAS_COBRANZA_THRESHOLDS = {
  LENTO: 40,      // > 40 días → Amarillo
  EXTENDIDO: 60,  // > 60 días → Naranja
} as const;
```

#### 4. Configuración de Tasas

```typescript
export const TASA_MENSUAL_ALTA = 0.08; // 8% mensual
export const TASA_DEFAULT = 2;         // 2% por defecto
export const DIAS_DEFAULT = 30;        // 30 días por defecto
```

### Personalización de Alertas

#### Modificar Umbrales
```typescript
// Ejemplo: Cambiar umbral de autorización a 38%
AUTORIZADO_MEJORA: 35,
AUTORIZADO: 38,  // ← Cambio aquí
```

#### Agregar Nueva Alerta
1. **Constante**: Agregar en `constants.ts`
2. **Lógica**: Implementar en `services/alertaService.ts`
3. **Componente**: Crear en `components/alerts/`
4. **Integración**: Usar en `hooks/useAlertaCotizador.tsx`

---

## Configuración de Cálculos

### Motor de Cálculos Financieros

#### Ubicación
**Archivo:** `frontend/src/utils/calculations.ts`

#### 1. Cálculos Básicos

```typescript
// Costo Total
export const calcularCostoTotal = (
  totalInsumos: number, 
  totalPrestaciones: number
): number => totalInsumos + totalPrestaciones;

// Total a Facturar
export const calcularTotalFacturar = (
  totalInsumos: number,
  totalFacturarPrestaciones: number,
  porcentajeInsumos: number
): number => {
  return totalInsumos * (1 + porcentajeInsumos / 100) + totalFacturarPrestaciones;
};
```

#### 2. Cálculos Avanzados

```typescript
// Rentabilidad
export const calcularRentabilidad = (
  costoTotal: number, 
  totalFacturar: number
): number => {
  return costoTotal > 0 
    ? ((totalFacturar - costoTotal) / costoTotal) * 100 
    : 0;
};

// Valor Presente con Plazo
export const calcularUtilidadConPlazo = (
  totalFacturar: number,
  costoTotal: number,
  financiadorInfo?: FinanciadorInfo
): number => {
  if (costoTotal === 0 || !financiadorInfo) 
    return totalFacturar - costoTotal;

  const diasCobranza = financiadorInfo.dias_cobranza_real 
    || financiadorInfo.dias_cobranza_teorico 
    || DIAS_DEFAULT;
    
  const tasaMensual = (financiadorInfo.tasa_mensual || TASA_DEFAULT) / 100;
  const mesesCobranza = Math.floor(diasCobranza / 30);
  
  const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
  return valorPresente - costoTotal;
};
```

### Fórmulas Implementadas

1. **Costo Total**: `Insumos + Prestaciones`
2. **Total Facturar**: `Insumos × (1 + %) + Prestaciones`
3. **Rentabilidad**: `((Facturar - Costo) / Costo) × 100`
4. **Valor Presente**: `Facturar / (1 + tasa)^meses - Costo`

---

## Mantenimiento y Desarrollo

### Estructura de Desarrollo

#### 1. Scripts Disponibles

**Backend:**
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Producción
npm run test         # Tests automatizados
npm run lint         # Linting
```

**Frontend:**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
```

#### 2. Testing Strategy
- **Unit Tests**: Funciones puras (calculations.ts)
- **Integration Tests**: API endpoints
- **E2E Tests**: Flujos críticos de usuario

#### 3. Deployment
- **Backend**: Node.js con PM2
- **Frontend**: Build estático con Nginx
- **Database**: MySQL 8.0+ con backups automáticos

### Próximas Mejoras Planificadas

#### 1. Performance
- [ ] Implementar Redis para cache
- [ ] Optimizar queries con índices adicionales
- [ ] Implementar lazy loading en frontend

#### 2. Funcionalidades
- [ ] Sistema de reportes avanzados
- [ ] Integración con APIs externas
- [ ] Dashboard de analytics

#### 3. DevOps
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Prometheus
- [ ] Logs centralizados con ELK Stack

---

## Contacto y Soporte

### Documentación Técnica
- **Arquitectura**: Este documento
- **API**: Documentación en `/backend/README.md`
- **Frontend**: Guía en `/frontend/README.md`
- **Migraciones**: Scripts en `/backend/migrations/`

### Archivos Clave para Configuración
- **Alertas**: `frontend/src/utils/constants.ts`
- **Cálculos**: `frontend/src/utils/calculations.ts`
- **Seguridad**: `backend/.env`
- **Base de datos**: `backend/src/db.ts`
- **Notificaciones**: `backend/src/routes/notificaciones-simple.ts`
- **Auditoría**: `backend/src/routes/auditoria-simple.ts`

### Estado del Proyecto
- ✅ **Sistema Base**: 100% funcional
- ✅ **Frontend**: Completamente implementado
- ✅ **Base de Datos**: Migrada y optimizada
- ⏳ **APIs Avanzadas**: En proceso de activación
- 🚀 **Producción**: Listo para deploy

**El sistema está completamente funcional con todas las interfaces implementadas y listo para uso en producción.**