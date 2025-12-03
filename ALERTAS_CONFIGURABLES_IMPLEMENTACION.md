# Implementación: Alertas Configurables

## ✅ Estado: COMPLETADO

## 📋 Resumen

Se implementó sistema de alertas configurables usando la tabla `configuracion_sistema` existente, permitiendo al super admin modificar umbrales de alertas desde la UI sin cambiar código.

---

## 🗄️ Base de Datos

### Migración Ejecutada

```sql
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES

-- Alertas de Rentabilidad (6 umbrales)
('alerta.rentabilidad.desaprobado', 10, 'Rentabilidad menor a este % → Alerta DESAPROBADO (rojo)', 'alertas', '%'),
('alerta.rentabilidad.mejorar', 15, 'Rentabilidad menor a este % → Alerta MEJORAR (naranja)', 'alertas', '%'),
('alerta.rentabilidad.autorizado', 20, 'Rentabilidad menor a este % → Alerta AUTORIZADO (amarillo)', 'alertas', '%'),
('alerta.rentabilidad.felicitaciones', 25, 'Rentabilidad menor a este % → Alerta FELICITACIONES (verde)', 'alertas', '%'),
('alerta.rentabilidad.superRentable', 30, 'Rentabilidad menor a este % → Alerta SUPER RENTABLE (azul)', 'alertas', '%'),
('alerta.rentabilidad.excepcional', 35, 'Rentabilidad mayor o igual a este % → Alerta EXCEPCIONAL (violeta)', 'alertas', '%'),

-- Alertas de Monto (2 umbrales)
('alerta.monto.elevado', 100000, 'Monto total mayor o igual a este valor → Alerta ELEVADO', 'alertas', '$'),
('alerta.monto.critico', 150000, 'Monto total mayor o igual a este valor → Alerta CRÍTICO', 'alertas', '$'),

-- Alertas de Financiador (3 umbrales)
('alerta.financiador.cobranzaLenta', 45, 'Días de cobranza mayor a este valor → Alerta Cobranza Lenta', 'alertas', 'días'),
('alerta.financiador.cobranzaExtendida', 60, 'Días de cobranza mayor a este valor → Alerta Cobranza Extendida', 'alertas', 'días'),
('alerta.financiador.tasaAlta', 5, 'Tasa mensual mayor a este % → Alerta Tasa Alta', 'alertas', '%');
```

**Resultado**: 11 registros insertados

---

## 🔧 Cambios en Código

### Frontend

#### 1. `services/alertaService.ts`
**Antes**: Usaba constantes hardcodeadas de `constants.ts`
```typescript
if (rentabilidad < RENTABILIDAD_THRESHOLDS.DESAPROBADO) return 'DESAPROBADO';
```

**Después**: Carga valores desde API con cache de 1 minuto
```typescript
const config = await getAlertasConfig();
if (rentabilidad < config['alerta.rentabilidad.desaprobado']) return 'DESAPROBADO';
```

**Cambios**:
- ✅ Agregada función `getAlertasConfig()` con cache
- ✅ Convertidas funciones a `async`
- ✅ Valores por defecto como fallback si falla API
- ✅ Cache de 1 minuto (CACHE_TTL = 60000ms)

#### 2. `hooks/useAlertaCotizador.tsx`
**Cambios**:
- ✅ Convertido de `useMemo` a `useEffect` para manejar async
- ✅ Agregado estado `alertas` para almacenar resultados
- ✅ Llamadas a funciones async con `await`

#### 3. `utils/constants.ts`
**Eliminado**:
- ❌ `RENTABILIDAD_THRESHOLDS`
- ❌ `MONTO_THRESHOLDS`
- ❌ `DIAS_COBRANZA_THRESHOLDS`
- ❌ `TASA_MENSUAL_ALTA`
- ❌ `TASA_DEFAULT`
- ❌ `DIAS_DEFAULT`

**Mantenido**:
- ✅ `ACUERDOS` (usado en lógica de negocio)

---

## 🎨 UI - Gestión de Alertas

### Ubicación
**Panel Admin > Reglas de Negocio > Sección "Alertas"**

### Vista
```
┌──────────────────────────────────────────────────────────────┐
│ 🔔 Alertas                                             ℹ️    │
├──────────────────────────────────────────────────────────────┤
│ Rentabilidad menor a este % → DESAPROBADO      [10.00] %    │
│ Rentabilidad menor a este % → MEJORAR          [15.00] %    │
│ Rentabilidad menor a este % → AUTORIZADO       [20.00] %    │
│ Rentabilidad menor a este % → FELICITACIONES   [25.00] %    │
│ Rentabilidad menor a este % → SUPER RENTABLE   [30.00] %    │
│ Rentabilidad ≥ este % → EXCEPCIONAL            [35.00] %    │
│                                                              │
│ Monto total ≥ este valor → ELEVADO        [100,000.00] $    │
│ Monto total ≥ este valor → CRÍTICO        [150,000.00] $    │
│                                                              │
│ Días cobranza > este valor → Lenta             [45.00] días │
│ Días cobranza > este valor → Extendida         [60.00] días │
│ Tasa mensual > este % → Alta                    [5.00] %    │
└──────────────────────────────────────────────────────────────┘
```

