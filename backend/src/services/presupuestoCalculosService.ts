import { pool } from '../db';

export class PresupuestoCalculosService {
  async recalcularTotales(presupuestoId: number): Promise<void> {
    const [result] = await pool.query<any[]>(`
      SELECT 
        COALESCE(SUM(i.costo * i.cantidad), 0) as total_insumos_costo,
        COALESCE(SUM(i.precio_facturar * i.cantidad), 0) as total_insumos_facturar,
        COALESCE(SUM(pr.valor_asignado * pr.cantidad), 0) as total_prestaciones_costo,
        COALESCE(SUM(pr.valor_facturar * pr.cantidad), 0) as total_prestaciones_facturar,
        COALESCE(SUM(e.costo * e.cantidad), 0) as total_equipamiento_costo,
        COALESCE(SUM(e.precio_facturar * e.cantidad), 0) as total_equipamiento_facturar,
        p.financiador_id,
        f.tasa_mensual,
        f.dias_cobranza_real,
        f.dias_cobranza_teorico
      FROM presupuestos p
      LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
      LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
      LEFT JOIN presupuesto_equipamiento e ON p.idPresupuestos = e.idPresupuestos
      LEFT JOIN financiador f ON p.financiador_id = f.id
      WHERE p.idPresupuestos = ?
      GROUP BY p.idPresupuestos, p.financiador_id, f.tasa_mensual, f.dias_cobranza_real, f.dias_cobranza_teorico
    `, [presupuestoId]);
    
    if (result.length === 0) return;
    
    const data = result[0];
    const totalInsumos = Number(data.total_insumos_facturar);
    const totalPrestaciones = Number(data.total_prestaciones_facturar);
    const totalEquipamiento = Number(data.total_equipamiento_facturar);
    const costoTotal = Number(data.total_insumos_costo) + Number(data.total_prestaciones_costo) + Number(data.total_equipamiento_costo);
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
