# Migración: Sistema de Valores Históricos

## 📋 Descripción
Esta migración implementa el sistema de valores históricos (timelapse) para prestador_servicio, permitiendo gestionar precios por períodos de vigencia.

## 🚀 Ejecutar Migración

### Opción 1: MySQL Command Line
```bash
mysql -u root -p presupuestador < migrations/create_prestador_servicio_valores.sql
```

### Opción 2: MySQL Workbench
1. Abrir MySQL Workbench
2. Conectar a la base de datos `presupuestador`
3. Abrir el archivo `migrations/create_prestador_servicio_valores.sql`
4. Ejecutar el script completo

## ✅ Verificar Migración

```sql
-- Verificar que la tabla se creó correctamente
DESCRIBE prestador_servicio_valores;

-- Verificar que se migraron los valores actuales
SELECT COUNT(*) FROM prestador_servicio_valores;

-- Ver algunos registros de ejemplo
SELECT * FROM prestador_servicio_valores LIMIT 10;
```

## 📊 Estructura de la Tabla

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID autoincremental |
| id_prestador_servicio | INT | FK a prestador_servicio |
| valor_asignado | DECIMAL(10,2) | Valor asignado (costo) |
| valor_facturar | DECIMAL(10,2) | Valor a facturar (precio) |
| fecha_inicio | DATE | Inicio de vigencia |
| fecha_fin | DATE (NULL) | Fin de vigencia (NULL = vigente) |
| created_at | TIMESTAMP | Fecha de creación |

## 🔄 Endpoints Nuevos

### GET /prestaciones/servicio/:id/valores
Obtiene el histórico de valores de un servicio

### POST /prestaciones/servicio/:id/valores
Guarda un nuevo valor (cierra automáticamente el período anterior)

**Body:**
```json
{
  "valor_asignado": 1500.00,
  "valor_facturar": 2000.00,
  "fecha_inicio": "2024-06-01"
}
```

## 🎯 Uso en Frontend

```tsx
import ModalValoresHistoricos from '@/components/ModalValoresHistoricos';

// En tu componente
<ModalValoresHistoricos
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  idServicio={123}
  nombreServicio="Consulta Médica"
/>
```

## ⚠️ Notas Importantes

1. La migración copia los valores actuales de `prestador_servicio` como primer período histórico con fecha 2024-01-01
2. Al guardar un nuevo valor, el sistema cierra automáticamente el período anterior
3. Los presupuestos históricos mantienen sus valores en `presupuesto_prestaciones` (no se modifican)
4. El endpoint `/prestador/:id` ahora devuelve valores vigentes desde `prestador_servicio_valores` con fallback a valores históricos

## 🔙 Rollback (si es necesario)

```sql
DROP TABLE IF EXISTS prestador_servicio_valores;
```
