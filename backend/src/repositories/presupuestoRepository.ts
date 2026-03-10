import { pool } from '../db';

export class PresupuestoRepository {
  async obtenerConTotales(id: number) {
    try {
      const [rows] = await pool.query<any[]>(`
        SELECT p.*, 
               f.tasa_mensual, f.dias_cobranza_real, f.dias_cobranza_teorico
        FROM presupuestos p
        LEFT JOIN financiador f ON p.financiador_id = f.id
        WHERE p.idPresupuestos = ? AND p.es_ultima_version = 1
      `, [id]);

      if (rows.length === 0) return null;

      const presupuesto = rows[0];

      // Ejecutar queries de totales EN PARALELO
      const [[insumos], [prestaciones], [equipamientos]] = await Promise.all([
        pool.query<any[]>(`
          SELECT COALESCE(SUM(costo * cantidad), 0) as total_costo,
                 COALESCE(SUM(precio_facturar * cantidad), 0) as total_facturar
          FROM presupuesto_insumos WHERE idPresupuestos = ?
        `, [id]),
        pool.query<any[]>(`
          SELECT COALESCE(SUM(valor_asignado * cantidad), 0) as total_costo,
                 COALESCE(SUM(valor_facturar * cantidad), 0) as total_facturar
          FROM presupuesto_prestaciones WHERE idPresupuestos = ?
        `, [id]),
        pool.query<any[]>(`
          SELECT COALESCE(SUM(costo * cantidad), 0) as total_costo,
                 COALESCE(SUM(precio_facturar * cantidad), 0) as total_facturar
          FROM presupuesto_equipamiento WHERE idPresupuestos = ?
        `, [id])
      ]);

      return {
        ...presupuesto,
        total_insumos_costo: insumos[0].total_costo,
        total_insumos_facturar: insumos[0].total_facturar,
        total_prestaciones_costo: prestaciones[0].total_costo,
        total_prestaciones_facturar: prestaciones[0].total_facturar,
        total_equipamientos_costo: equipamientos[0].total_costo,
        total_equipamientos_facturar: equipamientos[0].total_facturar
      };
    } catch (error) {
      console.error('Error en obtenerConTotales:', error);
      throw error;
    }
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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      const resultadoAuditoria = data.estado === 'pendiente_carga' ? 'aprobado' : null;
      
      await connection.query(
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
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async notificarAuditores(presupuestoId: number, version: number, mensaje: string, rol: string = 'gerencia_prestacional') {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u WHERE u.rol = ? AND u.activo = 1
      `, [presupuestoId, version, mensaje, rol]);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error al notificar auditores:', error);
      throw new Error('Error al crear notificaciones para auditores');
    } finally {
      connection.release();
    }
  }

  async notificarOperadoresCarga(presupuestoId: number, version: number, nombrePaciente: string, totalFacturar: number) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'carga', ?
        FROM usuarios u WHERE u.rol = 'operador_carga' AND u.activo = 1
      `, [presupuestoId, version, `Nuevo presupuesto para carga: ${nombrePaciente} - $${totalFacturar}`]);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error al notificar operadores de carga:', error);
      throw new Error('Error al crear notificaciones para operadores de carga');
    } finally {
      connection.release();
    }
  }

