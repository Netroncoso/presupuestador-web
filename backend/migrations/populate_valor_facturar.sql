-- Poblar valor_facturar en registros existentes de presupuesto_prestaciones
-- Actualizar con valores de la tabla prestador_servicio

UPDATE presupuesto_prestaciones pp
JOIN prestador_servicio ps ON pp.id_servicio = ps.id_servicio
JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
SET pp.valor_facturar = ps.valor_facturar
WHERE (pp.valor_facturar = 0 OR pp.valor_facturar IS NULL) 
AND ps.idobra_social = p.idobra_social;

-- Verificar registros actualizados
SELECT COUNT(*) as registros_actualizados 
FROM presupuesto_prestaciones 
WHERE valor_facturar > 0;