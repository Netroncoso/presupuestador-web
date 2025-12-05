-- Limpiar parámetros de alertas de rentabilidad que ya no se usan

DELETE FROM configuracion_sistema 
WHERE clave IN (
  'alerta.rentabilidad.autorizado',
  'alerta.rentabilidad.superRentable'
);

-- Verificar que solo queden 4 parámetros de rentabilidad
SELECT * FROM configuracion_sistema 
WHERE categoria = 'alertas' AND clave LIKE '%rentabilidad%' 
ORDER BY valor;
