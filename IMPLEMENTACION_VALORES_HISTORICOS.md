# ✅ Implementación Sistema de Valores Históricos (Timelapse)

## 📦 Archivos Creados/Modificados

### Backend
1. **`backend/migrations/create_prestador_servicio_valores.sql`**
   - Crea tabla `prestador_servicio_valores`
   - Migra valores actuales como primer período histórico (desde 2024-01-01)
   - Índices optimizados para consultas por fecha
   - FK: `id_prestador_servicio` → `prestador_servicio.id_prestador_servicio`

1.1. **`backend/migrations/add_sucursal_to_valores.sql`** ⭐ NUEVO
   - Agrega columna `sucursal_id INT NULL` a `prestador_servicio_valores`
   - FK: `sucursal_id` → `sucursales_mh(ID)` con ON DELETE CASCADE
   - Índice `idx_sucursal_fecha` para optimizar consultas
   - Permite valores generales (NULL) y específicos por sucursal

2. **`backend/src/controllers/prestadorValoresController.ts`**
   - `getValoresPrestadorServicio()` - Obtener histórico completo (incluye `sucursal_id`)
   - `guardarValorPrestadorServicio()` - Guardar nuevo valor con cierre automático de períodos (por sucursal)
   - `obtenerValorVigente()` - Helper para consultar valor por fecha
   - ⭐ Cierre de períodos solo afecta registros de la misma sucursal

3. **`backend/src/routes/prestaciones.ts`** (modificado)
   - `GET /prestaciones/servicio/:id/valores` - Histórico de valores
   - `POST /prestaciones/servicio/:id/valores` - Guardar nuevo valor

4. **`backend/src/controllers/prestacionesController.ts`** (modificado)
   - `getPrestacionesPorPrestador()` acepta parámetros `?fecha=` y `?sucursal_id=` opcionales
   - Consulta valores históricos según fecha proporcionada usando `ps.id_prestador_servicio`
   - ⭐ Filtra por `(v.sucursal_id = ? OR v.sucursal_id IS NULL)` con prioridad a específicos
   - `ORDER BY v.sucursal_id DESC` para priorizar valores específicos sobre generales
   - `HAVING valor_facturar IS NOT NULL` para mostrar solo servicios con valores acordados
   - Fallback a valores actuales si no se proporciona fecha

5. **`backend/src/controllers/presupuestoPrestacionesController.ts`** (modificado)
   - `guardarPrestacionPresupuesto()` valida `valor_facturar` histórico automáticamente
   - Obtiene `id_prestador_servicio` desde `id_servicio` + `idobra_social`
   - Consulta valores vigentes según fecha del presupuesto
   - Mantiene `valor_asignado` que viene del usuario

6. **`backend/src/controllers/presupuestosControllerV2.ts`** (modificado)
   - `crearVersionParaEdicion()` actualiza `valor_facturar` con valores actuales
   - Mantiene `valor_asignado` original al copiar prestaciones

7. **`backend/src/controllers/admin/adminServiciosController.ts`** (modificado)
   - `createOrUpdateServicioPrestador()` crea automáticamente registro en `prestador_servicio_valores` al activar servicio nuevo
   - Usa transacciones para garantizar consistencia
   - Inserta valor inicial con fecha actual (CURDATE())

### Frontend
8. **`frontend/src/pages/admin/ServiciosPorPrestador.tsx`** (modificado)
   - Modal unificado con edición rápida y gestión de valores históricos
   - ⭐ Select de sucursal en formulario de agregar valores ("Todas" o específica)
   - Formulario para agregar múltiples valores futuros (con sucursal por fila)
   - ⭐ Tabla de histórico con columna "Sucursal" mostrando "Todas" o nombre específico
   - Badges Vigente/Histórico
   - Formato monetario argentino ($ 1.234,56)

9. **`frontend/src/api/api.ts`** (modificado)
   - `getPrestacionesPorPrestador()` acepta parámetros `fecha?: string` y `sucursalId?: number`
   - Construye URL con query params usando URLSearchParams

10. **`frontend/src/pages/Prestaciones.tsx`** (modificado)
   - Detecta modo `soloLectura` para cargar valores históricos
   - Pasa fecha del presupuesto al cargar prestaciones disponibles
   - ⭐ Obtiene `sucursal_id` del presupuesto actual y lo pasa al cargar prestaciones
   - En modo edición usa valores actuales (nueva versión = nuevo contexto)

