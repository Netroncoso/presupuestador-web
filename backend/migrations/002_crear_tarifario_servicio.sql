-- ============================================================================
-- MIGRACIÓN: TARIFARIO - SERVICIOS Y VALORES HISTÓRICOS
-- ============================================================================
-- Crea tablas tarifario_servicio y tarifario_servicio_valores
-- Similar a financiador_servicio + financiador_servicio_valores
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- 1. CREAR TABLA DE SERVICIOS DEL TARIFARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS tarifario_servicio (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL COMMENT 'Ej: HORA CUIDADOR, HORA ENFERMERIA ADULTO',
  descripcion TEXT,
  tipo_unidad VARCHAR(50) COLLATE utf8mb4_0900_ai_ci COMMENT 'FK → tipos_unidad.nombre',
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_nombre (nombre),
  KEY idx_activo (activo),
  KEY idx_tipo_unidad (tipo_unidad),
  FOREIGN KEY (tipo_unidad) REFERENCES tipos_unidad(nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. CREAR TABLA DE VALORES HISTÓRICOS POR ZONA
-- ============================================================================

CREATE TABLE IF NOT EXISTS tarifario_servicio_valores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tarifario_servicio_id INT NOT NULL COMMENT 'FK → tarifario_servicio.id',
  zona_id INT NOT NULL COMMENT 'FK → tarifario_zonas.id',
  costo_1 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 1 (más bajo)',
  costo_2 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 2',
  costo_3 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 3',
  costo_4 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 4',
  costo_5 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 5 (más alto)',
  fecha_inicio DATE NOT NULL COMMENT 'Inicio de vigencia',
  fecha_fin DATE DEFAULT NULL COMMENT 'Fin de vigencia (NULL = vigente)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarifario_servicio_id) REFERENCES tarifario_servicio(id) ON DELETE CASCADE,
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  KEY idx_servicio_zona (tarifario_servicio_id, zona_id),
  KEY idx_vigencia (fecha_inicio, fecha_fin),
  KEY idx_servicio_vigente (tarifario_servicio_id, zona_id, fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- ESTRUCTURA DE COSTOS:
-- - 5 costos ordenados de menor a mayor (costo_1 a costo_5)
-- - costo_1: Valor más bajo (orden=1)
-- - costo_5: Valor más alto (orden=5) → Dispara alerta + auditoría prestacional
--
-- VALORES HISTÓRICOS:
-- - Sistema timelapse similar a financiador_servicio_valores
-- - fecha_fin = NULL indica valor vigente actualmente
-- - Al agregar nuevo valor, se cierra automáticamente el anterior
--
-- REGLAS DE AUDITORÍA:
-- - Seleccionar costo_5 → Alerta persistente + Auditoría prestacional obligatoria
-- - Superar tope máximo → Alerta + Modal + Auditoría comercial obligatoria
-- - Editar costo manualmente → fuera_tarifario=1 en presupuesto_prestaciones
--
-- MARKUP CONFIGURABLE:
-- - Porcentaje por defecto: 50% (configuracion_sistema.clave = 'markup_tarifario')
-- - Fórmula: valor_facturar = costo * (1 + markup/100)
--
-- ============================================================================

-- 3. INSERTAR TIPO DE UNIDAD 'horas' SI NO EXISTE
-- ============================================================================

INSERT IGNORE INTO tipos_unidad (nombre, descripcion) VALUES
('horas', 'Unidad de tiempo en horas');

-- 4. INSERTAR SERVICIOS DEL TARIFARIO (10 servicios del Excel)
-- ============================================================================

INSERT INTO tarifario_servicio (nombre, tipo_unidad) VALUES
('HORA CUIDADOR', 'horas'),
('HORA ENFERMERIA ADULTO', 'horas'),
('HORA ENFERMERIA PEDIATRICA', 'horas'),
('HORA KINESIOLOGIA', 'horas'),
('HORA FONOAUDIOLOGIA', 'horas'),
('HORA TERAPIA OCUPACIONAL', 'horas'),
('HORA PSICOPEDAGOGIA', 'horas'),
('HORA PSICOLOGIA', 'horas'),
('HORA NUTRICION', 'horas'),
('HORA TRABAJO SOCIAL', 'horas');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
    ts.id,
    ts.nombre,
    ts.tipo_unidad,
    ts.activo,
    COUNT(tsv.id) as valores_historicos
FROM tarifario_servicio ts
LEFT JOIN tarifario_servicio_valores tsv ON ts.id = tsv.tarifario_servicio_id
GROUP BY ts.id, ts.nombre, ts.tipo_unidad, ts.activo
ORDER BY ts.id;

-- Resultado esperado:
-- 10 servicios insertados, 0 valores históricos (se importarán desde CSV)
