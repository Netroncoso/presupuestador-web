# Arquitectura del Sistema - Presupuestador Web

## Índice
1. [Estructura General](#estructura-general)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Configuración de Alertas](#configuración-de-alertas)
5. [Configuración de Cálculos](#configuración-de-cálculos)
6. [Seguridad](#seguridad)

---

## Estructura General

```
presupuestador-web/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Lógica de endpoints
│   │   ├── middleware/        # Auth, errores, validación
│   │   ├── routes/            # Definición de rutas
│   │   ├── utils/             # Utilidades (logger, validators)
│   │   ├── app.ts             # Configuración Express
│   │   └── db.ts              # Pool de conexiones MySQL
│   └── migrations/            # Scripts SQL (documentación)
│
└── frontend/
    ├── src/
    │   ├── components/        # Componentes React
    │   │   └── alerts/        # Componentes de alertas
    │   ├── hooks/             # Custom hooks (estado)
    │   ├── pages/             # Páginas principales
    │   ├── services/          # Lógica de negocio
    │   ├── types/             # TypeScript types compartidos
    │   └── utils/             # Utilidades y constantes
    │       ├── calculations.ts
    │       ├── constants.ts
    │       └── sanitize.ts
    └── ...
```

---

## Backend

### Arquitectura en Capas

```
Request → Middleware → Controller → Database → Response
            ↓              ↓
         (Auth)      (asyncHandler)
         (CSRF)      (AppError)
         (Logger)
```

### Componentes Clave

#### 1. Middleware
- **`auth.ts`**: Autenticación JWT
- **`csrf.ts`**: Protección CSRF
- **`errorHandler.ts`**: Manejo centralizado de errores
- **`validateInput.ts`**: Validaciones reutilizables

#### 2. Controllers
- Usan `asyncHandler` para manejo automático de errores
- Lanzan `AppError` para errores controlados
- Validaciones antes de operaciones DB

#### 3. Database
- Pool de conexiones (10 max)
- Transacciones para operaciones complejas
- Queries parametrizadas (prevención SQL injection)

---

## Frontend

### Arquitectura por Responsabilidad

```
UI Components → Hooks → Services → API
                  ↓
              Utils (calculations, constants)
```

### Estructura de Archivos

#### `/types/index.ts`
Tipos TypeScript compartidos en toda la aplicación.

```typescript
export interface FinanciadorInfo { ... }
export interface Insumo { ... }
export interface Prestacion { ... }
```

#### `/utils/constants.ts`
**Constantes de negocio centralizadas.**

#### `/utils/calculations.ts`
**Funciones puras de cálculo** (sin efectos secundarios).

#### `/services/`
Lógica de negocio y comunicación con API.

#### `/hooks/`
Solo manejo de estado React, delegan cálculos a `/utils`.

#### `/components/alerts/`
Componentes visuales de alertas reutilizables.

---

## Configuración de Alertas

### Ubicación
**Archivo:** `frontend/src/utils/constants.ts`

### Cómo Modificar Umbrales

#### 1. Umbrales de Rentabilidad

```typescript
export const RENTABILIDAD_THRESHOLDS = {
  DESAPROBADO: 0,        // < 0% → Rojo
  MEJORAR: 1,            // 1-35% → Naranja
  AUTORIZADO_MEJORA: 35, // 35-40% → Amarillo
  AUTORIZADO: 40,        // 40-50% → Azul
  FELICITACIONES: 50,    // 50-60% → Verde
  SUPER_RENTABLE: 60,    // 60-70% → Teal
  EXCEPCIONAL: 70,       // 70%+ → Violeta
} as const;
```

**Ejemplo de cambio:**
```typescript
// Si quieres que "AUTORIZADO" empiece en 38%
AUTORIZADO_MEJORA: 35,
AUTORIZADO: 38,  // ← Cambiar aquí
```

#### 2. Umbrales de Monto

```typescript
export const MONTO_THRESHOLDS = {
  ELEVADO: 1000000,  // $1M → Naranja
  CRITICO: 5000000,  // $5M → Rojo
} as const;
```

**Ejemplo de cambio:**
```typescript
// Para alertar desde $2M
ELEVADO: 2000000,  // ← Cambiar aquí
```

#### 3. Umbrales de Días de Cobranza

```typescript
export const DIAS_COBRANZA_THRESHOLDS = {
  LENTO: 40,      // > 40 días → Amarillo
  EXTENDIDO: 60,  // > 60 días → Amarillo intenso
} as const;
```

#### 4. Tasa Mensual Alta

```typescript
export const TASA_MENSUAL_ALTA = 0.08; // 8%
```

**Ejemplo de cambio:**
```typescript
// Para alertar desde 10%
export const TASA_MENSUAL_ALTA = 0.10;
```

### Agregar Nueva Alerta

**Paso 1:** Agregar constante en `constants.ts`
```typescript
export const NUEVO_UMBRAL = 100000;
```

**Paso 2:** Agregar lógica en `services/alertaService.ts`
```typescript
export const evaluarNuevoUmbral = (valor: number) => {
  return valor > NUEVO_UMBRAL;
};
```

**Paso 3:** Crear componente en `components/alerts/NuevaAlert.tsx`
```typescript
export const NuevaAlert = ({ valor }: Props) => {
  return <Alert>...</Alert>;
};
```

**Paso 4:** Usar en `hooks/useAlertaCotizador.tsx`
```typescript
if (evaluarNuevoUmbral(valor)) {
  alertas.push(<NuevaAlert valor={valor} />);
}
```

---

## Configuración de Cálculos

### Ubicación
**Archivo:** `frontend/src/utils/calculations.ts`

### Fórmulas Actuales

#### 1. Costo Total
```typescript
export const calcularCostoTotal = (
  totalInsumos: number, 
  totalPrestaciones: number
): number => {
  return totalInsumos + totalPrestaciones;
};
```

#### 2. Total a Facturar
```typescript
export const calcularTotalFacturar = (
  totalInsumos: number,
  totalFacturarPrestaciones: number,
  porcentajeInsumos: number
): number => {
  return totalInsumos * (1 + porcentajeInsumos / 100) + totalFacturarPrestaciones;
};
```

**Fórmula:** `(Insumos × (1 + %)) + Prestaciones`

#### 3. Rentabilidad
```typescript
export const calcularRentabilidad = (
  costoTotal: number, 
  totalFacturar: number
): number => {
  return costoTotal > 0 
    ? ((totalFacturar - costoTotal) / costoTotal) * 100 
    : 0;
};
```

**Fórmula:** `((Facturar - Costo) / Costo) × 100`

#### 4. Utilidad con Plazo (Valor Presente)
```typescript
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

**Fórmula:** `VP = Facturar / (1 + tasa)^meses - Costo`

### Modificar Cálculos

#### Ejemplo 1: Cambiar Fórmula de Rentabilidad

```typescript
// Actual: Rentabilidad sobre costo
export const calcularRentabilidad = (costoTotal: number, totalFacturar: number): number => {
  return costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
};

// Nueva: Rentabilidad sobre venta (margen)
export const calcularRentabilidad = (costoTotal: number, totalFacturar: number): number => {
  return totalFacturar > 0 ? ((totalFacturar - costoTotal) / totalFacturar) * 100 : 0;
};
```

#### Ejemplo 2: Agregar Descuento

```typescript
export const calcularTotalFacturar = (
  totalInsumos: number,
  totalFacturarPrestaciones: number,
  porcentajeInsumos: number,
  descuento: number = 0  // ← Nuevo parámetro
): number => {
  const subtotal = totalInsumos * (1 + porcentajeInsumos / 100) + totalFacturarPrestaciones;
  return subtotal * (1 - descuento / 100);  // ← Aplicar descuento
};
```

### Constantes de Cálculo

```typescript
// Valores por defecto
export const TASA_DEFAULT = 2;      // 2% mensual
export const DIAS_DEFAULT = 30;     // 30 días
```

**Modificar:**
```typescript
// Para cambiar tasa por defecto a 2.5%
export const TASA_DEFAULT = 2.5;
```

---

## Seguridad

### Variables de Entorno

**Archivo:** `backend/.env`

```env
# Base de datos
DB_HOST=127.0.0.1
DB_USER=usuario
DB_PASSWORD=password_seguro
DB_NAME=mh_1

# Seguridad
JWT_SECRET=secret_aleatorio_64_caracteres
SESSION_SECRET=otro_secret_aleatorio

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Generar Secrets Seguros

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Protecciones Implementadas

1. **CSRF**: Validación de origen en todas las peticiones POST/PUT/DELETE
2. **SQL Injection**: Queries parametrizadas
3. **Log Injection**: Sanitización de logs
4. **XSS**: Sanitización de inputs
5. **Credenciales**: Variables de entorno obligatorias

### Actualizar Contraseñas

```bash
cd backend
node hash-passwords.js <username> <nueva_password>
```

---

## Mantenimiento

### Agregar Nuevo Endpoint

1. Crear controller en `/backend/src/controllers/`
2. Usar `asyncHandler` y `AppError`
3. Agregar ruta en `/backend/src/routes/`
4. Aplicar middleware de autenticación

### Agregar Nueva Página

1. Crear componente en `/frontend/src/pages/`
2. Usar hooks de `/hooks/` para estado
3. Usar servicios de `/services/` para API
4. Importar tipos de `/types/`

### Testing

**Funciones puras (recomendado testear):**
- `utils/calculations.ts`
- `services/alertaService.ts`
- `utils/validators.ts`

**Ejemplo:**
```typescript
import { calcularRentabilidad } from './calculations';

test('calcula rentabilidad correctamente', () => {
  expect(calcularRentabilidad(100, 150)).toBe(50);
});
```

---

## Contacto y Soporte

Para modificaciones complejas o dudas sobre la arquitectura, consultar este documento primero.

**Archivos clave para configuración:**
- Alertas: `frontend/src/utils/constants.ts`
- Cálculos: `frontend/src/utils/calculations.ts`
- Seguridad: `backend/.env`
- Base de datos: `backend/src/db.ts`