11. **`frontend/src/App.tsx`** (modificado)
    - Configuración global de Modal en MantineProvider
    - ScrollArea.Autosize y radius xl por defecto
    - Títulos con fontWeight 600

### Documentación
12. **`backend/EJECUTAR_MIGRACION_VALORES.md`**
    - Instrucciones de migración
    - Verificación y rollback
    - Documentación de endpoints

## 🚀 Pasos para Activar

### 1. Ejecutar Migración SQL
```bash
cd backend
mysql -u root -p presupuestador < migrations/create_prestador_servicio_valores.sql
```

### 2. Verificar Migración
```sql
-- Verificar tabla creada
SELECT COUNT(*) FROM prestador_servicio_valores;

-- Verificar que cada servicio tiene 1 registro inicial
SELECT id_prestador_servicio, COUNT(*) as registros 
FROM prestador_servicio_valores 
GROUP BY id_prestador_servicio;
```

### 3. Verificar Backend
```bash
cd backend
npm run dev
```

### 4. Verificar Frontend
```bash
cd frontend
npm run dev
```

## 🎯 Características Implementadas

### ✅ Backend
- [x] Tabla `prestador_servicio_valores` con `valor_asignado` y `valor_facturar`
- [x] Migración automática de valores actuales desde 2024-01-01
- [x] ⭐ Columna `sucursal_id` para valores específicos por sucursal
- [x] Cierre automático de períodos al guardar nuevo valor (por sucursal)
- [x] Consulta de valores vigentes por fecha con BETWEEN
- [x] ⭐ Filtrado por sucursal con prioridad: específico > general
- [x] ⭐ Usuario solo ve servicios con valores para su sucursal
- [x] Fallback a valores históricos si no hay valores por fecha
- [x] Transacciones para garantizar consistencia
- [x] Validación automática de `valor_facturar` al guardar prestaciones
- [x] Conversión de `id_servicio` a `id_prestador_servicio` para consultas históricas
- [x] Actualización de `valor_facturar` al crear nueva versión de presupuesto
- [x] ⭐ NO crea registros históricos automáticamente (evita valores en $0)

### ✅ Frontend
- [x] Modal unificado de gestión de valores históricos
- [x] ⭐ Switch "Estado del Servicio" dentro del modal (no en tabla)
- [x] ⭐ Validación: Solo permite activar si existe al menos 1 valor vigente
- [x] ⭐ Select de sucursal en formulario ("Todas las sucursales" + lista)
- [x] Formulario para agregar múltiples valores futuros (array con +/-)
- [x] ⭐ Tabla de histórico con columna "Sucursal" (Todas / CABA / Córdoba)
- [x] Tabla de histórico ordenada por fecha descendente
- [x] Indicador visual de vigencia (badges)
- [x] Formato monetario argentino en todos los valores
- [x] Manejo de errores y validaciones
- [x] Integración con modo solo lectura de presupuestos
- [x] ⭐ Paso de `sucursal_id` al cargar prestaciones disponibles
- [x] Corrección de uso de `id_prestador_servicio` en lugar de `id_servicio` para cargar valores históricos
- [x] ⭐ Columna "Estado" en tabla principal (solo texto, sin switch)

## 📊 Flujo de Datos Completo

### Crear Presupuesto Nuevo
```
1. Usuario selecciona financiador
   ↓
2. Frontend: GET /prestaciones/prestador/:id (sin fecha)
   ↓
3. Backend consulta valores vigentes HOY usando id_prestador_servicio
   ↓
4. Usuario elige valor_asignado (costo negociado)
   ↓
5. Frontend: POST /presupuestos/:id/prestaciones (envía id_servicio)
   ↓
6. Backend obtiene id_prestador_servicio desde id_servicio + idobra_social
   ↓
7. Backend consulta valor_facturar vigente HOY
   ↓
8. Backend guarda con valores actuales
```

### Ver Presupuesto Histórico (Solo Lectura)
```
1. Frontend detecta soloLectura=true
   ↓
2. Frontend: GET /presupuestos/:id (obtiene created_at)
   ↓
3. Frontend: GET /prestaciones/prestador/:id?fecha=2024-06-15
   ↓
4. Backend consulta valores vigentes en esa fecha
   ↓
5. Lista muestra valores históricos de junio
   ↓
6. Tabla muestra valores guardados en presupuesto_prestaciones
```

