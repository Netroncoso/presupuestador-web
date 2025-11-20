-- 1. Verificar si existen notificaciones para estos presupuestos pendientes
SELECT 
    p.idPresupuestos,
    p.estado,
    p.Nombre_Apellido,
    n.id as notificacion_id,
    n.tipo,
    n.estado as notif_estado,
    n.usuario_id
FROM presupuestos p
LEFT JOIN notificaciones n ON p.idPresupuestos = n.presupuesto_id
WHERE p.estado IN ('pendiente', 'en_revision')
ORDER BY p.idPresupuestos DESC;

-- 2. Obtener ID del auditor médico
SELECT id, username, rol FROM usuarios WHERE rol = 'auditor_medico';

-- 3. CREAR NOTIFICACIONES FALTANTES (Reemplaza USER_ID con el ID del auditor)
INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje, estado, creado_en)
SELECT 
    2 as usuario_id, -- CAMBIAR POR EL ID DEL AUDITOR
    p.idPresupuestos,
    p.version,
    'pendiente' as tipo,
    CONCAT('Presupuesto #', p.idPresupuestos, ' para ', p.Nombre_Apellido, ' requiere auditoría médica') as mensaje,
    'nuevo' as estado,
    NOW() as creado_en
FROM presupuestos p
LEFT JOIN notificaciones n ON p.idPresupuestos = n.presupuesto_id 
    AND n.tipo = 'pendiente'
WHERE p.estado IN ('pendiente', 'en_revision')
    AND n.id IS NULL; -- Solo crear si no existe ya

-- 4. Verificar que se crearon correctamente
SELECT 
    n.id,
    n.usuario_id,
    n.presupuesto_id,
    n.tipo,
    n.mensaje,
    n.estado,
    u.username
FROM notificaciones n
JOIN usuarios u ON n.usuario_id = u.id
WHERE u.rol = 'auditor_medico'
ORDER BY n.creado_en DESC;