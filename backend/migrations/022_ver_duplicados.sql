-- Ver servicios duplicados que quedaron
SELECT nombre, COUNT(*) as total, GROUP_CONCAT(id) as ids
FROM servicios
GROUP BY nombre
HAVING COUNT(*) > 1;