### Editar Presupuesto → Nueva Versión
```
1. Backend copia prestaciones de versión anterior
   ↓
2. Backend obtiene id_prestador_servicio para cada prestación
   ↓
3. Backend consulta valor_facturar vigente HOY
   ↓
4. Backend mantiene valor_asignado original
   ↓
5. Backend actualiza valor_facturar con valores actuales
   ↓
6. Frontend detecta soloLectura=false
   ↓
7. Frontend: GET /prestaciones/prestador/:id (sin fecha)
   ↓
8. Lista muestra valores actuales para nuevas prestaciones
```

### Gestionar Valores Históricos (Admin)
```
1. Admin abre modal de valores históricos
   ↓
2. Frontend: GET /prestaciones/servicio/:id/valores
   ↓
3. Admin edita valores actuales o agrega valores futuros
   ↓
4. Frontend: POST /prestaciones/servicio/:id/valores (múltiples)
   ↓
5. Backend cierra períodos anteriores automáticamente
   ↓
6. Backend inserta nuevos períodos
   ↓
7. Frontend recarga histórico actualizado
```

## 🔄 Integración con Presupuestos

### Estructura de Tablas
```
prestador_servicio
├── id_prestador_servicio (PK, INT)
├── idobra_social (FK)
├── id_servicio (FK a servicios)
└── valor_facturar, valor_sugerido

prestador_servicio_valores
├── id (PK)
├── id_prestador_servicio (FK → prestador_servicio.id_prestador_servicio)
├── valor_asignado
├── valor_facturar
├── fecha_inicio
└── fecha_fin

presupuesto_prestaciones
├── id (PK)
├── idPresupuestos (FK)
├── id_servicio (VARCHAR - NO es FK, es string)
├── valor_asignado
└── valor_facturar
```

### Conversión de IDs
```typescript
// Frontend envía: id_servicio (string)
// Backend necesita: id_prestador_servicio (int) para consultar valores históricos

const [servicio] = await pool.query(
  'SELECT id_prestador_servicio FROM prestador_servicio WHERE id_servicio = ? AND idobra_social = ?',
  [id_servicio, idobra_social]
);

const id_prestador_servicio = servicio[0].id_prestador_servicio;
```

### Valores en Presupuestos
| Campo | Origen | Histórico | Editable por Usuario |
|-------|--------|-----------|---------------------|
| `valor_asignado` | Usuario decide | ❌ NO | ✅ SÍ |
| `valor_facturar` | Tabla histórica | ✅ SÍ | ❌ NO |
| `valor_sugerido` | Tabla prestador_servicio | ❌ NO | ❌ NO (referencia) |

### Comportamiento por Escenario
| Escenario | `valor_asignado` | `valor_facturar` | Fecha Usada |
|-----------|------------------|------------------|-------------|
| **Crear presupuesto nuevo** | Usuario elige | Tabla histórica | HOY |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD | N/A |
| **Ver histórico - Lista disponibles** | Tabla prestador_servicio | Tabla histórica | Fecha presupuesto |
| **Editar → Nueva versión** | Usuario elige | Tabla histórica | HOY |
| **Editar → Prestaciones copiadas** | Copiado (original) | Actualizado (HOY) | HOY |

### Lógica de Actualización en Nueva Versión
```typescript
// Al crear nueva versión:
// 1. Copiar prestaciones de versión anterior
// 2. Mantener valor_asignado original (costo negociado histórico)
// 3. Actualizar valor_facturar con valores vigentes HOY
// 4. Si no hay valores históricos actuales, mantener original

Ejemplo:
Presupuesto Original (Junio 2024):
- Prestación A: valor_asignado=$80, valor_facturar=$100

Usuario edita en Diciembre 2024 (crea versión 2):
- Prestación A: valor_asignado=$80 (mantiene), valor_facturar=$150 (actualizado)
```

## 📝 Endpoints API

