# Sistema de Alertas - Documentación Completa

## 📋 Resumen Ejecutivo

Sistema integral de alertas para presupuestos médicos que combina:
- **Arquitectura limpia** con separación de concerns
- **Configuración dinámica** desde base de datos
- **Alertas inteligentes** por tipo de unidad (horas, sesiones, días)
- **Gestión desde UI** sin necesidad de cambiar código

**Estado**: ✅ PRODUCCIÓN  
**Versión Actual**: v2.0 (Diciembre 2024)

---

## 🎯 Evolución del Sistema

### v0 - Sistema Original (Hardcodeado)
- ❌ Umbrales hardcodeados en múltiples archivos
- ❌ Lógica mezclada con UI (300+ líneas)
- ❌ Difícil de mantener y testear
- ❌ Cambios requieren deploy

### v1.0 - Refactorización (Alertas Inteligentes)
- ✅ Arquitectura limpia con separación de concerns
- ✅ Funciones puras testeables
- ✅ Componentes visuales independientes
- ✅ Tipos de unidad para prestaciones
- ⚠️ Umbrales aún hardcodeados en `constants.ts`

### v2.0 - Configuración Dinámica (Actual)
- ✅ Umbrales configurables desde Panel Admin
- ✅ Tabla `configuracion_sistema` como fuente de verdad
- ✅ Cache de 1 minuto para performance
- ✅ Simplificación de 6 a 4 niveles de rentabilidad
- ✅ Fallback robusto a valores por defecto

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
presupuestador-web/
├── backend/
│   ├── migrations/
│   │   ├── create_configuracion_sistema.sql
│   │   ├── add_tipo_unidad_to_servicios.sql
│   │   ├── simplificar_alertas_rentabilidad.sql
│   │   └── limpiar_alertas_viejas.sql
│   └── src/
│       └── controllers/
│           ├── configuracionController.ts
│           └── prestacionesController.ts
└── frontend/
    └── src/
        ├── types/
        │   └── index.ts                    # Tipos compartidos
        ├── services/
        │   └── alertaService.ts            # Lógica pura (v2: async + cache)
        ├── components/alerts/
        │   ├── RentabilidadAlert.tsx       # 4 tipos (v2: simplificado)
        │   ├── MontoAlert.tsx
        │   ├── FinanciadorAlerts.tsx
        │   └── PrestacionExcedidaAlert.tsx
        ├── hooks/
        │   └── useAlertaCotizador.tsx      # Orquestación (60 líneas)
        └── pages/admin/
            └── GestionReglasNegocio.tsx    # UI de configuración
