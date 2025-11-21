-- Migración para corregir tipos de datos en la tabla presupuestos
-- Los totales deben ser DECIMAL para manejar centavos correctamente

-- Cambiar tipos de datos de INT a DECIMAL(10,2)
ALTER TABLE presupuestos 
MODIFY COLUMN total_insumos DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN total_prestaciones DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN costo_total DECIMAL(10,2) DEFAULT 0.00;

-- Verificar que los datos existentes se convirtieron correctamente
SELECT 
    idPresupuestos,
    total_insumos,
    total_prestaciones, 
    costo_total,
    total_facturar,
    rentabilidad,
    rentabilidad_con_plazo
FROM presupuestos 
WHERE total_insumos IS NOT NULL OR total_prestaciones IS NOT NULL OR costo_total IS NOT NULL
LIMIT 5;