### Valores Históricos
```bash
# Obtener histórico de un servicio
GET /api/prestaciones/servicio/:id/valores
Response: [
  {
    "id": 1,
    "sucursal_id": null,
    "valor_asignado": 1500.00,
    "valor_facturar": 2000.00,
    "fecha_inicio": "2024-01-01",
    "fecha_fin": "2024-05-31",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "sucursal_id": 1,
    "valor_asignado": 1600.00,
    "valor_facturar": 2200.00,
    "fecha_inicio": "2024-06-01",
    "fecha_fin": null,
    "created_at": "2024-06-01T10:30:00.000Z"
  }
]

# Guardar nuevo valor
POST /api/prestaciones/servicio/:id/valores
Content-Type: application/json

{
  "valor_asignado": 1700.00,
  "valor_facturar": 2300.00,
  "fecha_inicio": "2024-12-01",
  "sucursal_id": 1  // null para "Todas", número para específica
}

Response: {
  "ok": true,
  "message": "Valor guardado correctamente",
  "id_prestador_servicio": 123
}
```

### Prestaciones con Valores Históricos
```bash
# Obtener prestaciones con valores actuales
GET /api/prestaciones/prestador/:id

# Obtener prestaciones con valores de fecha específica
GET /api/prestaciones/prestador/:id?fecha=2024-06-15

# Obtener prestaciones para sucursal específica
GET /api/prestaciones/prestador/:id?sucursal_id=1

# Obtener prestaciones con fecha y sucursal
GET /api/prestaciones/prestador/:id?fecha=2024-06-15&sucursal_id=1

Response: [
  {
    "id_servicio": "123",
    "nombre": "Enfermería",
    "tipo_unidad": "horas",
    "cant_total": 24,
    "valor_sugerido": 1500.00,
    "valor_facturar": 2000.00
  }
]
```

## 🧪 Testing

### Casos de Prueba Backend
1. **Crear primer valor histórico**
   ```sql
   -- Verificar que se crea con fecha_fin = NULL
   SELECT * FROM prestador_servicio_valores WHERE id_prestador_servicio = 123;
   ```

2. **Agregar segundo valor**
   ```sql
   -- Verificar cierre automático del anterior
   SELECT fecha_fin FROM prestador_servicio_valores 
   WHERE id_prestador_servicio = 123 
   ORDER BY fecha_inicio DESC LIMIT 2;
   ```

3. **Consultar valor vigente por fecha**
   ```sql
   -- Verificar query BETWEEN
   SELECT * FROM prestador_servicio_valores 
   WHERE id_prestador_servicio = 123 
     AND '2024-06-15' BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31');
   ```

4. **Conversión de IDs**
   ```sql
   -- Verificar que id_servicio se convierte correctamente
   SELECT ps.id_prestador_servicio, ps.id_servicio 
   FROM prestador_servicio ps 
   WHERE ps.id_servicio = '123' AND ps.idobra_social = 1;
   ```

### Casos de Prueba Frontend
1. **Modal de valores históricos**
   - Abrir modal desde tabla de servicios
   - Verificar carga de histórico
   - Editar valores actuales
   - Agregar múltiples valores futuros
   - Verificar formato argentino

2. **Integración con presupuestos**
   - Crear presupuesto nuevo → valores actuales
   - Ver presupuesto histórico → valores de esa fecha
   - Editar presupuesto → valores actuales para nuevas prestaciones

## 🌟 Sistema de Valores por Sucursal

### Concepto
Permite configurar precios diferenciados por sucursal para el mismo servicio y financiador.

### Comportamiento
- **`sucursal_id = NULL`**: Valor general (aplica a todas las sucursales)
- **`sucursal_id = X`**: Valor específico (solo para esa sucursal)
- **Prioridad**: Específico > General

### Casos de Uso

#### Caso 1: Valor General
```sql
INSERT INTO prestador_servicio_valores 
VALUES (1, 123, NULL, 1000, 1200, '2024-01-01', NULL);
```
**Resultado**: Todas las sucursales ven $1,200

#### Caso 2: Valor General + Específico CABA
```sql
-- General
INSERT INTO prestador_servicio_valores 
VALUES (1, 123, NULL, 1000, 1200, '2024-01-01', NULL);

-- CABA específico
INSERT INTO prestador_servicio_valores 
VALUES (2, 123, 1, 1100, 1400, '2024-01-01', NULL);
```
**Resultado**:
- CABA: $1,400 (específico)
- Otras: $1,200 (general)

