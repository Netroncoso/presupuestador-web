# ANÁLISIS DE ZONAS DEL TARIFARIO
# Generado automáticamente desde Tarifarioactual.xlsx

## ZONAS ENCONTRADAS EN EXCEL (10 zonas):

1. CABA
2. AMBA
3. LA PLATA
4. SALADILLO
5. Bahia Blanca Zona:CENTRO
6. Bahia Blanca zona: REG AC
7. SALTA
8. TANDIL
9. MAR DE AJO
10. ROJAS

## MAPEO PROPUESTO: ZONAS -> SUCURSALES

### 1. CABA
- Nombre zona BD: CABA
- Sucursal probable: CABA
- Es principal: SI
- Notas: Zona única para sucursal CABA

### 2. AMBA
- Nombre zona BD: AMBA
- Sucursal probable: AMBA / Provincia
- Es principal: SI
- Notas: Zona única para sucursal AMBA

### 3. LA PLATA
- Nombre zona BD: LA PLATA
- Sucursal probable: La Plata
- Es principal: SI
- Notas: Zona única para sucursal La Plata

### 4. SALADILLO
- Nombre zona BD: SALADILLO
- Sucursal probable: Saladillo
- Es principal: SI
- Notas: Zona única para sucursal Saladillo

### 5. Bahia Blanca Zona:CENTRO
- Nombre zona BD: CENTRO
- Sucursal probable: Bahía Blanca
- Es principal: SI
- Notas: Zona principal de Bahía Blanca

### 6. Bahia Blanca zona: REG AC
- Nombre zona BD: REG AC
- Sucursal probable: Bahía Blanca
- Es principal: NO
- Notas: Zona secundaria de Bahía Blanca

### 7. SALTA
- Nombre zona BD: SALTA
- Sucursal probable: Salta
- Es principal: SI
- Notas: Zona única para sucursal Salta

### 8. TANDIL
- Nombre zona BD: TANDIL
- Sucursal probable: Tandil
- Es principal: SI
- Notas: Zona única para sucursal Tandil

### 9. MAR DE AJO
- Nombre zona BD: MAR DE AJO
- Sucursal probable: Mar de Ajo
- Es principal: SI
- Notas: Zona única para sucursal Mar de Ajo

### 10. ROJAS
- Nombre zona BD: ROJAS
- Sucursal probable: Rojas
- Es principal: SI
- Notas: Zona única para sucursal Rojas

## RESUMEN

- Total zonas: 10
- Sucursales con 1 zona: 9
- Sucursales con 2 zonas: 1 (Bahía Blanca)

## ACCIÓN REQUERIDA:

1. Verificar nombres exactos de sucursales en tabla sucursales_mh
2. Obtener IDs reales de sucursales
3. Ajustar mapeo si nombres no coinciden
4. Ejecutar script SQL con IDs correctos

## SQL PARA IMPORTACIÓN (ajustar IDs según sucursales_mh reales)

```sql
-- 1. Insertar zonas
INSERT INTO tarifario_zonas (nombre, descripcion) VALUES
('CABA', 'Ciudad Autónoma de Buenos Aires'),
('AMBA', 'Área Metropolitana de Buenos Aires'),
('LA PLATA', 'La Plata'),
('SALADILLO', 'Saladillo'),
('CENTRO', 'Bahía Blanca - Zona Centro'),
('REG AC', 'Bahía Blanca - Región AC'),
('SALTA', 'Salta'),
('TANDIL', 'Tandil'),
('MAR DE AJO', 'Mar de Ajo'),
('ROJAS', 'Rojas');

-- 2. Mapear zonas a sucursales
-- IMPORTANTE: Ajustar sucursal_id según IDs reales en sucursales_mh
-- Ejemplo asumiendo IDs secuenciales:

INSERT INTO sucursales_tarifario_zonas (sucursal_id, zona_id, es_zona_principal) VALUES
-- Ajustar estos IDs según la consulta: SELECT ID, Sucursales_mh FROM sucursales_mh;
(1, 1, 1),   -- Sucursal CABA -> Zona CABA (principal)
(2, 2, 1),   -- Sucursal AMBA -> Zona AMBA (principal)
(3, 3, 1),   -- Sucursal La Plata -> Zona LA PLATA (principal)
(4, 4, 1),   -- Sucursal Saladillo -> Zona SALADILLO (principal)
(5, 5, 1),   -- Sucursal Bahía Blanca -> Zona CENTRO (principal)
(5, 6, 0),   -- Sucursal Bahía Blanca -> Zona REG AC (secundaria)
(6, 7, 1),   -- Sucursal Salta -> Zona SALTA (principal)
(7, 8, 1),   -- Sucursal Tandil -> Zona TANDIL (principal)
(8, 9, 1),   -- Sucursal Mar de Ajo -> Zona MAR DE AJO (principal)
(9, 10, 1);  -- Sucursal Rojas -> Zona ROJAS (principal)
```

## PRÓXIMOS PASOS:

1. Ejecutar: SELECT ID, Sucursales_mh FROM sucursales_mh ORDER BY ID;
2. Comparar nombres con el mapeo propuesto
3. Ajustar IDs en el SQL de importación
4. Ejecutar SQL de zonas
5. Ejecutar SQL de mapeo sucursales-zonas
6. Importar valores del tarifario (CSV)