```

### Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CONFIGURACIÓN (Admin)                                    │
│    Panel Admin > Reglas de Negocio > Alertas               │
│    ↓ PUT /api/configuracion/multiple                        │
│    configuracion_sistema (BD)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CARGA DE SERVICIOS                                       │
│    servicios (tipo_unidad, max_unidades_sugerido)          │
│    ↓ JOIN                                                   │
│    prestador_servicio (hereda valores)                      │
│    ↓ GET /api/prestaciones                                  │
│    Frontend (prestacionesSeleccionadas)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. EVALUACIÓN (Runtime)                                     │
│    alertaService.ts                                         │
│    ├─ getAlertasConfig() → Cache 1 min                      │
│    ├─ evaluarRentabilidad(config, valor)                    │
│    ├─ evaluarMonto(config, valor)                           │
│    ├─ evaluarFinanciador(config, info)                      │
│    └─ evaluarPrestacionesExcedidas(prestaciones)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ORQUESTACIÓN                                             │
│    useAlertaCotizador.tsx                                   │
│    ├─ Llama funciones de evaluación                         │
│    ├─ Crea componentes React                                │
│    └─ Retorna array de alertas                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RENDERIZADO                                              │
│    UserDashboard                                            │
│    └─ Muestra alertas al usuario                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Base de Datos

### Tabla: `configuracion_sistema`

```sql
CREATE TABLE configuracion_sistema (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descripcion VARCHAR(255),
  categoria VARCHAR(50),
  unidad VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabla: `servicios` (Extensión v1.0)

```sql
ALTER TABLE servicios ADD COLUMN tipo_unidad ENUM('horas', 'sesiones', 'consultas', 'días', 'unidades') DEFAULT 'horas';
ALTER TABLE servicios ADD COLUMN max_unidades_sugerido INT DEFAULT NULL;
```

### Tabla: `alertas_servicios` (Alertas por Tipo de Unidad)

```sql
CREATE TABLE alertas_servicios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo_unidad VARCHAR(50) NOT NULL,
  cantidad_maxima INT NOT NULL,
  mensaje_alerta TEXT,
  color_alerta VARCHAR(20),
  activo TINYINT(1) DEFAULT 1
);
```

### Datos Actuales (v2.0)

```sql
-- 9 parámetros configurables
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES
-- Rentabilidad (4 niveles - SIMPLIFICADO v2.0)
('alerta.rentabilidad.desaprobado', 20, 'Rentabilidad menor a este % → Alerta Desaprobado (Rojo)', 'alertas', '%'),
('alerta.rentabilidad.mejorar', 30, 'Rentabilidad menor a este % → Alerta Mejorar (Naranja)', 'alertas', '%'),
('alerta.rentabilidad.felicitaciones', 50, 'Rentabilidad menor a este % → Alerta Felicitaciones (Verde)', 'alertas', '%'),
('alerta.rentabilidad.excepcional', 50, 'Rentabilidad mayor o igual a este % → Alerta Excepcional (Violeta)', 'alertas', '%'),

-- Monto (2 niveles)
('alerta.monto.elevado', 100000, 'Monto total mayor o igual a este valor → Alerta ELEVADO', 'alertas', '$'),
('alerta.monto.critico', 150000, 'Monto total mayor o igual a este valor → Alerta CRÍTICO', 'alertas', '$'),

-- Financiador (3 niveles)
('alerta.financiador.cobranzaLenta', 45, 'Días de cobranza mayor a este valor → Alerta Cobranza Lenta', 'alertas', 'días'),
('alerta.financiador.cobranzaExtendida', 60, 'Días de cobranza mayor a este valor → Alerta Cobranza Extendida', 'alertas', 'días'),
('alerta.financiador.tasaAlta', 5, 'Tasa mensual mayor a este % → Alerta Tasa Alta', 'alertas', '%');
```

---

## 💻 Implementación Frontend

### 1. Servicio de Alertas (`services/alertaService.ts`)

**Características v2.0**:
- ✅ Carga dinámica desde API
- ✅ Cache de 1 minuto (60000ms)
- ✅ Funciones async
- ✅ Fallback a valores por defecto

```typescript
// Cache de configuración
let alertasConfigCache: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto

const getAlertasConfig = async () => {
  const now = Date.now();
  if (alertasConfigCache && (now - cacheTimestamp) < CACHE_TTL) {
    return alertasConfigCache;
  }

  try {
    const response = await fetch(`${API_URL}/api/configuracion?categoria=alertas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    
    alertasConfigCache = data.reduce((acc: any, item: any) => {
      acc[item.clave] = item.valor;
      return acc;
    }, {});
    
    cacheTimestamp = now;
    return alertasConfigCache;
  } catch (error) {
    // Valores por defecto si falla
    return {
      'alerta.rentabilidad.desaprobado': 20,
      'alerta.rentabilidad.mejorar': 30,
      'alerta.rentabilidad.felicitaciones': 50,
      'alerta.rentabilidad.excepcional': 50,
      // ...
    };
  }
};

// Evaluación de rentabilidad (v2.0 - Simplificado)
export const evaluarRentabilidad = async (
  rentabilidad: number
): Promise<TipoAlertaRentabilidad | null> => {
  if (rentabilidad === 0) return null;

  const config = await getAlertasConfig();

  if (rentabilidad < config['alerta.rentabilidad.desaprobado']) return 'DESAPROBADO';
  if (rentabilidad < config['alerta.rentabilidad.mejorar']) return 'MEJORAR';
  if (rentabilidad < config['alerta.rentabilidad.felicitaciones']) return 'FELICITACIONES';
  
  return 'EXCEPCIONAL';
};

