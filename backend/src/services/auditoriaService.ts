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

      // Obtener porcentaje base del presupuesto y porcentaje del nuevo financiador
      const [presupuesto] = await connection.query<any[]>(
        'SELECT porcentaje_insumos FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );

      if (presupuesto.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }

      // Obtener porcentaje del financiador
      let porcentajeTotal = 0;
      if (financiador_id) {
        const [financiador] = await connection.query<any[]>(
          'SELECT porcentaje_insumos FROM financiador WHERE id = ?',
          [financiador_id]
        );
        
        if (financiador.length > 0) {
          // Asumir que el porcentaje guardado en presupuesto es solo el de la sucursal
          // Necesitamos obtener el porcentaje base de la sucursal
          const [sucursal] = await connection.query<any[]>(
            'SELECT s.suc_porcentaje_insumos FROM presupuestos p JOIN sucursales_mh s ON p.sucursal_id = s.ID WHERE p.idPresupuestos = ?',
            [id]
          );
          
          const porcentajeSucursal = Number(sucursal[0]?.suc_porcentaje_insumos) || 0;
          const porcentajeFinanciador = Number(financiador[0].porcentaje_insumos) || 0;
          porcentajeTotal = porcentajeSucursal + porcentajeFinanciador;
        }
      }

      // Actualizar financiador y porcentaje total
      await connection.query(
        'UPDATE presupuestos SET financiador_id = ?, porcentaje_insumos = ? WHERE idPresupuestos = ?',
        [financiador_id, porcentajeTotal, id]
      );

      // Obtener presupuesto actualizado
      const [presupuestoActualizado] = await connection.query<any[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );

      const current = presupuestoActualizado[0];

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
