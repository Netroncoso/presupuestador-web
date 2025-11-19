# Mejoras a PropuestaCompleta.md

## 1. Optimizaciones en Notificaciones

### Problema Actual:
```sql
-- Esto puede crear múltiples notificaciones duplicadas
INSERT INTO notificaciones (usuario_id, presupuesto_id, mensaje)
SELECT u.id, p.idPresupuestos, 'Nuevo presupuesto pendiente de revisión'
FROM presupuestos p
CROSS JOIN usuarios u
WHERE p.idPresupuestos = ? AND p.estado = 'pendiente'
AND u.rol = 'auditor_medico';
```

### Mejora Propuesta:
```sql
-- Tabla notificaciones con campos adicionales
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT NOT NULL,  -- AGREGAR ESTO
    tipo ENUM('pendiente','aprobado','rechazado','nueva_version') NOT NULL,  -- AGREGAR ESTO
    mensaje VARCHAR(512),
    estado ENUM('nuevo','leido') DEFAULT 'nuevo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos),
    INDEX(usuario_id, estado, creado_en),
    UNIQUE KEY unique_notification (usuario_id, presupuesto_id, version_presupuesto, tipo)  -- EVITAR DUPLICADOS
);
```

## 2. Triggers Automáticos (Más Eficiente)

```sql
-- Trigger para notificaciones automáticas
DELIMITER $$
CREATE TRIGGER notificar_cambio_estado 
AFTER UPDATE ON presupuestos
FOR EACH ROW
BEGIN
    -- Solo si cambió el estado y es la última versión
    IF OLD.estado != NEW.estado AND NEW.es_ultima_version = 1 THEN
        
        -- Notificar a auditor si pasa a pendiente
        IF NEW.estado = 'pendiente' THEN
            INSERT IGNORE INTO notificaciones 
            (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
            SELECT u.id, NEW.idPresupuestos, NEW.version, 'pendiente',
                   CONCAT('Presupuesto v', NEW.version, ' requiere revisión')
            FROM usuarios u WHERE u.rol = 'auditor_medico';
        END IF;
        
        -- Notificar al creador si auditor decidió
        IF NEW.estado IN ('aprobado', 'rechazado') THEN
            INSERT IGNORE INTO notificaciones 
            (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
            VALUES (NEW.usuario_id, NEW.idPresupuestos, NEW.version, NEW.estado,
                    CONCAT('Presupuesto v', NEW.version, ' ', UPPER(NEW.estado)));
        END IF;
    END IF;
END$$
DELIMITER ;
```

## 3. Endpoint de Estadísticas Auditor

```javascript
// GET /auditor/estadisticas
app.get('/auditor/estadisticas', auth, requireRole('auditor_medico'), async (req, res) => {
    const stats = await db.execute(`
        SELECT 
            COUNT(*) as total_pendientes,
            COUNT(CASE WHEN DATEDIFF(NOW(), created_at) > 2 THEN 1 END) as pendientes_antiguos,
            AVG(costo_total) as costo_promedio,
            COUNT(CASE WHEN rentabilidad < 15 THEN 1 END) as baja_rentabilidad
        FROM presupuestos 
        WHERE estado = 'pendiente' AND es_ultima_version = 1
    `);
    
    res.json(stats[0]);
});
```

## 4. Validación de Reglas Automáticas

```javascript
// Función más robusta para evaluar estado
function evaluarEstadoAutomatico(presupuesto) {
    const reglas = [];
    
    if (presupuesto.rentabilidad < 15) {
        reglas.push('Rentabilidad menor a 15%');
    }
    
    if (presupuesto.costo_total > 150000) {
        reglas.push('Costo total superior a $150,000');
    }
    
    if (presupuesto.dificil_acceso === 'SI') {
        reglas.push('Marcado como difícil acceso');
    }
    
    // Si hay reglas que se activaron, va a pendiente
    if (reglas.length > 0) {
        return {
            estado: 'pendiente',
            motivo: reglas.join(', ')
        };
    }
    
    return {
        estado: 'borrador',
        motivo: null
    };
}
```

## 5. Middleware de Autorización Específico

```javascript
// middleware/auditAuth.ts
export const requireAuditor = (req, res, next) => {
    if (req.user.rol !== 'auditor_medico') {
        return res.status(403).json({ error: 'Acceso denegado: Solo auditores' });
    }
    next();
};

export const requireAuditorOrAdmin = (req, res, next) => {
    if (!['auditor_medico', 'admin'].includes(req.user.rol)) {
        return res.status(403).json({ error: 'Acceso denegado: Solo auditores o admins' });
    }
    next();
};
```

## 6. Query Optimizada para Dashboard Auditor

```sql
-- Vista materializada para performance
CREATE VIEW vista_auditor_dashboard AS
SELECT 
    p.idPresupuestos,
    p.version,
    p.nombre_paciente,
    p.dni_paciente,
    p.costo_total,
    p.rentabilidad,
    p.estado,
    p.created_at,
    p.dificil_acceso,
    u.username as creador,
    s.Sucursales_mh as sucursal,
    DATEDIFF(NOW(), p.created_at) as dias_pendiente
FROM presupuestos p
LEFT JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
WHERE p.es_ultima_version = 1 
AND p.estado IN ('pendiente', 'en_revision');
```

## 7. Configuración de Reglas Dinámicas (Futuro)

```sql
-- Tabla para hacer reglas configurables
CREATE TABLE reglas_aprobacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    condicion VARCHAR(500) NOT NULL,  -- ej: "rentabilidad < 15"
    activa TINYINT(1) DEFAULT 1,
    mensaje VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO reglas_aprobacion (nombre, condicion, mensaje) VALUES
('Rentabilidad Baja', 'rentabilidad < 15', 'Rentabilidad menor al 15%'),
('Monto Alto', 'costo_total > 150000', 'Costo total superior a $150,000'),
('Difícil Acceso', 'dificil_acceso = "SI"', 'Marcado como difícil acceso');
```

## Resumen de Mejoras

1. **Notificaciones sin duplicados** - UNIQUE constraint + campos adicionales
2. **Triggers automáticos** - Sin código manual en cada operación  
3. **Estadísticas auditor** - Dashboard con métricas útiles
4. **Validación robusta** - Función que explica por qué va a pendiente
5. **Middleware específico** - Autorización granular por rol
6. **Queries optimizadas** - Vista materializada para performance
7. **Reglas configurables** - Preparado para futuras modificaciones

La propuesta original está excelente, estas son solo optimizaciones para hacerla aún más robusta y mantenible.