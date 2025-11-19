# Sistema de Notificaciones - Implementación Minimalista

## 1. Tabla de Notificaciones

```sql
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT NOT NULL,
    tipo ENUM('nueva_version', 'aprobacion_requerida', 'estado_cambio') NOT NULL,
    mensaje TEXT NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos),
    INDEX idx_usuario_leida (usuario_id, leida),
    INDEX idx_presupuesto_version (presupuesto_id, version_presupuesto)
);
```

## 2. Triggers Automáticos

```sql
-- Notificar cuando se crea nueva versión que requiere aprobación
DELIMITER $$
CREATE TRIGGER notificar_nueva_version 
AFTER INSERT ON presupuestos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'pendiente' THEN
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT 
            u.id,
            NEW.idPresupuestos,
            NEW.version,
            'aprobacion_requerida',
            CONCAT('Presupuesto v', NEW.version, ' para ', NEW.nombre_paciente, ' requiere aprobación')
        FROM usuarios u 
        WHERE u.rol = 'admin' OR u.puede_aprobar = 1;
    END IF;
END$$

-- Notificar cambios de estado
CREATE TRIGGER notificar_cambio_estado
AFTER UPDATE ON presupuestos
FOR EACH ROW
BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (
            NEW.usuario_id,
            NEW.idPresupuestos,
            NEW.version,
            'estado_cambio',
            CONCAT('Presupuesto v', NEW.version, ' cambió a: ', NEW.estado)
        );
    END IF;
END$$
DELIMITER ;
```

## 3. API Endpoints Mínimos

```javascript
// GET /api/notificaciones - Obtener notificaciones del usuario
app.get('/api/notificaciones', auth, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const [notificaciones] = await db.execute(`
        SELECT n.*, p.nombre_paciente, p.dni_paciente 
        FROM notificaciones n
        JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos 
            AND n.version_presupuesto = p.version
        WHERE n.usuario_id = ?
        ORDER BY n.fecha_creacion DESC
        LIMIT ? OFFSET ?
    `, [req.user.id, limit, offset]);
    
    res.json(notificaciones);
});

// PUT /api/notificaciones/:id/leer - Marcar como leída
app.put('/api/notificaciones/:id/leer', auth, async (req, res) => {
    await db.execute(
        'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
        [req.params.id, req.user.id]
    );
    res.json({ success: true });
});

// GET /api/notificaciones/count - Contador de no leídas
app.get('/api/notificaciones/count', auth, async (req, res) => {
    const [result] = await db.execute(
        'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND leida = 0',
        [req.user.id]
    );
    res.json({ count: result[0].count });
});
```

## 4. Componente Frontend Minimalista

```tsx
// components/NotificationBell.tsx
import { useState, useEffect } from 'react';

export const NotificationBell = () => {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Cada 30s
        return () => clearInterval(interval);
    }, []);

    const fetchCount = async () => {
        const response = await fetch('/api/notificaciones/count');
        const data = await response.json();
        setCount(data.count);
    };

    const fetchNotifications = async () => {
        const response = await fetch('/api/notificaciones?limit=5');
        const data = await response.json();
        setNotifications(data);
    };

    const markAsRead = async (id: number) => {
        await fetch(`/api/notificaciones/${id}/leer`, { method: 'PUT' });
        fetchCount();
        fetchNotifications();
    };

    return (
        <div className="notification-bell">
            <button 
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) fetchNotifications();
                }}
            >
                🔔 {count > 0 && <span className="badge">{count}</span>}
            </button>
            
            {showDropdown && (
                <div className="notification-dropdown">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${!notif.leida ? 'unread' : ''}`}>
                            <p>{notif.mensaje}</p>
                            <small>{new Date(notif.fecha_creacion).toLocaleString()}</small>
                            {!notif.leida && (
                                <button onClick={() => markAsRead(notif.id)}>✓</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

## 5. Integración con Sistema de Versiones

```javascript
// En presupuestosController.ts - Modificar función de crear versión
export const crearNuevaVersion = async (req, res) => {
    const { id } = req.params;
    const datosEditados = req.body;
    
    try {
        // 1. Marcar versión anterior como no-actual
        await db.execute(
            'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ?',
            [id]
        );
        
        // 2. Crear nueva versión
        const [result] = await db.execute(`
            INSERT INTO presupuestos (version, presupuesto_padre, es_ultima_version, estado, usuario_id, ...)
            SELECT version + 1, idPresupuestos, 1, ?, ?, ...
            FROM presupuestos WHERE idPresupuestos = ?
        `, [evaluarEstadoAutomatico(datosEditados), req.user.id, id]);
        
        // 3. Las notificaciones se crean automáticamente por trigger
        
        res.json({ success: true, nuevaVersion: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

function evaluarEstadoAutomatico(datos) {
    if (datos.rentabilidad < 15) return 'pendiente';
    if (datos.costo_total > 150000) return 'pendiente';
    return 'borrador';
}
```

## 6. Beneficios de esta Implementación

✅ **Automática**: Triggers manejan notificaciones sin código adicional
✅ **Eficiente**: Solo 3 endpoints necesarios
✅ **Escalable**: Índices optimizan consultas
✅ **Integrada**: Funciona perfectamente con sistema de versiones
✅ **Minimalista**: Máximo impacto con mínimo código

## 7. Casos de Uso Cubiertos

- ✅ Notificar a admins cuando presupuesto requiere aprobación
- ✅ Notificar a usuario cuando su presupuesto cambia de estado
- ✅ Contador de notificaciones no leídas
- ✅ Historial de notificaciones por usuario
- ✅ Integración automática con flujo de versiones

## 8. Próximos Pasos

1. Ejecutar migración de tabla `notificaciones`
2. Crear triggers automáticos
3. Implementar endpoints en backend
4. Agregar componente de campana en frontend
5. Integrar con sistema de versiones existente