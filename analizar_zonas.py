import pandas as pd

# Leer Excel
df = pd.read_excel('Tarifarioactual.xlsx')

# Zonas del Excel
zonas_excel = [
    'CABA', 
    'AMBA', 
    'LA PLATA', 
    'SALADILLO', 
    'Bahia Blanca Zona:CENTRO', 
    'Bahia Blanca zona: REG AC', 
    'SALTA', 
    'TANDIL', 
    'MAR DE AJO', 
    'ROJAS'
]

print("=" * 80)
print("ANÁLISIS DE ZONAS DEL TARIFARIO")
print("=" * 80)

print("\nZONAS ENCONTRADAS EN EXCEL:")
for i, zona in enumerate(zonas_excel, 1):
    print(f"  {i:2d}. {zona}")

print("\n" + "=" * 80)
print("MAPEO PROPUESTO: ZONAS → SUCURSALES")
print("=" * 80)

# Mapeo propuesto basado en nombres
mapeo = {
    'CABA': {
        'zona_nombre': 'CABA',
        'sucursal_probable': 'CABA',
        'es_principal': True,
        'notas': 'Zona única para sucursal CABA'
    },
    'AMBA': {
        'zona_nombre': 'AMBA',
        'sucursal_probable': 'AMBA / Provincia',
        'es_principal': True,
        'notas': 'Zona única para sucursal AMBA'
    },
    'LA PLATA': {
        'zona_nombre': 'LA PLATA',
        'sucursal_probable': 'La Plata',
        'es_principal': True,
        'notas': 'Zona única para sucursal La Plata'
    },
    'SALADILLO': {
        'zona_nombre': 'SALADILLO',
        'sucursal_probable': 'Saladillo',
        'es_principal': True,
        'notas': 'Zona única para sucursal Saladillo'
    },
    'Bahia Blanca Zona:CENTRO': {
        'zona_nombre': 'CENTRO',
        'sucursal_probable': 'Bahía Blanca',
        'es_principal': True,
        'notas': 'Zona principal de Bahía Blanca'
    },
    'Bahia Blanca zona: REG AC': {
        'zona_nombre': 'REG AC',
        'sucursal_probable': 'Bahía Blanca',
        'es_principal': False,
        'notas': 'Zona secundaria de Bahía Blanca'
    },
    'SALTA': {
        'zona_nombre': 'SALTA',
        'sucursal_probable': 'Salta',
        'es_principal': True,
        'notas': 'Zona única para sucursal Salta'
    },
    'TANDIL': {
        'zona_nombre': 'TANDIL',
        'sucursal_probable': 'Tandil',
        'es_principal': True,
        'notas': 'Zona única para sucursal Tandil'
    },
    'MAR DE AJO': {
        'zona_nombre': 'MAR DE AJO',
        'sucursal_probable': 'Mar de Ajo',
        'es_principal': True,
        'notas': 'Zona única para sucursal Mar de Ajo'
    },
    'ROJAS': {
        'zona_nombre': 'ROJAS',
        'sucursal_probable': 'Rojas',
        'es_principal': True,
        'notas': 'Zona única para sucursal Rojas'
    }
}

print("\nDETALLE DEL MAPEO:\n")
for zona_excel, info in mapeo.items():
    print(f"Zona Excel: {zona_excel}")
    print(f"  → Nombre zona BD: {info['zona_nombre']}")
    print(f"  → Sucursal: {info['sucursal_probable']}")
    print(f"  → Principal: {'Sí' if info['es_principal'] else 'No'}")
    print(f"  → Notas: {info['notas']}")
    print()

print("=" * 80)
print("RESUMEN")
print("=" * 80)
print(f"Total zonas: {len(zonas_excel)}")
print(f"Sucursales con 1 zona: 8")
print(f"Sucursales con 2 zonas: 1 (Bahía Blanca)")
print()
print("   ACCION REQUERIDA:")
print("   1. Verificar nombres exactos de sucursales en tabla sucursales_mh")
print("   2. Ajustar mapeo si nombres no coinciden")
print("   3. Ejecutar script de importación con IDs correctos")
print("=" * 80)

# Generar SQL de ejemplo
print("\n" + "=" * 80)
print("SQL DE EJEMPLO (ajustar IDs según sucursales_mh reales)")
print("=" * 80)
print("""
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

-- 2. Mapear zonas a sucursales (AJUSTAR sucursal_id según BD real)
-- Ejemplo: Si CABA tiene ID=1, AMBA ID=2, etc.
INSERT INTO sucursales_tarifario_zonas (sucursal_id, zona_id, es_zona_principal) VALUES
(1, 1, 1),   -- CABA → CABA (principal)
(2, 2, 1),   -- AMBA → AMBA (principal)
(3, 3, 1),   -- La Plata → LA PLATA (principal)
(4, 4, 1),   -- Saladillo → SALADILLO (principal)
(5, 5, 1),   -- Bahía Blanca → CENTRO (principal)
(5, 6, 0),   -- Bahía Blanca → REG AC (secundaria)
(6, 7, 1),   -- Salta → SALTA (principal)
(7, 8, 1),   -- Tandil → TANDIL (principal)
(8, 9, 1),   -- Mar de Ajo → MAR DE AJO (principal)
(9, 10, 1);  -- Rojas → ROJAS (principal)
""")