// Evaluación de prestaciones excedidas (v1.0)
export const evaluarPrestacionesExcedidas = (
  prestaciones: Prestacion[], 
  alertasConfig: any[]
) => {
  return prestaciones.filter(p => {
    const alertaConfig = alertasConfig.find(
      a => a.tipo_unidad === p.tipo_unidad && a.activo === 1
    );
    if (!alertaConfig) return false;
    return p.cantidad > alertaConfig.cantidad_maxima;
  }).map(p => {
    const alertaConfig = alertasConfig.find(a => a.tipo_unidad === p.tipo_unidad);
    return {
      ...p,
      mensaje_alerta: alertaConfig?.mensaje_alerta,
      color_alerta: alertaConfig?.color_alerta
    };
  });
};
```

### 2. Hook de Orquestación (`hooks/useAlertaCotizador.tsx`)

**Reducción**: 300+ líneas → 60 líneas (80% menos código)

```typescript
export const useAlertaCotizador = (props: AlertaProps): React.ReactNode[] => {
  const [alertasConfig, setAlertasConfig] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<React.ReactNode[]>([]);

  // Cargar configuración de alertas de servicios
  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/alertas-servicios`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setAlertasConfig(data);
      } catch (error) {
        console.error('Error cargando alertas:', error);
      }
    };
    cargarAlertas();
  }, []);
  
  // Evaluar y generar alertas
  useEffect(() => {
    const evaluarAlertas = async () => {
      const alertas: React.ReactNode[] = [];

      // 1. Alerta de rentabilidad
      const tipoRentabilidad = await evaluarRentabilidad(rentabilidad);
      if (tipoRentabilidad) {
        alertas.push(
          <RentabilidadAlert 
            key="rentabilidad"
            tipo={tipoRentabilidad}
            rentabilidad={rentabilidad}
            usandoPlazo={!!financiadorInfo?.dias_cobranza_real}
          />
        );
      }

      // 2. Alerta de monto
      const tipoMonto = await evaluarMonto(totalFacturar);
      if (tipoMonto) {
        alertas.push(
          <MontoAlert 
            key="monto"
            tipo={tipoMonto}
            totalFacturar={totalFacturar}
          />
        );
      }

      // 3. Alertas de financiador
      if (financiadorInfo && financiadorId) {
        const evaluacion = await evaluarFinanciador(financiadorInfo);
        if (evaluacion) {
          alertas.push(
            <FinanciadorAlerts 
              key="financiador"
              {...evaluacion}
            />
          );
        }
      }

      // 4. Alertas de prestaciones excedidas
      if (alertasConfig.length > 0) {
        const excedidas = evaluarPrestacionesExcedidas(
          prestacionesSeleccionadas, 
          alertasConfig
        );
        excedidas.forEach((p, idx) => {
          alertas.push(
            <PrestacionExcedidaAlert 
              key={`prestacion-${idx}`}
              prestacion={p}
            />
          );
        });
      }

      setAlertas(alertas);
    };

    evaluarAlertas();
  }, [rentabilidad, totalFacturar, financiadorInfo, prestacionesSeleccionadas, alertasConfig]);

  return alertas;
};
```

### 3. Componentes de Alertas

**RentabilidadAlert** (v2.0 - Simplificado a 4 tipos):
```typescript
const CONFIG = {
  DESAPROBADO: {
    icon: ExclamationCircleIcon,
    title: 'DESAPROBADO',
    color: 'red',
    mensaje: 'Este presupuesto no es viable. Revisa costos y valores asignados.',
  },
  MEJORAR: {
    icon: ExclamationTriangleIcon,
    title: 'MEJORAR VALORES',
    color: 'orange',
    mensaje: 'Rentabilidad baja. Considera renegociar valores o revisar costos.',
  },
  FELICITACIONES: {
    icon: CheckBadgeIcon,
    title: 'FELICITACIONES',
    color: 'green',
    mensaje: 'Excelente rentabilidad alcanzada. ¡Buen trabajo!',
  },
  EXCEPCIONAL: {
    icon: CheckBadgeIcon,
    title: 'RENTABILIDAD EXCEPCIONAL',
    color: 'violet',
    mensaje: '¡Resultado extraordinario! Márgenes óptimos.',
  },
} as const;
```

**PrestacionExcedidaAlert** (v1.0 - Alertas inteligentes):
```typescript
export const PrestacionExcedidaAlert = ({ prestacion }: Props) => {
  return (
    <Alert 
      title="⚠️ CANTIDAD ELEVADA" 
      color={prestacion.color_alerta || 'orange'}
    >
      <Text size="sm">
        <strong>{prestacion.prestacion}: {prestacion.cantidad} {prestacion.tipo_unidad}</strong>
        {prestacion.cant_total && ` (sugerido: ${prestacion.cant_total})`}
      </Text>
      {prestacion.mensaje_alerta && (
        <Text size="xs" c="dimmed" mt="xs">{prestacion.mensaje_alerta}</Text>
      )}
    </Alert>
  );
};
```

---

## 🎨 Panel de Administración

### Gestión de Reglas de Negocio

**Ubicación**: Panel Admin > Reglas de Negocio

**Vista**:
```
┌──────────────────────────────────────────────────────────────┐
│ Reglas de Negocio                    [💾 Guardar Cambios]   │
├──────────────────────────────────────────────────────────────┤
│ 🔔 Alertas                                             ℹ️    │
├──────────────────────────────────────────────────────────────┤
│ Rentabilidad menor a este % → DESAPROBADO      [20.00] %    │
│ Rentabilidad menor a este % → MEJORAR          [30.00] %    │
│ Rentabilidad menor a este % → FELICITACIONES   [50.00] %    │
│ Rentabilidad ≥ este % → EXCEPCIONAL            [50.00] %    │
│                                                              │
│ Monto total ≥ este valor → ELEVADO        [100,000.00] $    │
│ Monto total ≥ este valor → CRÍTICO        [150,000.00] $    │
│                                                              │
│ Días cobranza > este valor → Lenta             [45.00] días │
│ Días cobranza > este valor → Extendida         [60.00] días │
│ Tasa mensual > este % → Alta                    [5.00] %    │
└──────────────────────────────────────────────────────────────┘
```

**Funcionalidades**:
- ✅ Edición en tiempo real con NumberInput
- ✅ Formato automático según unidad ($, %, días)
- ✅ Tooltips explicativos con rangos
- ✅ Validación de valores
- ✅ Guardado transaccional (todo o nada)
- ✅ Feedback visual (success/error)

### Gestión de Alertas por Tipo de Unidad

**Ubicación**: Panel Admin > Alertas de Servicios

**Funcionalidades**:
- ✅ Crear alertas por tipo_unidad (horas, sesiones, días)
- ✅ Configurar cantidad máxima
- ✅ Mensaje personalizado
- ✅ Color personalizado (orange, red, yellow)
- ✅ Activar/Desactivar alertas

---

## 📊 Tipos de Alertas

### 1. Alertas de Rentabilidad (4 niveles)

| Rango | Tipo | Color | Descripción |
|-------|------|-------|-------------|
| < 20% | 🔴 DESAPROBADO | Rojo | No viable, revisar costos |
| 20-30% | 🟠 MEJORAR | Naranja | Rentabilidad baja, renegociar |
| 30-50% | 🟢 FELICITACIONES | Verde | Excelente rentabilidad |
| ≥ 50% | 💜 EXCEPCIONAL | Violeta | Márgenes óptimos |

### 2. Alertas de Monto (2 niveles)

| Umbral | Tipo | Color | Acción |
|--------|------|-------|--------|
| ≥ $100,000 | ELEVADO | Naranja | Revisión y aviso |
| ≥ $150,000 | CRÍTICO | Rojo | Gestión especial |

### 3. Alertas de Financiador (3 tipos)

| Condición | Tipo | Color | Impacto |
|-----------|------|-------|---------|
| > 45 días | Cobranza Lenta | Amarillo | Flujo de caja afectado |
| > 60 días | Cobranza Extendida | Naranja | Impacto significativo |
| > 5% | Tasa Alta | Amarillo | Reduce rentabilidad con plazo |

### 4. Alertas de Prestaciones (por tipo_unidad)

**Configurables desde Panel Admin**:
- Cantidad máxima por tipo (horas, sesiones, días)
- Mensaje personalizado
- Color personalizado
- Estado activo/inactivo

**Ejemplo**:
```
⚠️ CANTIDAD ELEVADA
Kinesiología: 300 horas (sugerido: 200)
Cantidad superior a la recomendada para este tipo de servicio.
```

---

## 🎯 Ventajas del Sistema

### Funcionales
✅ **Precisión**: Diferencia horas de sesiones, consultas y días  
✅ **Alertas específicas**: Por servicio individual cuando excede límite  
✅ **Alertas acumuladas**: Por tipo de unidad para control global  
✅ **Mejor auditoría**: Información clara para toma de decisiones  
✅ **Escalable**: Fácil agregar nuevos tipos de unidades  

### Técnicas
✅ **Mantenible**: Lógica separada de UI (80% menos código)  
✅ **Testeable**: Funciones puras fáciles de testear  
✅ **Configurable**: Umbrales editables sin deploy  
✅ **Reutilizable**: Componentes independientes  
✅ **Performante**: Cache de 1 minuto reduce queries  
✅ **Robusto**: Fallback a valores por defecto  

### Operativas
✅ **Sin downtime**: Cambios en caliente  
✅ **Auditable**: Timestamps en BD  
✅ **Consistente**: Misma fuente de verdad  
✅ **Flexible**: Admin controla comportamiento  

---

## 🧪 Testing y Validación

### Testing de Funciones Puras

```typescript
import { evaluarRentabilidad } from './alertaService';

describe('evaluarRentabilidad', () => {
  test('rentabilidad < 20% → DESAPROBADO', async () => {
    expect(await evaluarRentabilidad(15)).toBe('DESAPROBADO');
  });

  test('rentabilidad 25% → MEJORAR', async () => {
    expect(await evaluarRentabilidad(25)).toBe('MEJORAR');
  });

  test('rentabilidad 40% → FELICITACIONES', async () => {
    expect(await evaluarRentabilidad(40)).toBe('FELICITACIONES');
  });

  test('rentabilidad 60% → EXCEPCIONAL', async () => {
    expect(await evaluarRentabilidad(60)).toBe('EXCEPCIONAL');
  });
});
```

### Verificación en Base de Datos

```sql
-- Ver todas las alertas configuradas
SELECT * FROM configuracion_sistema WHERE categoria = 'alertas';

-- Ver solo alertas de rentabilidad (debe mostrar 4)
SELECT * FROM configuracion_sistema 
WHERE categoria = 'alertas' AND clave LIKE '%rentabilidad%' 
ORDER BY valor;

-- Ver alertas por tipo de unidad
SELECT * FROM alertas_servicios WHERE activo = 1;
```

### Verificación de Cache

1. Cambiar valor en Panel Admin
2. Guardar cambios
3. Esperar 1 minuto (TTL del cache)
4. Crear nuevo presupuesto
5. Verificar que use nuevo umbral

### Verificación de Fallback

1. Detener backend
2. Abrir frontend
3. Verificar que alertas usen valores por defecto
4. Sistema debe seguir funcionando

---

## 📝 Historial de Versiones

### v2.0 (Diciembre 2024) - ACTUAL
**Configuración Dinámica**
- ✅ Umbrales configurables desde Panel Admin
- ✅ Simplificación de 6 a 4 niveles de rentabilidad
- ✅ Nuevos umbrales: 20%, 30%, 50%
- ✅ Cache de 1 minuto en frontend y backend
- ✅ Fallback robusto a valores por defecto
- ✅ Tabla `configuracion_sistema` como fuente de verdad
- ✅ Migraciones: `simplificar_alertas_rentabilidad.sql`, `limpiar_alertas_viejas.sql`

### v1.0 (Diciembre 2024)
**Alertas Inteligentes**
- ✅ Refactorización completa (300 → 60 líneas)
- ✅ Separación de concerns (service/components/hooks)
- ✅ Tipos de unidad (horas, sesiones, consultas, días)
- ✅ Alertas por prestación individual
- ✅ Componentes visuales independientes
- ✅ Funciones puras testeables
- ⚠️ Umbrales aún hardcodeados en `constants.ts`
- ✅ Migración: `add_tipo_unidad_to_servicios.sql`

### v0 - Sistema Original
- ❌ Umbrales hardcodeados en múltiples archivos
- ❌ Lógica mezclada con UI
- ❌ Difícil de mantener
- ❌ Cambios requieren deploy

---

## 🔧 Mantenimiento y Extensión

### Cambiar Umbrales (v2.0)

**Desde UI** (Recomendado):
1. Panel Admin > Reglas de Negocio
2. Modificar valores
3. Guardar cambios
4. Esperar 1 minuto (cache)

**Desde BD** (Avanzado):
```sql
UPDATE configuracion_sistema 
SET valor = 25 
WHERE clave = 'alerta.rentabilidad.desaprobado';
```

### Agregar Nueva Alerta de Rentabilidad

**Paso 1**: Insertar en BD
```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad)
VALUES ('alerta.rentabilidad.nuevo', 35, 'Nuevo umbral', 'alertas', '%');
```

**Paso 2**: Actualizar tipo en `alertaService.ts`
```typescript
export type TipoAlertaRentabilidad =
  | 'DESAPROBADO'
  | 'MEJORAR'
  | 'NUEVO'  // ← Agregar
  | 'FELICITACIONES'
  | 'EXCEPCIONAL';
```

**Paso 3**: Agregar lógica de evaluación
```typescript
if (rentabilidad < config['alerta.rentabilidad.nuevo']) return 'NUEVO';
```

**Paso 4**: Agregar configuración visual en `RentabilidadAlert.tsx`
```typescript
const CONFIG = {
  // ...
  NUEVO: {
    icon: CheckCircleIcon,
    title: 'NUEVO NIVEL',
    color: 'blue',
    mensaje: 'Descripción del nuevo nivel.',
  },
};
```

### Agregar Alerta por Tipo de Unidad

**Desde Panel Admin**:
1. Panel Admin > Alertas de Servicios
2. Click "Nueva Alerta"
3. Configurar:
   - Tipo de unidad
   - Cantidad máxima
   - Mensaje personalizado
   - Color (orange/red/yellow)
4. Guardar

**Desde BD**:
```sql
INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo)
VALUES ('turnos', 50, 'Cantidad de turnos excede el límite recomendado', 'orange', 1);
```

---

## 📚 Referencias

### Archivos Clave

**Backend**:
- `backend/src/controllers/configuracionController.ts` - API de configuración
- `backend/src/controllers/prestacionesController.ts` - Incluye tipo_unidad
- `backend/migrations/create_configuracion_sistema.sql` - Tabla principal
- `backend/migrations/add_tipo_unidad_to_servicios.sql` - Tipos de unidad
- `backend/migrations/simplificar_alertas_rentabilidad.sql` - Simplificación v2.0

**Frontend**:
- `frontend/src/services/alertaService.ts` - Lógica de evaluación
- `frontend/src/hooks/useAlertaCotizador.tsx` - Orquestación
- `frontend/src/components/alerts/` - Componentes visuales
- `frontend/src/pages/admin/GestionReglasNegocio.tsx` - UI de configuración
- `frontend/src/pages/admin/GestionAlertasServicios.tsx` - Alertas por tipo

### Documentación Relacionada

- `ARCHITECTURE_V2.md` - Arquitectura completa del sistema
- `MANUAL_USUARIO_V2.md` - Guía para usuarios
- `README.md` - Información general del proyecto

---

**Implementación completada**: Diciembre 2024  
**Versión actual**: v2.0  
**Estado**: ✅ PRODUCCIÓN  
**Acceso configuración**: Solo super admin (username='admin')  
**Mantenido por**: Equipo de desarrollo
