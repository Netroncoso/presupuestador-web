-- Agregar columna precio_facturar a presupuesto_insumos
ALTER TABLE presupuesto_insumos 
ADD COLUMN precio_facturar DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER costo;

-- Poblar precio_facturar con el valor actual de costo (que es realmente el precio facturado)
-- para mantener la integridad histórica
UPDATE presupuesto_insumos 
SET precio_facturar = costo 
WHERE precio_facturar = 0;

-- Verificar registros actualizados
SELECT COUNT(*) as registros_actualizados 
FROM presupuesto_insumos 
WHERE precio_facturar > 0;