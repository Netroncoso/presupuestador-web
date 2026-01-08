import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { BusinessRules, getDiasCobranza, getTasaMensual } from '../config/businessRules';

export class AuditoriaService {
  async cambiarEstado(
    id: number,
    nuevoEstado: string,
    auditor_id: number,
    comentario?: string
  ) {
    if (!BusinessRules.estados.validos.includes(nuevoEstado as any)) {
      throw new AppError(400, `Estado inválido. Estados válidos: ${BusinessRules.estados.validos.join(', ')}`);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Obtener presupuesto actual
      const [presupuesto] = await connection.query<any[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
        [id]
      );

      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }

      const estadoAnterior = presupuesto[0].estado;

      // Actualizar estado
      await connection.query(
        'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ?',
        [nuevoEstado, id]
      );

      // Registrar auditoría
      await connection.query(`
        INSERT INTO auditorias_presupuestos 
        (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, presupuesto[0].version, auditor_id, estadoAnterior, nuevoEstado, comentario || null]);

      // Notificar al usuario creador si fue aprobado/rechazado
      if (BusinessRules.estados.requierenNotificacion.includes(nuevoEstado as any)) {
        await connection.query(`
          INSERT IGNORE INTO notificaciones 
          (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
          VALUES (?, ?, ?, ?, ?)
        `, [
          presupuesto[0].usuario_id,
          id,
          presupuesto[0].version,
          nuevoEstado,
          `Presupuesto v${presupuesto[0].version} ${nuevoEstado.toUpperCase()} por auditor`
        ]);
      }

      await connection.commit();

      return { success: true, estado: nuevoEstado };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async actualizarFinanciador(id: number, financiador_id: number) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Actualizar financiador
      await connection.query(
        'UPDATE presupuestos SET financiador_id = ? WHERE idPresupuestos = ?',
        [financiador_id, id]
      );

      // Obtener presupuesto actualizado
      const [presupuesto] = await connection.query<any[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );

      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }

      const current = presupuesto[0];

      // Recalcular rentabilidad con plazo si hay financiador y totales
      if (financiador_id && current.costo_total > 0) {
        const [financiador] = await connection.query<any[]>(
          'SELECT tasa_mensual, dias_cobranza_real, dias_cobranza_teorico FROM financiador WHERE id = ?',
          [financiador_id]
        );

        if (financiador.length > 0) {
          const diasCobranza = getDiasCobranza(financiador[0].dias_cobranza_real, financiador[0].dias_cobranza_teorico);
          const tasaMensual = getTasaMensual(financiador[0].tasa_mensual) / 100;
          const mesesCobranza = Math.floor(diasCobranza / 30);

          const valorPresente = current.total_facturar / Math.pow(1 + tasaMensual, mesesCobranza);
          const utilidadConPlazo = valorPresente - current.costo_total;
          const rentabilidadConPlazo = (utilidadConPlazo / current.costo_total) * 100;

          await connection.query(
            'UPDATE presupuestos SET rentabilidad_con_plazo = ? WHERE idPresupuestos = ?',
            [rentabilidadConPlazo, id]
          );
        }
      }

      await connection.commit();

      return { ok: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
