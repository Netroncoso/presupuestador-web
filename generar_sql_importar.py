import csv

# Leer CSV y generar SQL
with open('tarifario_importar.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    with open('backend/migrations/003_importar_valores_manual.sql', 'w', encoding='utf-8') as out:
        out.write("-- ============================================================================\n")
        out.write("-- MIGRACIÓN: IMPORTAR VALORES DEL TARIFARIO (INSERT MANUAL)\n")
        out.write("-- ============================================================================\n")
        out.write("-- 100 registros (10 servicios × 10 zonas)\n")
        out.write("-- Fecha: Enero 2025\n")
        out.write("-- ============================================================================\n")
        out.write("\n")
        out.write("USE mh_1;\n")
        out.write("\n")
        out.write("INSERT INTO tarifario_servicio_valores\n")
        out.write("(tarifario_servicio_id, zona_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio, fecha_fin)\n")
        out.write("VALUES\n")
        
        rows = []
        for row in reader:
            servicio = row['servicio']
            zona = row['zona']
            c1 = row['costo_1']
            c2 = row['costo_2']
            c3 = row['costo_3']
            c4 = row['costo_4']
            c5 = row['costo_5']
            
            sql = f"((SELECT id FROM tarifario_servicio WHERE nombre = '{servicio}'), (SELECT id FROM tarifario_zonas WHERE nombre = '{zona}'), {c1}, {c2}, {c3}, {c4}, {c5}, CURDATE(), NULL)"
            rows.append(sql)
        
        out.write(',\n'.join(rows) + ';\n')
        out.write("\n")
        out.write("-- ============================================================================\n")
        out.write("-- VERIFICACIÓN\n")
        out.write("-- ============================================================================\n")
        out.write("\n")
        out.write("SELECT COUNT(*) as total_registros FROM tarifario_servicio_valores;\n")
        out.write("-- Resultado esperado: 100\n")

print("Archivo generado: backend/migrations/003_importar_valores_manual.sql")
