import { PresupuestoCalculosService } from '../src/services/presupuestoCalculosService';
import { pool } from '../src/db';
import { RowDataPacket } from 'mysql2';

describe('PresupuestoCalculosService - Optimización', () => {
  let testPresupuestoId: number;
  const service = new PresupuestoCalculosService();

  beforeAll(async () => {
    // Obtener un financiador y sucursal existentes
    const [financiadores] = await pool.query<RowDataPacket[]>('SELECT id FROM financiador WHERE activo = 1 LIMIT 1');
    const [sucursales] = await pool.query<RowDataPacket[]>('SELECT ID FROM sucursales_mh LIMIT 1');
    
    const financiadorId = financiadores[0]?.id || null;
    const sucursalId = sucursales[0]?.ID || null;

    // Crear presupuesto de prueba
    const [result] = await pool.query<any>(
      `INSERT INTO presupuestos (Nombre_Apellido, DNI, financiador_id, sucursal_id, dificil_acceso, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Test Optimización', '99999999', financiadorId, sucursalId, 'NO', 'borrador']
    );
    testPresupuestoId = result.insertId;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await pool.query('DELETE FROM presupuesto_insumos WHERE idPresupuestos = ?', [testPresupuestoId]);
    await pool.query('DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [testPresupuestoId]);
    await pool.query('DELETE FROM presupuesto_prestaciones_tarifario WHERE idPresupuestos = ?', [testPresupuestoId]);
    await pool.query('DELETE FROM presupuesto_equipamiento WHERE idPresupuestos = ?', [testPresupuestoId]);
    await pool.query('DELETE FROM presupuestos WHERE idPresupuestos = ?', [testPresupuestoId]);
    await pool.end();
  });

  test('Recalcula totales correctamente con insumos', async () => {
    // Agregar insumo
    await pool.query(
      `INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad)
       VALUES (?, ?, ?, ?, ?)`,
      [testPresupuestoId, 'Test Insumo', 100.00, 150.00, 2]
    );

    await service.recalcularTotales(testPresupuestoId);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT total_insumos, costo_total, total_facturar FROM presupuestos WHERE idPresupuestos = ?',
      [testPresupuestoId]
    );

    expect(Number(rows[0].total_insumos)).toBe(300.00); // 150 * 2
    expect(Number(rows[0].costo_total)).toBe(200.00); // 100 * 2
    expect(Number(rows[0].total_facturar)).toBe(300.00);
  });

  test('Recalcula totales correctamente con prestaciones convenio', async () => {
    await pool.query(
      `INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testPresupuestoId, '1', 'Test Prestación', 3, 200.00, 250.00]
    );

    await service.recalcularTotales(testPresupuestoId);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT total_prestaciones, costo_total, total_facturar FROM presupuestos WHERE idPresupuestos = ?',
      [testPresupuestoId]
    );

    expect(Number(rows[0].total_prestaciones)).toBe(750.00); // 250 * 3
    expect(Number(rows[0].costo_total)).toBe(800.00); // 200 (insumos) + 600 (prestaciones)
    expect(Number(rows[0].total_facturar)).toBe(1050.00); // 300 + 750
  });

  test('Recalcula totales correctamente con equipamiento', async () => {
    await pool.query(
      `INSERT INTO presupuesto_equipamiento (idPresupuestos, id_equipamiento, nombre, cantidad, costo, precio_facturar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testPresupuestoId, 1, 'Test Equipo', 1, 500.00, 600.00]
    );

    await service.recalcularTotales(testPresupuestoId);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT total_equipamiento, costo_total, total_facturar FROM presupuestos WHERE idPresupuestos = ?',
      [testPresupuestoId]
    );

    expect(Number(rows[0].total_equipamiento)).toBe(600.00);
    expect(Number(rows[0].costo_total)).toBe(1300.00); // 200 + 600 + 500
    expect(Number(rows[0].total_facturar)).toBe(1650.00); // 300 + 750 + 600
  });

  test('Calcula rentabilidad correctamente', async () => {
    await service.recalcularTotales(testPresupuestoId);

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT rentabilidad, costo_total, total_facturar FROM presupuestos WHERE idPresupuestos = ?',
      [testPresupuestoId]
    );

    const costoTotal = Number(rows[0].costo_total);
    const totalFacturar = Number(rows[0].total_facturar);
    // Fórmula correcta: (facturar - costo) / costo * 100
    const expectedRentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
    
    expect(Number(rows[0].rentabilidad)).toBeCloseTo(expectedRentabilidad, 2);
  });

  test('Mide performance de recálculo', async () => {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await service.recalcularTotales(testPresupuestoId);
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);

    console.log(`\n📊 Performance Metrics:`);
    console.log(`   Promedio: ${avgTime.toFixed(2)}ms`);
    console.log(`   Máximo: ${maxTime.toFixed(2)}ms`);
    console.log(`   Mínimo: ${Math.min(...times).toFixed(2)}ms`);

    // Debe ser < 100ms en promedio
    expect(avgTime).toBeLessThan(100);
  });
});
