-- Agregar columna valor_facturar a presupuesto_prestaciones
ALTER TABLE presupuesto_prestaciones 
ADD COLUMN valor_facturar DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER valor_asignado;
