-- Agregar índice UNIQUE para evitar duplicados en presupuesto_equipamiento
USE mh_1;

-- Deshabilitar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Eliminar TODOS los duplicados (mantener solo el más reciente por grupo)
DELETE FROM presupuesto_equipamiento
WHERE id NOT IN (
  SELECT * FROM (
    SELECT MAX(id)
    FROM presupuesto_equipamiento
    GROUP BY idPresupuestos, id_equipamiento
  ) AS keep_ids
);

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;

-- Crear índice UNIQUE compuesto
ALTER TABLE presupuesto_equipamiento
ADD UNIQUE KEY uk_presupuesto_equipamiento (idPresupuestos, id_equipamiento);
