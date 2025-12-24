USE mh_1;

-- Agregar nuevos roles
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
) DEFAULT 'user';

-- Verificar
SELECT 'Roles actualizados correctamente' AS resultado;
SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol;
