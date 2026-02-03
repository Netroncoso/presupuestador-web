import { pool } from '../db';

export class PresupuestoRepository {
  async obtenerConTotales(id: number) {
    // Query principal sin JOINs que multiplican
    const [rows] = await pool.query<any[]>(`
      SELECT p.*, f.tasa_mensual, f.dias_cobranza_real, f.dias_cobranza_teorico
      FROM presupuestos p
      LEFT JOIN financiador f ON p.financiador_id = f.id
      WHERE p.idPresupuestos = ? AND p.es_ultima_version = 1
    `, [id]);

    if (rows.length === 0) return null;

    const presupuesto = rows[0];

    // Queries separados para evitar multiplicación
    const [insumos] = await pool.query<any[]>(`
      SELECT COALESCE(SUM(costo * cantidad), 0) as total_costo,
             COALESCE(SUM(precio_facturar * cantidad), 0) as total_facturar
      FROM presupuesto_insumos WHERE idPresupuestos = ?
    `, [id]);

    const [prestaciones] = await pool.query<any[]>(`
      SELECT COALESCE(SUM(valor_asignado * cantidad), 0) as total_costo,
             COALESCE(SUM(valor_facturar * cantidad), 0) as total_facturar
      FROM presupuesto_prestaciones WHERE idPresupuestos = ?
    `, [id]);

    const [equipamientos] = await pool.query<any[]>(`
      SELECT COALESCE(SUM(costo * cantidad), 0) as total_costo,
             COALESCE(SUM(precio_facturar * cantidad), 0) as total_facturar
      FROM presupuesto_equipamiento WHERE idPresupuestos = ?
    `, [id]);

    return {
      ...presupuesto,
      total_insumos_costo: insumos[0].total_costo,
      total_insumos_facturar: insumos[0].total_facturar,
      total_prestaciones_costo: prestaciones[0].total_costo,
      total_prestaciones_facturar: prestaciones[0].total_facturar,
      total_equipamientos_costo: equipamientos[0].total_costo,
      total_equipamientos_facturar: equipamientos[0].total_facturar
    };
  }

  async actualizarTotales(id: number, data: {
    estado: string;
    totalInsumos: number;
    totalPrestaciones: number;
    totalEquipamientos?: number;
    costoTotal: number;
    totalFacturar: number;
    rentabilidad: number;
    rentabilidadConPlazo: number;
  }) {
    const resultadoAuditoria = data.estado === 'pendiente_carga' ? 'aprobado' : null;
    
    await pool.query(
      `UPDATE presupuestos 
       SET estado = ?, resultado_auditoria = ?, total_insumos = ?, total_prestaciones = ?, total_equipamiento = ?,
           costo_total = ?, total_facturar = ?, rentabilidad = ?, rentabilidad_con_plazo = ? 
       WHERE idPresupuestos = ?`,
      [
        data.estado,
        resultadoAuditoria,
        data.totalInsumos,
        data.totalPrestaciones,
        data.totalEquipamientos || 0,
        data.costoTotal,
        data.totalFacturar,
        data.rentabilidad,
        data.rentabilidadConPlazo,
        id
      ]
    );
  }

  async notificarAuditores(presupuestoId: number, version: number, mensaje: string, rol: string = 'gerencia_prestacional') {
    try {
      await pool.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u WHERE u.rol = ? AND u.activo = 1
      `, [presupuestoId, version, mensaje, rol]);
    } catch (error) {
      console.error('Error al notificar auditores:', error);
      throw new Error('Error al crear notificaciones para auditores');
    }
  }

  async notificarOperadoresCarga(presupuestoId: number, version: number, nombrePaciente: string, totalFacturar: number) {
    try {
      await pool.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'carga', ?
        FROM usuarios u WHERE u.rol = 'operador_carga' AND u.activo = 1
      `, [presupuestoId, version, `Nuevo presupuesto para carga: ${nombrePaciente} - $${totalFacturar}`]);
    } catch (error) {
      console.error('Error al notificar operadores de carga:', error);
      throw new Error('Error al crear notificaciones para operadores de carga');
    }
  }

  async notificarUsuarioAprobacionAutomatica(usuarioId: number, presupuestoId: number, version: number) {
    try {
      await pool.query(`
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (?, ?, ?, 'aprobado', 'Presupuesto aprobado automáticamente y enviado a carga')
      `, [usuarioId, presupuestoId, version]);
    } catch (error) {
      console.error('Error al notificar usuario aprobación automática:', error);
      throw new Error('Error al crear notificación de aprobación automática');
    }
  }

  async crearRegistroAuditoriaInicial(
    presupuestoId: number, 
    version: number, 
    usuarioId: number, 
    estadoAnterior: string, 
    estadoNuevo: string, 
    comentario: string
  ) {
    try {
      await pool.query(`
        INSERT INTO auditorias_presupuestos 
        (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [presupuestoId, version, usuarioId, estadoAnterior, estadoNuevo, comentario]);
    } catch (error) {
      console.error('Error al crear registro de auditoría inicial:', error);
      throw new Error('Error al crear registro de auditoría');
    }
  }

  async revertirABorrador(id: number) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(
        'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ? AND es_ultima_version = 1',
        ['borrador', id]
      );
      
      // Eliminar notificaciones pendientes
      await connection.query(
        'DELETE FROM notificaciones WHERE presupuesto_id = ? AND tipo = ?',
        [id, 'pendiente']
      );
      
      // Eliminar TODAS las auditorías automáticas de este presupuesto
      await connection.query(
        'DELETE FROM auditorias_presupuestos WHERE presupuesto_id = ? AND comentario = ?',
        [id, 'Auditoría automática por reglas de negocio']
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async tieneInsumosCriticos(presupuestoId: number): Promise<boolean> {
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM presupuesto_insumos pi
       INNER JOIN insumos i ON pi.id_insumo = i.idInsumos
       WHERE pi.idPresupuestos = ? AND pi.id_insumo IS NOT NULL AND i.critico = 1`,
      [presupuestoId]
    );
    
    return rows[0]?.count > 0;
  }
}
