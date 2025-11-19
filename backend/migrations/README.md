# Migraciones de Base de Datos

Esta carpeta contiene todos los scripts SQL para la configuración y actualización de la base de datos.

## Archivos

- `setup_database.sql` - Configuración inicial de la base de datos
- `create_presupuesto_insumos_table.sql` - Tabla de insumos por presupuesto
- `create_presupuesto_prestaciones_table.sql` - Tabla de prestaciones por presupuesto
- `add_idobra_social_column.sql` - Agregar columna de financiador
- `add_sucursal_to_usuarios.sql` - Agregar sucursal a usuarios
- `add_usuario_to_presupuestos.sql` - Agregar usuario creador a presupuestos

## Uso

Ejecutar los scripts en orden según sea necesario para configurar o actualizar la base de datos.

Para aplicar la migración de usuario:
```bash
node scripts/apply-usuario-migration.js
```
