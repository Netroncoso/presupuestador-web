import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RowDataPacket } from 'mysql2';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';

/**
 * Servicio de Auditoría Multi-Gerencial
 * Maneja transiciones de estado con asignación de casos y notificaciones
 */
export class AuditoriaMultiService {
  
  // ============================================================================
  // HELPERS DE NOTIFICACIONES
  // ============================================================================

  private async notificarGerencia(
    connection: any,
    presupuestoId: number,
    version: number,
    rol: string,
    mensaje: string,
    tipo: string = 'pendiente'
  ) {
    await connection.query(`
      INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
      SELECT u.id, ?, ?, ?, ?
      FROM usuarios u 
      WHERE u.rol = ? AND u.activo = 1
    `, [presupuestoId, version, tipo, mensaje, rol]);
  }

  private async notificarUsuario(
    connection: any,
    usuarioId: number,
    presupuestoId: number,
    version: number,
    tipo: string,
    mensaje: string
  ) {
    await connection.query(`
      INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
      VALUES (?, ?, ?, ?, ?)
    `, [usuarioId, presupuestoId, version, tipo, mensaje]);
  }

  // ============================================================================
  // TOMAR CASO (First Come, First Served con FOR UPDATE)
  // ============================================================================

  async tomarCaso(presupuestoId: number, usuarioId: number) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        `SELECT p.*, u.username as revisor_nombre
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
      
      // Verificar si ya está asignado a otro usuario
      if (caso.revisor_id !== null && caso.revisor_id !== usuarioId) {
        throw new AppError(409, `Ya está siendo revisado por ${caso.revisor_nombre}`);
      }
      
      // Si ya es el revisor, solo retornar éxito
      if (caso.revisor_id === usuarioId) {
        await connection.commit();
        return { success: true, yaAsignado: true };
      }
      
      // Asignar caso al usuario
      await connection.query(
        `UPDATE presupuestos 
         SET revisor_id = ?, 
             revisor_asignado_at = NOW(),
             estado = REPLACE(estado, 'pendiente', 'en_revision')
         WHERE idPresupuestos = ?`,
        [usuarioId, presupuestoId]
      );
      
      await connection.commit();
      return { success: true, yaAsignado: false };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // GERENCIA ADMINISTRATIVA
  // ============================================================================

  async aprobarAdministrativa(id: number, auditorId: number, comentario?: string) {
    return this.aprobarGenerico(id, auditorId, 'en_revision_administrativa', 'aprobado', 'G. Administrativa', comentario);
  }

  async aprobarCondicionalAdministrativa(id: number, auditorId: number, motivo: string) {
    return this.aprobarCondicionalGenerico(id, auditorId, 'en_revision_administrativa', 'G. Administrativa', motivo);
  }

  async rechazarAdministrativa(id: number, auditorId: number, comentario: string) {
    return this.rechazarGenerico(id, auditorId, 'en_revision_administrativa', 'G. Administrativa', comentario);
  }

  async derivarAPrestacional(id: number, auditorId: number, comentario?: string) {
    if (!id || !auditorId) {
      throw new AppError(400, 'ID de presupuesto y auditor son requeridos');
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (!presupuesto[0].version) throw new AppError(400, 'Presupuesto sin versión válida');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para derivar este caso');
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'pendiente_prestacional',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_revision_administrativa', 'pendiente_prestacional', ?)`,
        [id, presupuesto[0].version, auditorId, comentario]
      );
      
      const mensajeNotificacion = comentario 
        ? `Presupuesto de ${presupuesto[0].Nombre_Apellido} derivado desde G. Administrativa: ${comentario}`
        : `Presupuesto de ${presupuesto[0].Nombre_Apellido} derivado desde G. Administrativa`;
      
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        'gerencia_prestacional',
        mensajeNotificacion
      );
      
      await connection.commit();
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // GERENCIA PRESTACIONAL
  // ============================================================================

  async aprobarPrestacional(id: number, auditorId: number, comentario?: string) {
    return this.aprobarGenerico(id, auditorId, 'en_revision_prestacional', 'aprobado', 'G. Prestacional', comentario);
  }

  async aprobarCondicionalPrestacional(id: number, auditorId: number, motivo: string) {
    return this.aprobarCondicionalGenerico(id, auditorId, 'en_revision_prestacional', 'G. Prestacional', motivo);
  }

  async rechazarPrestacional(id: number, auditorId: number, comentario: string) {
    return this.rechazarGenerico(id, auditorId, 'en_revision_prestacional', 'G. Prestacional', comentario);
  }

  async observarPresupuesto(id: number, auditorId: number, comentario: string) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (!presupuesto[0].version || !presupuesto[0].usuario_id) throw new AppError(400, 'Datos de presupuesto incompletos');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para observar este caso');
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'borrador',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_revision_prestacional', 'observado', ?)`,
        [id, presupuesto[0].version, auditorId, comentario]
      );
      
      await this.notificarUsuario(
        connection,
        presupuesto[0].usuario_id,
        id,
        presupuesto[0].version,
        'observado',
        `Presupuesto devuelto para correcciones: ${comentario}`
      );
      
      await connection.commit();
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async escalarAGeneral(id: number, auditorId: number, motivo: string) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para escalar este caso');
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'pendiente_general',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_revision_prestacional', 'pendiente_general', ?)`,
        [id, presupuesto[0].version, auditorId, motivo]
      );
      
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        'gerencia_general',
        `Presupuesto de ${presupuesto[0].Nombre_Apellido} escalado: ${motivo}`
      );
      
      await connection.commit();
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // GERENCIA GENERAL
  // ============================================================================

  async aprobarGeneral(id: number, auditorId: number, comentario?: string) {
    return this.aprobarGenerico(id, auditorId, 'en_revision_general', 'aprobado', 'Gerencia General', comentario);
  }

  async aprobarCondicionalGeneral(id: number, auditorId: number, motivo: string) {
    return this.aprobarCondicionalGenerico(id, auditorId, 'en_revision_general', 'Gerencia General', motivo);
  }

  async rechazarGeneral(id: number, auditorId: number, comentario: string) {
    return this.rechazarGenerico(id, auditorId, 'en_revision_general', 'Gerencia General', comentario);
  }

  async devolverAGerencia(
    id: number, 
    auditorId: number, 
    gerenciaDestino: 'administrativa' | 'prestacional',
    comentario: string
  ) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para devolver este caso');
      
      const nuevoEstado = `pendiente_${gerenciaDestino}`;
      const rolDestino = `gerencia_${gerenciaDestino}`;
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = ?,
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [nuevoEstado, id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, 'en_revision_general', ?, ?)`,
        [id, presupuesto[0].version, auditorId, nuevoEstado, comentario]
      );
      
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        rolDestino,
        `Presupuesto devuelto por G. General: ${comentario}`
      );
      
      await connection.commit();
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // ============================================================================
  // AUTO-LIBERACIÓN (CRON JOB)
  // ============================================================================

  async autoLiberarCasosInactivos() {
    try {
      const [result] = await pool.query<any>(
        `UPDATE presupuestos 
         SET revisor_id = NULL,
             revisor_asignado_at = NULL,
             estado = REPLACE(estado, 'en_revision', 'pendiente')
         WHERE revisor_id IS NOT NULL
           AND revisor_asignado_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
           AND estado LIKE '%en_revision%'`
      );
      
      if (result.affectedRows > 0) {
        console.log(`[Auto-liberación] ${result.affectedRows} casos liberados`);
      }
    } catch (error) {
      console.error('[Auto-liberación] Error:', error);
    }
  }

  // ============================================================================
  // MÉTODOS GENÉRICOS (DRY)
  // ============================================================================

  private async aprobarGenerico(
    id: number,
    auditorId: number,
    estadoAnterior: string,
    estadoNuevo: string,
    gerenciaNombre: string,
    comentario?: string
  ) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (!presupuesto[0].version || !presupuesto[0].usuario_id) throw new AppError(400, 'Datos de presupuesto incompletos');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para auditar este caso');
      
      // MODIFICACIÓN: Transición automática a pendiente_carga
      const estadoFinal = estadoNuevo === 'aprobado' ? 'pendiente_carga' : estadoNuevo;
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = ?,
             resultado_auditoria = 'aprobado',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [estadoFinal, id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, presupuesto[0].version, auditorId, estadoAnterior, estadoFinal, comentario]
      );
      
      const mensajeAprobacion = this.construirMensajeAprobacion(estadoFinal, gerenciaNombre, comentario);
      
      // Notificar al usuario creador
      await this.notificarUsuario(
        connection,
        presupuesto[0].usuario_id,
        id,
        presupuesto[0].version,
        estadoFinal,
        mensajeAprobacion
      );
      
      // Notificar a operadores de carga
      if (estadoFinal === 'pendiente_carga') {
        const nombrePaciente = presupuesto[0].Nombre_Apellido || 'Sin nombre';
        const totalFacturar = presupuesto[0].total_facturar || 0;
        await this.notificarGerencia(
          connection,
          id,
          presupuesto[0].version,
          'operador_carga',
          `Nuevo presupuesto para carga: ${nombrePaciente} - $${totalFacturar}`,
          'carga'
        );
      }
      
      // Notificar a gerencia administrativa (para seguimiento)
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        'gerencia_administrativa',
        mensajeAprobacion,
        estadoFinal
      );
      
      await connection.commit();
      cacheService.invalidateReportes();
      logger.info('Presupuesto aprobado', { presupuestoId: id, auditor: auditorId, gerencia: gerenciaNombre, estadoFinal });
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private async aprobarCondicionalGenerico(
    id: number,
    auditorId: number,
    estadoAnterior: string,
    gerenciaNombre: string,
    motivo: string
  ) {
    if (!id || !auditorId || !estadoAnterior || !gerenciaNombre) {
      throw new AppError(400, 'Faltan parámetros requeridos');
    }

    if (!motivo || motivo.trim().length < 10) {
      throw new AppError(400, 'Debe especificar motivo (mínimo 10 caracteres)');
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (!presupuesto[0].version || !presupuesto[0].usuario_id) throw new AppError(400, 'Datos de presupuesto incompletos');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para auditar este caso');
      
      // MODIFICACIÓN: Transición automática a pendiente_carga
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'pendiente_carga',
             resultado_auditoria = 'aprobado_condicional',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, ?, 'aprobado_condicional', ?)`,
        [id, presupuesto[0].version, auditorId, estadoAnterior, motivo]
      );
      
      const mensajeCondicional = `Presupuesto APROBADO CONDICIONALMENTE por ${gerenciaNombre} y enviado a carga: ${motivo}`;
      
      // Notificar al usuario creador
      await this.notificarUsuario(
        connection,
        presupuesto[0].usuario_id,
        id,
        presupuesto[0].version,
        'aprobado_condicional',
        mensajeCondicional
      );
      
      // Notificar a operadores de carga
      const nombrePaciente = presupuesto[0].Nombre_Apellido || 'Sin nombre';
      const totalFacturar = presupuesto[0].total_facturar || 0;
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        'operador_carga',
        `Nuevo presupuesto para carga: ${nombrePaciente} - $${totalFacturar}`,
        'carga'
      );
      
      // Notificar a gerencia administrativa (para seguimiento)
      await this.notificarGerencia(
        connection,
        id,
        presupuesto[0].version,
        'gerencia_administrativa',
        mensajeCondicional,
        'aprobado_condicional'
      );
      
      await connection.commit();
      cacheService.invalidateReportes();
      logger.info('Presupuesto aprobado condicional', { presupuestoId: id, auditor: auditorId, gerencia: gerenciaNombre, motivo });
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private construirMensajeAprobacion(estadoFinal: string, gerenciaNombre: string, comentario?: string): string {
    if (estadoFinal === 'pendiente_carga') {
      return `Presupuesto APROBADO por ${gerenciaNombre} y enviado a carga${comentario ? ': ' + comentario : ''}`;
    }
    
    if (comentario) {
      return `Presupuesto APROBADO por ${gerenciaNombre}: ${comentario}`;
    }
    
    return `Presupuesto APROBADO por ${gerenciaNombre}`;
  }

  private async rechazarGenerico(
    id: number,
    auditorId: number,
    estadoAnterior: string,
    gerenciaNombre: string,
    comentario: string
  ) {
    if (!id || !auditorId || !estadoAnterior || !gerenciaNombre || !comentario) {
      throw new AppError(400, 'Faltan parámetros requeridos');
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [presupuesto] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      if (presupuesto.length === 0) throw new AppError(404, 'Presupuesto no encontrado');
      if (!presupuesto[0].version || !presupuesto[0].usuario_id) throw new AppError(400, 'Datos de presupuesto incompletos');
      if (presupuesto[0].revisor_id !== auditorId) throw new AppError(403, 'No tienes permiso para auditar este caso');
      
      await connection.query(
        `UPDATE presupuestos 
         SET estado = 'rechazado',
             resultado_auditoria = 'rechazado',
             revisor_id = NULL,
             revisor_asignado_at = NULL
         WHERE idPresupuestos = ?`,
        [id]
      );
      
      await connection.query(
        `INSERT INTO auditorias_presupuestos 
         (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, ?, ?, 'rechazado', ?)`,
        [id, presupuesto[0].version, auditorId, estadoAnterior, comentario]
      );
      
      const mensajeRechazo = `Presupuesto RECHAZADO por ${gerenciaNombre}: ${comentario}`;
      
      // Notificar al usuario creador
      const usuarioId = presupuesto[0].usuario_id;
      const versionPresupuesto = presupuesto[0].version;
      
      if (usuarioId && versionPresupuesto) {
        await this.notificarUsuario(
          connection,
          usuarioId,
          id,
          versionPresupuesto,
          'rechazado',
          mensajeRechazo
        );
      }
      
      // Notificar a gerencia administrativa (para seguimiento)
      if (versionPresupuesto) {
        await this.notificarGerencia(
          connection,
          id,
          versionPresupuesto,
          'gerencia_administrativa',
          mensajeRechazo,
          'rechazado'
        );
      }
      
      await connection.commit();
      cacheService.invalidateReportes();
      logger.warn('Presupuesto rechazado', { presupuestoId: id, auditor: auditorId, gerencia: gerenciaNombre, motivo: comentario });
      return { success: true };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const auditoriaMultiService = new AuditoriaMultiService();