#### Caso 3: Solo Valores Específicos
```sql
INSERT INTO prestador_servicio_valores 
VALUES (1, 123, 1, 1000, 1200, '2024-01-01', NULL); -- CABA

INSERT INTO prestador_servicio_valores 
VALUES (2, 123, 2, 1000, 1200, '2024-01-01', NULL); -- Córdoba
```
**Resultado**:
- CABA: $1,200
- Córdoba: $1,200
- Mendoza: **NO ve el servicio** (sin acuerdo)

### Recomendaciones
✅ Siempre crear valor general como fallback  
✅ Valores específicos solo cuando hay acuerdo diferenciado  
⚠️ Sin valor general, sucursales sin específico no ven el servicio

## 📈 Mejoras Futuras (Opcional)

### Funcionalidades Adicionales
- [ ] Validar que fecha_inicio no solape con períodos existentes (por sucursal)
- [ ] Permitir editar/eliminar valores históricos
- [ ] Copiar valores de una sucursal a otra
- [ ] Exportar histórico a Excel
- [ ] Gráfico de evolución de precios (Chart.js)
- [ ] Notificaciones de cambios de precio
- [ ] Auditoría de cambios (quién modificó qué)
- [ ] Importación masiva de valores desde CSV

### Optimizaciones
- [ ] Cache de valores vigentes en Redis
- [ ] Índice compuesto en (id_prestador_servicio, fecha_inicio, fecha_fin)
- [ ] Paginación en histórico si hay muchos registros
- [ ] Lazy loading de valores históricos

## 🐛 Troubleshooting

### Error: "No se encontraron valores para este servicio"
- Verificar que la migración se ejecutó correctamente
- Verificar que existe registro en `prestador_servicio_valores`
- Revisar que `id_prestador_servicio` coincide con `prestador_servicio.id_prestador_servicio`

### Error: "Servicio no encontrado para este financiador"
- Verificar que existe registro en `prestador_servicio` con ese `id_servicio` y `idobra_social`
- Revisar que el servicio está activo (`activo = 1`)

### Valores no se actualizan en presupuestos existentes
- **Comportamiento esperado**: Los presupuestos existentes mantienen sus valores originales
- Solo los **nuevos presupuestos** usan valores históricos actuales
- Al editar presupuesto (nueva versión), `valor_facturar` se actualiza

### Modal no muestra histórico
- Verificar endpoint: `GET /prestaciones/servicio/:id/valores`
- Revisar console del navegador para errores
- Verificar que el servicio tiene registros en la tabla

### Formato monetario incorrecto
- Verificar que NumberInput tiene `decimalSeparator=","` y `thousandSeparator="."`
- Verificar `prefix="$ "` en todos los NumberInput

## 📞 Soporte

Si hay problemas:
1. Verificar que la migración se ejecutó correctamente
2. Revisar logs del backend (`npm run dev`)
3. Verificar que los endpoints responden correctamente
4. Comprobar que el frontend tiene la URL correcta en `.env`
5. Revisar console del navegador para errores de frontend
6. Verificar conversión de `id_servicio` a `id_prestador_servicio`

---

**Estado:** ✅ Implementación completa y funcional (incluye valores por sucursal)
**Fecha:** Enero 2025
**Versión:** 2.5
**Desarrollador:** Sistema Presupuestador Web

## 🆕 Changelog v2.5 (Enero 2025)

### Mejoras de UX y Validaciones
- ✅ Switch "Estado del Servicio" movido dentro del modal
- ✅ Validación: Solo permite activar si existe al menos 1 valor vigente (fecha_fin = NULL)
- ✅ Eliminada creación automática de registros con $0 al activar servicios
- ✅ Columna "Estado" en tabla principal (solo lectura, sin switch)
- ✅ Flujo simplificado: Agregar valores → Activar servicio → Cerrar modal
- ✅ Mensaje de error claro si intenta activar sin valores vigentes

### Troubleshooting Adicional

**Error: "Debes agregar al menos un valor vigente antes de activar el servicio"**
- El servicio no tiene valores históricos con `fecha_fin = NULL`
- Agregar un nuevo valor desde la sección "Agregar Valores con Fecha de Vigencia"
- Luego intentar activar el switch nuevamente

**Servicios con valores en $0**
- Eliminar registros con `valor_facturar = 0 AND valor_asignado = 0`
- El sistema ya no crea registros automáticamente al activar servicios
- Todos los valores deben cargarse manualmente desde el modal
