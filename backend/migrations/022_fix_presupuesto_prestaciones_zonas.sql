-- Migración 022: Corregir zonas en presupuesto_prestaciones
-- Problema: zona_id es ambiguo, necesitamos diferenciar zona de financiador vs zona de tarifario

-- 1. Agregar columnas específicas
ALTER TABLE presupuesto_prestaciones 
ADD COLUMN zona_financiador_id INT NULL COMMENT 'Zona para convenios con financiador',
ADD COLUMN zona_tarifario_id INT NULL COMMENT 'Zona para servicios del tarifario';

-- 2. Migrar datos existentes: zona_id → zona_financiador_id (todos son convenios actualmente)
UPDATE presupuesto_prestaciones 
SET zona_financiador_id = zona_id
WHERE id > 0;

-- 3. Agregar FKs
ALTER TABLE presupuesto_prestaciones
ADD CONSTRAINT fk_pp_zona_financiador 
  FOREIGN KEY (zona_financiador_id) REFERENCES financiador_zonas(id),
ADD CONSTRAINT fk_pp_zona_tarifario 
  FOREIGN KEY (zona_tarifario_id) REFERENCES tarifario_zonas(id);

-- 4. Eliminar zona_id antigua (después de verificar migración)
-- ALTER TABLE presupuesto_prestaciones DROP COLUMN zona_id;

-- Nota: Mantener zona_id temporalmente para rollback si es necesario
