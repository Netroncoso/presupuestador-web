-- Rollback de migración 022 (parcial)
-- Restaurar códigos desde financiador_servicio a servicios

-- Restaurar códigos desde financiador_servicio
UPDATE servicios s
  JOIN financiador_servicio fs ON s.id = fs.servicio_id
  SET s.codigo_financiador = fs.codigo_financiador
  WHERE fs.codigo_financiador IS NOT NULL
    AND s.id > 0;

-- Limpiar códigos de financiador_servicio
UPDATE financiador_servicio 
  SET codigo_financiador = NULL 
  WHERE id > 0;
