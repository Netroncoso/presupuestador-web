import pandas as pd

# Leer Excel
df = pd.read_excel('Tarifarioactual.xlsx')

# Renombrar columna
df = df.rename(columns={'Etiquetas de fila': 'servicio'})

# Identificar filas de servicios (no NaN en columna servicio)
servicios_rows = df[df['servicio'].notna()].index.tolist()

# Preparar datos para CSV
data_csv = []

# Mapeo de columnas Excel a nombres de zonas en BD
zonas_mapeo = {
    'Caba': 'CABA',
    'Amba': 'AMBA',
    'La plata': 'LA PLATA',
    'Saladillo': 'SALADILLO',
    'Bahia Blanca Zona:CENTRO': 'CENTRO',
    'Bahia Blanca zona: REG AC': 'REG AC',
    'Salta': 'SALTA',
    'Tandil': 'TANDIL',
    'Mar de Ajo': 'MAR DE AJO',
    'Rojas': 'ROJAS'
}

# Procesar cada servicio
for i, servicio_idx in enumerate(servicios_rows):
    servicio_nombre = df.loc[servicio_idx, 'servicio']
    
    # Determinar rango de filas para este servicio
    if i < len(servicios_rows) - 1:
        end_idx = servicios_rows[i + 1]
    else:
        end_idx = len(df)
    
    # Extraer valores para cada zona
    for zona_excel, zona_bd in zonas_mapeo.items():
        # Obtener todos los valores no-NaN para esta zona en el rango del servicio
        valores = df.loc[servicio_idx:end_idx-1, zona_excel].dropna().tolist()
        
        if len(valores) > 0:
            # Tomar hasta 5 valores (ordenados de menor a mayor)
            valores_sorted = sorted([float(v) for v in valores])[:5]
            
            # Si hay menos de 5, rellenar con vacío
            while len(valores_sorted) < 5:
                valores_sorted.append('')
            
            # Agregar fila al CSV
            data_csv.append({
                'servicio': servicio_nombre,
                'zona': zona_bd,  # Usar nombre de zona de BD
                'costo_1': valores_sorted[0] if valores_sorted[0] != '' else '',
                'costo_2': valores_sorted[1] if valores_sorted[1] != '' else '',
                'costo_3': valores_sorted[2] if valores_sorted[2] != '' else '',
                'costo_4': valores_sorted[3] if valores_sorted[3] != '' else '',
                'costo_5': valores_sorted[4] if valores_sorted[4] != '' else ''
            })

# Crear DataFrame
df_csv = pd.DataFrame(data_csv)

# Filtrar filas que tengan al menos un costo
df_csv = df_csv[df_csv['costo_1'] != '']

# Guardar CSV
df_csv.to_csv('tarifario_importar.csv', index=False, encoding='utf-8')

print("=" * 80)
print("CONVERSION COMPLETADA")
print("=" * 80)
print(f"Archivo generado: tarifario_importar.csv")
print(f"Total de filas: {len(df_csv)}")
print(f"Servicios: {df_csv['servicio'].nunique()}")
print(f"Zonas: {df_csv['zona'].nunique()}")
print()
print("Servicios encontrados:")
for servicio in df_csv['servicio'].unique():
    count = len(df_csv[df_csv['servicio'] == servicio])
    print(f"  - {servicio}: {count} zonas con valores")
print()
print("Zonas encontradas:")
for zona in df_csv['zona'].unique():
    count = len(df_csv[df_csv['zona'] == zona])
    print(f"  - {zona}: {count} servicios")
print()
print("=" * 80)
print("Primeras 10 filas del CSV:")
print("=" * 80)
print(df_csv.head(10).to_string(index=False))
print()
print("=" * 80)
print("LISTO PARA IMPORTAR")
print("=" * 80)
