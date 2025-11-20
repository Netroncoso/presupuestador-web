-- Debug: Verificar notificaciones del auditor
-- Reemplaza USER_ID con el ID real del auditor

-- 1. Ver todas las notificaciones del auditor
SELECT 
    n.id, 
    n.usuario_id,
    n.tipo, 
    n.mensaje, 
    n.estado, 
    n.creado_en,
    n.presupuesto_id, 
    n.version_presupuesto,
    p.Nombre_Apellido as paciente, 
    p.DNI as dni_paciente,
    u.username as usuario_nombre,
    u.rol as usuario_rol
FROM notificaciones n
LEFT JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos
LEFT JOIN usuarios u ON n.usuario_id = u.id
WHERE u.rol = 'auditor_medico'
ORDER BY n.creado_en DESC;

-- 2. Contar notificaciones no leídas por auditor
SELECT 
    u.id as usuario_id,
    u.username,
    u.rol,
    COUNT(*) as notificaciones_no_leidas
FROM notificaciones n
JOIN usuarios u ON n.usuario_id = u.id
WHERE u.rol = 'auditor_medico' AND n.estado = 'nuevo'
GROUP BY u.id, u.username, u.rol;

-- 3. Ver usuarios auditores
SELECT id, username, rol FROM usuarios WHERE rol = 'auditor_medico';

-- 4. Ver presupuestos pendientes que deberían generar notificaciones
SELECT 
    p.idPresupuestos,
    p.estado,
    p.Nombre_Apellido,
    p.rentabilidad,
    p.costo_total,
    p.created_at,
    u.username as creador
FROM presupuestos p
JOIN usuarios u ON p.usuario_id = u.id
WHERE p.estado IN ('pendiente', 'en_revision')
ORDER BY p.created_at DESC;