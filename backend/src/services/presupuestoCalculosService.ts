import { pool } from '../db';

export class PresupuestoCalculosService {
  async recalcularTotales(presupuestoId: number): Promise<void> {
    // Consulta optimizada: obtiene todos los totales en un solo roundtrip usando subqueries
    // Se usan parámetros explícitos (?) en cada subquery para favorecer el uso de índices y caché de planes
    const [rows] = await pool.query<any[]>(`
      SELECT 
        p.idPresupuestos,
        p.financiador_id,
        p.dificil_acceso,
        f.tasa_mensual, 
        f.dias_cobranza_real, 
        f.dias_cobranza_teorico,
        f.porcentaje_dificil_acceso,
        
        -- Insumos
        (SELECT COALESCE(SUM(costo * cantidad), 0) 
         FROM presupuesto_insumos 
         WHERE idPresupuestos = ?) as insumos_costo,
        (SELECT COALESCE(SUM(precio_facturar * cantidad), 0) 
         FROM presupuesto_insumos 
         WHERE idPresupuestos = ?) as insumos_facturar,
        
        -- Prestaciones Convenio
        (SELECT COALESCE(SUM(valor_asignado * cantidad), 0) 
         FROM presupuesto_prestaciones 
         WHERE idPresupuestos = ?) as convenio_costo,
        (SELECT COALESCE(SUM(valor_facturar * cantidad), 0) 
         FROM presupuesto_prestaciones 
         WHERE idPresupuestos = ?) as convenio_facturar,
        
        -- Prestaciones Tarifario
        (SELECT COALESCE(SUM(valor_asignado * cantidad), 0) 
         FROM presupuesto_prestaciones_tarifario 
         WHERE idPresupuestos = ?) as tarifario_costo,
        (SELECT COALESCE(SUM(valor_facturar * cantidad), 0) 
         FROM presupuesto_prestaciones_tarifario 
         WHERE idPresupuestos = ?) as tarifario_facturar,
        
        -- Equipamiento
        (SELECT COALESCE(SUM(costo * cantidad), 0) 
         FROM presupuesto_equipamiento 
         WHERE idPresupuestos = ?) as equipamiento_costo,
        (SELECT COALESCE(SUM(precio_facturar * cantidad), 0) 
         FROM presupuesto_equipamiento 
         WHERE idPresupuestos = ?) as equipamiento_facturar

      FROM presupuestos p
      LEFT JOIN financiador f ON p.financiador_id = f.id
      WHERE p.idPresupuestos = ?
    `, Array(9).fill(presupuestoId));

    if (rows.length === 0) return;

    const data = rows[0];

    // Parsear resultados (MySQL driver puede devolver strings para DECIMAL/BIGINT calculados)
    const insumosCosto = Number(data.insumos_costo);
    const insumosFacturar = Number(data.insumos_facturar);
    const convenioCosto = Number(data.convenio_costo);
    let convenioFacturar = Number(data.convenio_facturar);
    const tarifarioCosto = Number(data.tarifario_costo);
    const tarifarioFacturar = Number(data.tarifario_facturar);
    const equipamientoCosto = Number(data.equipamiento_costo);
    const equipamientoFacturar = Number(data.equipamiento_facturar);

    // Aplicar recargo por difícil acceso a prestaciones convenio
    if (data.dificil_acceso === 'si' && data.porcentaje_dificil_acceso > 0) {
      convenioFacturar *= (1 + Number(data.porcentaje_dificil_acceso) / 100);
    }

    // Calcular totales generales
    const totalInsumos = insumosFacturar;
    const totalPrestaciones = convenioFacturar + tarifarioFacturar;
    const totalEquipamiento = equipamientoFacturar;
    const costoTotal = insumosCosto + convenioCosto + tarifarioCosto + equipamientoCosto;
    const totalFacturar = totalInsumos + totalPrestaciones + totalEquipamiento;

    // Evitar división por cero
    const rentabilidad = costoTotal > 0
      ? ((totalFacturar - costoTotal) / costoTotal) * 100
      : 0;

    let rentabilidadConPlazo = rentabilidad;

    if (data.financiador_id && costoTotal > 0 && data.tasa_mensual) {
      const diasCobranza = data.dias_cobranza_real || data.dias_cobranza_teorico || 30;
      const tasaMensual = (data.tasa_mensual || 2) / 100;
      const mesesCobranza = Math.floor(diasCobranza / 30);

      // Cálculo de valor presente neto
      const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
      const utilidadConPlazo = valorPresente - costoTotal;
      rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100;
    }

    await pool.query(`
      UPDATE presupuestos SET 
        total_insumos = ?,
        total_prestaciones = ?,
        total_equipamiento = ?,
        costo_total = ?,
        total_facturar = ?,
        rentabilidad = ?,
        rentabilidad_con_plazo = ?
      WHERE idPresupuestos = ?
    `, [totalInsumos, totalPrestaciones, totalEquipamiento, costoTotal, totalFacturar, rentabilidad, rentabilidadConPlazo, presupuestoId]);
  }
}

export const presupuestoCalculosService = new PresupuestoCalculosService();
