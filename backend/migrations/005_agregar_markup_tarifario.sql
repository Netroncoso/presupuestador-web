-- ============================================================================
-- MIGRACIÓN: AGREGAR MARKUP TARIFARIO EN CONFIGURACIÓN
-- ============================================================================
-- Agrega parámetro de markup global para cálculo de valores a facturar
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- INSERTAR PARÁMETRO DE MARKUP
-- ============================================================================

INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad)
VALUES ('markup_tarifario', 50.00, 'Porcentaje de markup para calcular valor a facturar desde tarifario', 'tarifario', '%');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT * FROM configuracion_sistema WHERE clave = 'markup_tarifario';

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- FÓRMULA:
-- valor_facturar = costo_prestacional * (1 + markup/100)
-- 
-- EJEMPLO CON MARKUP 50%:
-- Costo: $3,000
-- Valor a facturar: $3,000 * (1 + 50/100) = $3,000 * 1.50 = $4,500
--
-- CONFIGURACIÓN:
-- - Valor por defecto: 50.00 (50%)
-- - Editable desde Admin Panel > Configuración Sistema
-- - Aplica a todos los servicios del tarifario
-- - Rango válido: 0-100%
--
-- ============================================================================