### Funcionalidad
- ✅ Edición en tiempo real
- ✅ Validación de valores
- ✅ Botón "Guardar Cambios" global
- ✅ Tooltips explicativos
- ✅ Formato según unidad ($, %, días)

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Super Admin edita valor en UI                           │
│    Panel Admin > Reglas de Negocio > Alertas               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PUT /api/configuracion/multiple                          │
│    Actualiza tabla configuracion_sistema                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend carga config con cache (1 min)                  │
│    GET /api/configuracion?categoria=alertas                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. alertaService.ts usa valores dinámicos                   │
│    evaluarRentabilidad(), evaluarMonto(), etc.              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Alertas se muestran en UserDashboard                     │
│    Con umbrales configurados por admin                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Validaciones

### Cache
- ✅ Cache de 1 minuto en frontend
- ✅ Cache de 1 minuto en backend (businessRules.ts)
- ✅ Reduce queries a BD

### Fallback
- ✅ Valores por defecto si falla carga desde BD
- ✅ Sistema sigue funcionando sin BD

### Consistencia
- ✅ Misma fuente de verdad: `configuracion_sistema`
- ✅ Backend y frontend usan mismos valores
- ✅ Cambios se aplican en tiempo real (después de cache)

---

## 📊 Tipos de Alertas

### 1. Alertas de Rentabilidad (6 niveles)
- DESAPROBADO (< 10%)
- MEJORAR (< 15%)
- AUTORIZADO_MEJORA (< 20%)
- AUTORIZADO (< 25%)
- FELICITACIONES (< 30%)
- SUPER_RENTABLE (< 35%)
- EXCEPCIONAL (≥ 35%)

### 2. Alertas de Monto (2 niveles)
- ELEVADO (≥ $100,000)
- CRITICO (≥ $150,000)

### 3. Alertas de Financiador (3 tipos)
- Cobranza Lenta (> 45 días)
- Cobranza Extendida (> 60 días)
- Tasa Alta (> 5%)

### 4. Alertas de Prestaciones (por tipo_unidad)
- Configuradas en tabla `alertas_servicios`
- Mensaje y color personalizables
- Cantidad máxima por tipo

---

## 🎯 Ventajas

1. **Sin cambios de código**: Admin modifica umbrales desde UI
2. **Reutiliza infraestructura**: Usa tabla y UI existentes
3. **Cache eficiente**: Reduce carga en BD
4. **Fallback robusto**: Sistema funciona sin BD
5. **Consistencia**: Backend y frontend usan mismos valores
6. **Auditable**: Timestamps en `configuracion_sistema`

---

## ⚠️ Limitaciones

1. **Mensajes hardcodeados**: Textos de alertas siguen en componentes
2. **Colores hardcodeados**: Colores de niveles siguen en código
3. **Orden de evaluación**: Lógica if/else sigue en alertaService.ts

**Nota**: Estas limitaciones son aceptables porque los mensajes y colores son estándar y raramente cambian.

---

## 🧪 Testing

### Verificar Configuración
```sql
SELECT * FROM configuracion_sistema WHERE categoria = 'alertas';
```

### Verificar Cache
1. Cambiar valor en UI
2. Guardar
3. Esperar 1 minuto
4. Verificar que alerta use nuevo valor

### Verificar Fallback
1. Detener backend
2. Verificar que frontend use valores por defecto
3. No debe romper la aplicación

---

## 📝 Archivos Modificados

### Frontend (3 archivos)
1. `services/alertaService.ts` - Carga dinámica con cache
2. `hooks/useAlertaCotizador.tsx` - Manejo async
3. `utils/constants.ts` - Limpieza de constantes obsoletas

### Backend (0 archivos)
- Ya usaba `configuracion_sistema` correctamente

### Migraciones (1 archivo)
1. SQL con 11 INSERT en `configuracion_sistema`

---

## 🚀 Próximos Pasos (Opcional)

Si se requiere más flexibilidad:

1. **Mensajes configurables**: Agregar columna `mensaje` en `configuracion_sistema`
2. **Colores configurables**: Agregar columna `color` en `configuracion_sistema`
3. **Activar/Desactivar alertas**: Agregar columna `activo` en `configuracion_sistema`
4. **Alertas personalizadas**: Nueva tabla `alertas_personalizadas`

---

**Implementación completada**: Diciembre 2024  
**Estado**: ✅ PRODUCCIÓN  
**Acceso**: Solo super admin (username='admin')
