import { pool } from '../db';

export class PresupuestoRepository {
  async obtenerConTotales(id: number) {
    const [rows] = await pool.query<any[]>(`
      SELECT 
        p.*,
        COALESCE(SUM(i.costo * i.cantidad), 0) as total_insumos_costo,
        COALESCE(SUM(i.precio_facturar * i.cantidad), 0) as total_insumos_facturar,
        COALESCE(SUM(pr.valor_asignado * pr.cantidad), 0) as total_prestaciones_costo,
        COALESCE(SUM(pr.valor_facturar * pr.cantidad), 0) as total_prestaciones_facturar,
        f.tasa_mensual,
        f.dias_cobranza_real,
        f.dias_cobranza_teorico
      FROM presupuestos p
      LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
      LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
      LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
      WHERE p.idPresupuestos = ? AND p.es_ultima_version = 1
      GROUP BY p.idPresupuestos
    `, [id]);

    return rows[0] || null;
  }

  async actualizarTotales(id: number, data: {
    estado: string;
    totalInsumos: number;
    totalPrestaciones: number;
    costoTotal: number;
    totalFacturar: number;
    rentabilidad: number;
    rentabilidadConPlazo: number;
  }) {
    await pool.query(
      `UPDATE presupuestos 
       SET estado = ?, total_insumos = ?, total_prestaciones = ?, 
           costo_total = ?, total_facturar = ?, rentabilidad = ?, rentabilidad_con_plazo = ? 
       WHERE idPresupuestos = ?`,
      [
        data.estado,
        data.totalInsumos,
        data.totalPrestaciones,
        data.costoTotal,
        data.totalFacturar,
        data.rentabilidad,
        data.rentabilidadConPlazo,
        id
      ]
    );
  }

  async notificarAuditores(presupuestoId: number, version: number, mensaje: string) {
    try {
      await pool.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u WHERE u.rol = 'gerencia_administrativa' AND u.activo = 1
      `, [presupuestoId, version, mensaje]);
    } catch (error) {
      console.error('Error al notificar auditores:', error);
      throw new Error('Error al crear notificaciones para auditores');
    }
  }
}
