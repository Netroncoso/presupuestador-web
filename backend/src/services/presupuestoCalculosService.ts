import { pool } from '../db';

export class PresupuestoCalculosService {
  async recalcularTotales(presupuestoId: number): Promise<void> {
    // Calcular totales por separado para evitar multiplicación de valores
    const [insumos] = await pool.query<any[]>(
      'SELECT COALESCE(SUM(costo * cantidad), 0) as costo, COALESCE(SUM(precio_facturar * cantidad), 0) as facturar FROM presupuesto_insumos WHERE idPresupuestos = ?',
      [presupuestoId]
    );
    
    const [prestacionesConvenio] = await pool.query<any[]>(
      'SELECT COALESCE(SUM(valor_asignado * cantidad), 0) as costo, COALESCE(SUM(valor_facturar * cantidad), 0) as facturar FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
      [presupuestoId]
    );
    
    const [prestacionesTarifario] = await pool.query<any[]>(
      'SELECT COALESCE(SUM(valor_asignado * cantidad), 0) as costo, COALESCE(SUM(valor_facturar * cantidad), 0) as facturar FROM presupuesto_prestaciones_tarifario WHERE idPresupuestos = ?',
      [presupuestoId]
    );
    
    const [equipamiento] = await pool.query<any[]>(
      'SELECT COALESCE(SUM(costo * cantidad), 0) as costo, COALESCE(SUM(precio_facturar * cantidad), 0) as facturar FROM presupuesto_equipamiento WHERE idPresupuestos = ?',
      [presupuestoId]
    );
    
    const [presupuesto] = await pool.query<any[]>(
      'SELECT p.financiador_id, f.tasa_mensual, f.dias_cobranza_real, f.dias_cobranza_teorico FROM presupuestos p LEFT JOIN financiador f ON p.financiador_id = f.id WHERE p.idPresupuestos = ?',
      [presupuestoId]
    );
    
    if (presupuesto.length === 0) return;
    
    const data = presupuesto[0];
    
    const totalInsumos = Number(insumos[0].facturar);
    const totalPrestaciones = Number(prestacionesConvenio[0].facturar) + Number(prestacionesTarifario[0].facturar);
    const totalEquipamiento = Number(equipamiento[0].facturar);
    const costoTotal = Number(insumos[0].costo) + Number(prestacionesConvenio[0].costo) + Number(prestacionesTarifario[0].costo) + Number(equipamiento[0].costo);
    const totalFacturar = totalInsumos + totalPrestaciones + totalEquipamiento;
    const rentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
    
    let rentabilidadConPlazo = rentabilidad;
    
    if (data.financiador_id && costoTotal > 0 && data.tasa_mensual) {
      const diasCobranza = data.dias_cobranza_real || data.dias_cobranza_teorico || 30;
      const tasaMensual = (data.tasa_mensual || 2) / 100;
      const mesesCobranza = Math.floor(diasCobranza / 30);
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