  async notificarUsuarioAprobacionAutomatica(usuarioId: number, presupuestoId: number, version: number) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(`
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (?, ?, ?, 'aprobado', 'Presupuesto aprobado automáticamente y enviado a carga')
      `, [usuarioId, presupuestoId, version]);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error al notificar usuario aprobación automática:', error);
      throw new Error('Error al crear notificación de aprobación automática');
    } finally {
      connection.release();
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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(`
        INSERT INTO auditorias_presupuestos 
        (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [presupuestoId, version, usuarioId, estadoAnterior, estadoNuevo, comentario]);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear registro de auditoría inicial:', error);
      throw new Error('Error al crear registro de auditoría');
    } finally {
      connection.release();
    }
  }

  async revertirABorrador(id: number) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Cambiar estado a borrador Y limpiar resultado_auditoria
      await connection.query(
        'UPDATE presupuestos SET estado = ?, resultado_auditoria = NULL WHERE idPresupuestos = ? AND es_ultima_version = 1',
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

  async obtenerInsumosCriticos(presupuestoId: number): Promise<string[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT i.producto
       FROM presupuesto_insumos pi
       INNER JOIN insumos i ON pi.id_insumo = i.idInsumos
       WHERE pi.idPresupuestos = ? AND pi.id_insumo IS NOT NULL AND i.critico = 1`,
      [presupuestoId]
    );
    
    return rows.map(row => row.producto);
  }

  async tieneServiciosOrden5(presupuestoId: number): Promise<boolean> {
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM presupuesto_prestaciones_tarifario
       WHERE idPresupuestos = ? AND orden_costo = 5`,
      [presupuestoId]
    );
    
    return rows[0]?.count > 0;
  }

  async obtenerServiciosOrden5(presupuestoId: number): Promise<string[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT prestacion
       FROM presupuesto_prestaciones_tarifario
       WHERE idPresupuestos = ? AND orden_costo = 5`,
      [presupuestoId]
    );
    
    return rows.map(row => row.prestacion);
  }

  async tieneServiciosFueraTarifario(presupuestoId: number): Promise<boolean> {
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM presupuesto_prestaciones_tarifario
       WHERE idPresupuestos = ? AND fuera_tarifario = 1`,
      [presupuestoId]
    );
    
    return rows[0]?.count > 0;
  }

  async obtenerServiciosFueraTarifario(presupuestoId: number): Promise<string[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT prestacion
       FROM presupuesto_prestaciones_tarifario
       WHERE idPresupuestos = ? AND fuera_tarifario = 1`,
      [presupuestoId]
    );
    
    return rows.map(row => row.prestacion);
  }

  async tieneMarkupExcesivo(presupuestoId: number): Promise<boolean> {
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) as count
       FROM presupuesto_prestaciones_tarifario ppt
       INNER JOIN tarifario_servicio_valores tsv ON (
         ppt.servicio_id = tsv.servicio_id AND 
         ppt.zona_id = tsv.zona_tarifario_id AND
         CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31')
       )
       WHERE ppt.idPresupuestos = ? 
         AND tsv.valor_maximo IS NOT NULL
         AND ppt.valor_facturar > tsv.valor_maximo`,
      [presupuestoId]
    );
    
    return rows[0]?.count > 0;
  }

  async obtenerServiciosMarkupExcesivo(presupuestoId: number): Promise<string[]> {
    const [rows] = await pool.query<any[]>(
      `SELECT ppt.prestacion, 
              ppt.valor_facturar,
              tsv.valor_maximo,
              (ppt.valor_facturar - tsv.valor_maximo) as exceso
       FROM presupuesto_prestaciones_tarifario ppt
       INNER JOIN tarifario_servicio_valores tsv ON (
         ppt.servicio_id = tsv.servicio_id AND 
         ppt.zona_id = tsv.zona_tarifario_id AND
         CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31')
       )
       WHERE ppt.idPresupuestos = ? 
         AND tsv.valor_maximo IS NOT NULL
         AND ppt.valor_facturar > tsv.valor_maximo`,
      [presupuestoId]
    );
    
    return rows.map(row => 
      `${row.prestacion} ($${row.valor_facturar.toLocaleString('es-AR')} > máx: $${row.valor_maximo.toLocaleString('es-AR')})`
    );
  }

  async actualizarRazonesAuditoria(id: number, razones: any, tieneOrden5: boolean, tieneInsumosCriticos: boolean) {
    await pool.query(
      `UPDATE presupuestos 
       SET razones_auditoria = ?, tiene_orden_5 = ?, tiene_insumos_criticos = ?
       WHERE idPresupuestos = ?`,
      [JSON.stringify(razones), tieneOrden5 ? 1 : 0, tieneInsumosCriticos ? 1 : 0, id]
    );
  }
}
