# Limpieza de Código Muerto - Auditoria.tsx

**Fecha**: 2025-01-15
**Razón**: El componente `Auditoria.tsx` quedó como código muerto después de implementar `AuditorDashboard.tsx`

## 🔍 Análisis

### Situación Actual
- Los auditores médicos se loguean y son redirigidos a `AuditorDashboard.tsx` (ver `App.tsx` línea 27)
- `Auditoria.tsx` está importado en `UserDashboard.tsx` pero nunca se renderiza porque:
  - Los auditores médicos nunca ven `UserDashboard` (van directo a `AuditorDashboard`)
  - Los usuarios normales no tienen `rol === 'auditor_medico'` por lo que la pestaña condicional nunca aparece

### Componentes Afectados
1. **Auditoria.tsx** - Componente completo (código muerto)
2. **UserDashboard.tsx** - Tiene referencias que nunca se ejecutan

## 📝 Cambios Realizados

### 1. Archivo Eliminado
- ✅ `frontend/src/pages/Auditoria.tsx` - Eliminado completamente

### 2. UserDashboard.tsx - Cambios

#### Imports Eliminados (línea 8)
```typescript
// ANTES
import Auditoria from "./Auditoria";

// DESPUÉS
// (línea eliminada)
```

#### Estados Eliminados (línea 60)
```typescript
// ANTES
const [filtroAuditoriaPresupuesto, setFiltroAuditoriaPresupuesto] = useState<number | null>(null);

// DESPUÉS
// (línea eliminada)
```

#### Tab Condicional Eliminado (líneas 506-511)
```typescript
// ANTES
{user?.rol === 'auditor_medico' && (
  <Tabs.Tab value="auditoria" style={TAB_HOVER_STYLE}>
    <Group gap="xs">
      <ShieldCheckIcon style={ICON_SIZE} />
      Auditoría
    </Group>
  </Tabs.Tab>
)}

// DESPUÉS
// (líneas eliminadas)
```

#### Panel Eliminado (líneas 524-530)
```typescript
// ANTES
{user?.rol === 'auditor_medico' && (
  <Tabs.Panel value="auditoria" pt="md">
    <Auditoria 
      onCargarPresupuesto={handleEditarPresupuesto} 
      filtroPresupuesto={filtroAuditoriaPresupuesto}
      onLimpiarFiltro={() => setFiltroAuditoriaPresupuesto(null)}
    />
  </Tabs.Panel>
)}

// DESPUÉS
// (líneas eliminadas)
```

#### Callback Modificado (líneas 517-520)
```typescript
// ANTES
<Notificaciones onIrAuditoria={(presupuestoId) => {
  setFiltroAuditoriaPresupuesto(presupuestoId);
  setActiveTab('auditoria');
}} />

// DESPUÉS
<Notificaciones />
```

#### Import de ShieldCheckIcon
```typescript
// VERIFICAR: Si ShieldCheckIcon no se usa en otro lugar de UserDashboard, eliminar del import
// Línea 29: ShieldCheckIcon se usa solo en la tab de auditoría eliminada
// ACCIÓN: Eliminar ShieldCheckIcon del import de heroicons
```

## 🔄 Para Revertir los Cambios

Si necesitas restaurar el código:

### 1. Restaurar Auditoria.tsx
```bash
git checkout HEAD -- frontend/src/pages/Auditoria.tsx
```

### 2. Restaurar UserDashboard.tsx
```bash
git checkout HEAD -- frontend/src/pages/UserDashboard.tsx
```

### 3. O restaurar desde este archivo
Copiar el código del backup incluido al final de este documento.

## ✅ Verificación Post-Limpieza

- [ ] La aplicación compila sin errores
- [ ] Los usuarios normales pueden loguearse y usar el dashboard
- [ ] Los auditores médicos pueden loguearse y ver AuditorDashboard
- [ ] Las notificaciones funcionan correctamente
- [ ] No hay imports no utilizados
- [ ] No hay warnings de TypeScript

## 📊 Impacto

### Archivos Modificados
- `frontend/src/pages/UserDashboard.tsx` - Limpieza de código muerto
- `frontend/src/pages/Auditoria.tsx` - ELIMINADO

### Archivos NO Afectados
- `frontend/src/pages/AuditorDashboard.tsx` - Sin cambios (dashboard activo)
- `frontend/src/components/ModalAuditoria.tsx` - Sin cambios (usado en ambos dashboards)
- `frontend/src/pages/Notificaciones.tsx` - Sin cambios (prop onIrAuditoria es opcional)

### Líneas de Código Eliminadas
- Auditoria.tsx: ~280 líneas
- UserDashboard.tsx: ~20 líneas
- **Total: ~300 líneas de código muerto eliminadas**

## 🎯 Resultado Final

El sistema ahora tiene una arquitectura más limpia:
- **Usuarios normales** → `UserDashboard.tsx` (sin pestaña de auditoría)
- **Auditores médicos** → `AuditorDashboard.tsx` (dashboard dedicado)
- **Administradores** → `AdminDashboard.tsx`

No hay código duplicado ni componentes sin usar.

---

## 📦 Backup del Código Eliminado

### Auditoria.tsx (RESPALDO COMPLETO)
Ver commit anterior o archivo en git history para recuperar el código completo.

### UserDashboard.tsx - Fragmentos Eliminados

#### Import
```typescript
import Auditoria from "./Auditoria";
```

#### Estado
```typescript
const [filtroAuditoriaPresupuesto, setFiltroAuditoriaPresupuesto] = useState<number | null>(null);
```

#### Tab
```typescript
{user?.rol === 'auditor_medico' && (
  <Tabs.Tab value="auditoria" style={TAB_HOVER_STYLE}>
    <Group gap="xs">
      <ShieldCheckIcon style={ICON_SIZE} />
      Auditoría
    </Group>
  </Tabs.Tab>
)}
```

#### Panel
```typescript
{user?.rol === 'auditor_medico' && (
  <Tabs.Panel value="auditoria" pt="md">
    <Auditoria 
      onCargarPresupuesto={handleEditarPresupuesto} 
      filtroPresupuesto={filtroAuditoriaPresupuesto}
      onLimpiarFiltro={() => setFiltroAuditoriaPresupuesto(null)}
    />
  </Tabs.Panel>
)}
```

#### Callback en Notificaciones
```typescript
<Notificaciones onIrAuditoria={(presupuestoId) => {
  setFiltroAuditoriaPresupuesto(presupuestoId);
  setActiveTab('auditoria');
}} />
```

---

**Nota**: Este archivo debe guardarse en el repositorio para tener trazabilidad de los cambios realizados.
