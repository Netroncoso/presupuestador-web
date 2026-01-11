import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RowDataPacket } from 'mysql2';
import { logger } from '../utils/logger';

/**
 * Servicio de Operadores de Carga
 * Maneja la carga de presupuestos en sistema externo
 */
export class CargaService {

  // ============================================================================
  // TOMAR CASO PARA CARGA (FCFS)
  // ============================================================================

  async tomarCasoParaCarga(presupuestoId: number, operadorId: number) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        `SELECT p.*, u.username as operador_nombre
         FROM presupuestos p
         LEFT JOIN usuarios u ON p.revisor_id = u.id
         WHERE p.idPresupuestos = ? 
         FOR UPDATE`,
        [presupuestoId]
      );
      
      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }
      
      const caso = presupuesto[0];
      
      // Verificar estado correcto
      if (caso.estado !== 'pendiente_carga') {
        throw new AppError(400, 'El presupuesto no está pendiente de carga');
      }
      
      // Verificar si ya está asignado a otro operador
      if (caso.revisor_id !== null && caso.revisor_id !== operadorId) {
        throw new AppError(409, `Ya está siendo procesado por ${caso.operador_nombre}`);
      }
      
      // Si ya es el operador asignado, solo retornar éxito
      if (caso.revisor_id === operadorId) {
        await connection.commit();
        return { success: true, yaAsignado: true };
      }
      
      // Asignar caso al operador
      await connection.query(
        `UPDATE presupuestos 
         SET revisor_id = ?, 
             revisor_asignado_at = NOW(),
             estado = 'en_carga'
         WHERE idPresupuestos = ?`,
        [operadorId, presupuestoId]
      );
      
      // Registrar en auditoría
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'pendiente_carga', 'en_carga', 'Caso tomado para carga')`,
        [presupuestoId, caso.version, operadorId]
      );
      
      await connection.commit();
      logger.info('Caso tomado para carga', { presupuestoId, operadorId });
      return { success: true, yaAsignado: false };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // MARCAR COMO CARGADO
  // ============================================================================

  async marcarComoCargado(presupuestoId: number, operadorId: number, referenciaExterna: string) {
    if (!referenciaExterna || referenciaExterna.trim().length < 3) {
      throw new AppError(400, 'La referencia externa es requerida (mínimo 3 caracteres)');
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [presupuestoId]
      );
      
      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }
      
      const caso = presupuesto[0];
      
      // Validaciones
      if (caso.estado !== 'en_carga') {
        throw new AppError(400, 'El presupuesto no está en proceso de carga');
      }
      
      if (caso.revisor_id !== operadorId) {
        throw new AppError(403, 'No tienes permiso para marcar este presupuesto como cargado');
      }
      
      // Verificar que la referencia no esté duplicada
      const [existeReferencia] = await connection.query<RowDataPacket[]>(
        'SELECT idPresupuestos FROM presupuestos WHERE referencia_externa = ? AND idPresupuestos != ?',
        [referenciaExterna.trim(), presupuestoId]
      );
      
      if (existeReferencia.length > 0) {
        throw new AppError(409, 'La referencia externa ya existe en otro presupuesto');
      }
      
      // Marcar como cargado
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'cargado',
             referencia_externa = ?,
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [referenciaExterna.trim(), presupuestoId]
      );
      
      // Registrar en auditoría
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_carga', 'cargado', ?)`,
        [presupuestoId, caso.version, operadorId, `Cargado con referencia: ${referenciaExterna.trim()}`]
      );
      
      // Notificar al usuario creador
      await connection.query(
        `INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
         VALUES (?, ?, ?, 'cargado', ?)`,
        [
          caso.usuario_id,
          presupuestoId,
          caso.version,
          `Presupuesto cargado exitosamente en sistema externo con referencia: ${referenciaExterna.trim()}`
        ]
      );
      
      await connection.commit();
      logger.info('Presupuesto marcado como cargado', { 
        presupuestoId, 
        operadorId, 
        referenciaExterna: referenciaExterna.trim() 
      });
      
      return { success: true, referenciaExterna: referenciaExterna.trim() };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // DEVOLVER PRESUPUESTO
  // ============================================================================

  async devolverPresupuesto(
    presupuestoId: number, 
    operadorId: number, 
    destino: 'usuario' | 'administrativa' | 'prestacional' | 'general',
    motivo: string
  ) {
    if (!motivo || motivo.trim().length < 10) {
      throw new AppError(400, 'El motivo de devolución es requerido (mínimo 10 caracteres)');
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [presupuestoId]
      );
      
      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }
      
      const caso = presupuesto[0];
      
      // Validaciones
      if (caso.estado !== 'en_carga') {
        throw new AppError(400, 'El presupuesto no está en proceso de carga');
      }
      
      if (caso.revisor_id !== operadorId) {
        throw new AppError(403, 'No tienes permiso para devolver este presupuesto');
      }
      
      // Determinar estado y rol de destino
      let nuevoEstado: string;
      let rolDestino: string | null = null;
      
      switch (destino) {
        case 'usuario':
          nuevoEstado = 'borrador';
          break;
        case 'administrativa':
          nuevoEstado = 'pendiente_administrativa';
          rolDestino = 'gerencia_administrativa';
          break;
        case 'prestacional':
          nuevoEstado = 'pendiente_prestacional';
          rolDestino = 'gerencia_prestacional';
          break;
        case 'general':
          nuevoEstado = 'pendiente_general';
          rolDestino = 'gerencia_general';
          break;
        default:
          throw new AppError(400, 'Destino de devolución inválido');
      }
      
      // Actualizar estado
      await connection.query(
        `UPDATE presupuestos 
         SET estado = ?,
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [nuevoEstado, presupuestoId]
      );
      
      // Registrar en auditoría
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_carga', ?, ?)`,
        [presupuestoId, caso.version, operadorId, nuevoEstado, `Devuelto a ${destino}: ${motivo.trim()}`]
      );
      
      // Notificar según destino
      if (destino === 'usuario') {
        // Notificar al usuario creador
        await connection.query(
          `INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
           VALUES (?, ?, ?, 'devuelto', ?)`,
          [
            caso.usuario_id,
            presupuestoId,
            caso.version,
            `Presupuesto devuelto para corrección: ${motivo.trim()}`
          ]
        );
      } else {
        // Notificar a la gerencia correspondiente
        await connection.query(
          `INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
           SELECT u.id, ?, ?, 'pendiente', ?
           FROM usuarios u 
           WHERE u.rol = ? AND u.activo = 1`,
          [
            presupuestoId,
            caso.version,
            `Presupuesto devuelto desde carga: ${motivo.trim()}`,
            rolDestino
          ]
        );
      }
      
      await connection.commit();
      logger.info('Presupuesto devuelto desde carga', { 
        presupuestoId, 
        operadorId, 
        destino, 
        motivo: motivo.trim() 
      });
      
      return { success: true, destino, nuevoEstado };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // OBTENER CASOS PENDIENTES
  // ============================================================================

  async obtenerCasosPendientes(sucursalId?: number) {
    try {
      let query = `
        SELECT 
          p.idPresupuestos,
          p.Nombre_Apellido,
          p.DNI,
          p.total_facturar,
          p.created_at,
          p.estado,
          s.Sucursales_mh as sucursal_nombre,
          f.Financiador as financiador_nombre,
          TIMESTAMPDIFF(HOUR, p.updated_at, NOW()) as horas_pendiente
        FROM presupuestos p
        LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
        LEFT JOIN financiador f ON p.financiador_id = f.id
        WHERE p.estado = 'pendiente_carga'
        AND p.es_ultima_version = 1
      `;
      
      const params: any[] = [];
      
      if (sucursalId) {
        query += ' AND p.sucursal_id = ?';
        params.push(sucursalId);
      }
      
      query += ' ORDER BY p.created_at ASC';
      
      const [casos] = await pool.query<RowDataPacket[]>(query, params);
      
      return casos;
      
    } catch (error) {
      logger.error('Error obteniendo casos pendientes de carga', { error, sucursalId });
      throw error;
    }
  }

  // ============================================================================
  // OBTENER CASOS EN PROCESO
  // ============================================================================

  async obtenerCasosEnProceso(operadorId: number) {
    try {
      const [casos] = await pool.query<RowDataPacket[]>(
        `SELECT 
          p.idPresupuestos,
          p.Nombre_Apellido,
          p.DNI,
          p.total_facturar,
          p.revisor_asignado_at,
          s.Sucursales_mh as sucursal_nombre,
          f.Financiador as financiador_nombre,
          TIMESTAMPDIFF(MINUTE, p.revisor_asignado_at, NOW()) as minutos_en_proceso
        FROM presupuestos p
        LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
        LEFT JOIN financiador f ON p.financiador_id = f.id
        WHERE p.estado = 'en_carga'
        AND p.revisor_id = ?
        AND p.es_ultima_version = 1
        ORDER BY p.revisor_asignado_at ASC`,
        [operadorId]
      );
      
      return casos;
      
    } catch (error) {
      logger.error('Error obteniendo casos en proceso', { error, operadorId });
      throw error;
    }
  }

  // ============================================================================
  // OBTENER HISTORIAL DEL OPERADOR
  // ============================================================================

  async obtenerHistorialOperador(operadorId: number) {
    try {
      const [historial] = await pool.query<RowDataPacket[]>(
        `SELECT 
          p.idPresupuestos,
          p.Nombre_Apellido,
          p.DNI,
          p.total_facturar,
          p.referencia_externa,
          a.estado_nuevo,
          a.comentario,
          a.fecha as fecha_procesado,
          s.Sucursales_mh as sucursal_nombre,
          f.Financiador as financiador_nombre
        FROM auditorias_presupuestos a
        INNER JOIN presupuestos p ON a.presupuesto_id = p.idPresupuestos
        LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
        LEFT JOIN financiador f ON p.financiador_id = f.id
        WHERE a.auditor_id = ?
          AND a.estado_nuevo IN ('cargado', 'borrador', 'pendiente_administrativa', 'pendiente_prestacional', 'pendiente_general')
          AND a.estado_anterior IN ('en_carga')
        ORDER BY a.fecha DESC
        LIMIT 100`,
        [operadorId]
      );
      
      return historial;
      
    } catch (error) {
      logger.error('Error obteniendo historial del operador', { error, operadorId });
      throw error;
    }
  }

  // ============================================================================
  // AUTO-LIBERACIÓN DE CASOS INACTIVOS
  // ============================================================================

  async autoLiberarCasosInactivos() {
    try {
      const [result] = await pool.query<any>(
        `UPDATE presupuestos 
         SET revisor_id = NULL,
             revisor_asignado_at = NULL,
             estado = 'pendiente_carga'
         WHERE estado = 'en_carga'
           AND revisor_asignado_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
      );
      
      if (result.affectedRows > 0) {
        logger.info(`[Auto-liberación Carga] ${result.affectedRows} casos liberados`);
      }
      
      return result.affectedRows;
      
    } catch (error) {
      logger.error('[Auto-liberación Carga] Error:', error);
      throw error;
    }
  }
}

export const cargaService = new CargaService();