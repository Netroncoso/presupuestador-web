-- ============================================================================
-- MIGRACIÓN: RESTAURAR VALORES CORRECTOS DE ZONA
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Corregir zona_tarifario_id con valores correctos del CSV
-- ============================================================================

USE mh_1;

START TRANSACTION;

-- Mapeo de zonas: nombre → id
-- 1=CABA, 2=AMBA, 3=LA PLATA, 4=SALADILLO, 5=CENTRO, 6=REG AC, 7=SALTA, 8=TANDIL, 9=MAR DE AJO, 10=ROJAS

-- Actualizar zona_tarifario_id basado en el patrón de IDs
-- Los IDs siguen el patrón: cada servicio tiene 10 registros (uno por zona)
-- ID 1-10: HORA CUIDADOR (zonas 1-10)
-- ID 11-20: HORA ENFERMERIA ADULTO (zonas 1-10)
-- etc.

SET SQL_SAFE_UPDATES = 0;

-- HORA CUIDADOR (servicio_id = 1)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 11;  -- CABA
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 12;  -- AMBA
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 13;  -- LA PLATA
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 14;  -- SALADILLO
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 15;  -- CENTRO
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 16;  -- REG AC
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 17;  -- SALTA
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 18;  -- TANDIL
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 19;  -- MAR DE AJO
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 20; -- ROJAS

-- HORA ENFERMERIA ADULTO (servicio_id = 2)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 21;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 22;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 23;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 24;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 25;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 26;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 27;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 28;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 29;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 30;

-- HORA ENFERMERIA PEDIATRICA (servicio_id = 3)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 31;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 32;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 33;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 34;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 35;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 36;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 37;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 38;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 39;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 40;

-- KINESIOLOGIA (servicio_id = 9)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 1;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 2;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 3;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 4;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 5;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 6;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 7;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 8;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 9;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 10;

-- VISITA ENFERMERIA (servicio_id = 4)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 61;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 62;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 63;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 64;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 65;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 66;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 67;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 68;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 69;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 70;

-- VISITA ENFERMERIA PEDIATRICA (servicio_id = 5)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 71;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 72;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 73;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 74;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 75;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 76;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 77;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 78;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 79;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 80;

-- VISITA MEDICA CLINICA (servicio_id = 6)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 81;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 82;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 83;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 84;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 85;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 86;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 87;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 88;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 89;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 90;

-- VISITA MEDICO PEDIATRA (servicio_id = 7)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 91;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 92;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 93;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 94;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 95;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 96;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 97;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 98;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 99;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 100;

-- FONOAUDIOLOGIA (servicio_id = 8)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 41;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 42;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 43;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 44;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 45;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 46;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 47;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 48;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 49;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 50;

-- TERAPIA OCUPACIONAL (servicio_id = 10)
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 1 WHERE id = 51;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 2 WHERE id = 52;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 3 WHERE id = 53;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 4 WHERE id = 54;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 5 WHERE id = 55;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 6 WHERE id = 56;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 7 WHERE id = 57;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 8 WHERE id = 58;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 9 WHERE id = 59;
UPDATE tarifario_servicio_valores SET zona_tarifario_id = 10 WHERE id = 60;

SET SQL_SAFE_UPDATES = 1;

COMMIT;

SELECT 'Migración completada: Zonas restauradas correctamente' as status;

-- Verificar distribución
SELECT zona_tarifario_id, COUNT(*) as cantidad 
FROM tarifario_servicio_valores 
GROUP BY zona_tarifario_id 
ORDER BY zona_tarifario_id;
