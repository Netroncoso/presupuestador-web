import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class VersioningService {
  async crearNuevaVersion(idOriginal: number, usuario_id: number, confirmar: boolean) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [presupuestoOriginal] = await connection.query<any[]>(
        'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
        [idOriginal]
      );

      if (presupuestoOriginal.length === 0) {
        throw new AppError(404, 'Presupuesto no encontrado');
      }

      const original = presupuestoOriginal[0];

      // Si es borrador, no crear nueva versión
      if (original.estado === 'borrador' && !confirmar) {
        await connection.rollback();
        return {
          requiereNuevaVersion: false,
          id: idOriginal,
          version: original.version,
          estado: 'borrador',
          mensaje: 'Este presupuesto ya está en borrador, puede editarlo directamente'
        };
      }

      // Si no es borrador y no confirmó, pedir confirmación
      if (original.estado !== 'borrador' && !confirmar) {
        await connection.rollback();
        return {
          requiereNuevaVersion: true,
          requiereConfirmacion: true,
          estadoActual: original.estado,
          versionActual: original.version,
          mensaje: `El presupuesto está ${original.estado}. Se creará una nueva versión para editar.`
        };
      }

      const presupuestoPadreId = original.presupuesto_padre || idOriginal;

      // Obtener datos necesarios
      const [[maxVersion], [insumos], [prestaciones], [sucursal]] = await Promise.all([
        connection.query<any[]>(
          'SELECT MAX(version) as max_version FROM presupuestos WHERE idPresupuestos = ? OR presupuesto_padre = ?',
          [presupuestoPadreId, presupuestoPadreId]
        ),
        connection.query<any[]>(
          'SELECT producto, costo, precio_facturar, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?',
          [idOriginal]
        ),
        connection.query<any[]>(
          'SELECT id_servicio, prestacion, valor_asignado, valor_facturar, cantidad FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
          [idOriginal]
        ),
        connection.query<any[]>(
          'SELECT suc_porcentaje_insumos FROM sucursales_mh WHERE ID = ?',
          [original.sucursal_id]
        )
      ]);

      const nuevaVersion = (maxVersion[0]?.max_version || 0) + 1;
      const porcentajeActual = sucursal[0]?.suc_porcentaje_insumos || 0;

      // Marcar versiones anteriores como no actuales
      await connection.query(
        'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ? OR presupuesto_padre = ?',
        [presupuestoPadreId, presupuestoPadreId]
      );

      // Crear nueva versión
      const [resultPresupuesto] = await connection.query<any>(`
        INSERT INTO presupuestos 
        (version, presupuesto_padre, es_ultima_version, estado, usuario_id,
         Nombre_Apellido, DNI, sucursal_id, dificil_acceso, idobra_social,
         porcentaje_insumos, total_insumos, total_prestaciones, costo_total, total_facturar, 
         rentabilidad, rentabilidad_con_plazo)
        VALUES (?, ?, 1, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        nuevaVersion, presupuestoPadreId, usuario_id,
        original.Nombre_Apellido, original.DNI, original.sucursal_id,
        original.dificil_acceso, original.idobra_social,
        porcentajeActual,
        original.total_insumos, original.total_prestaciones,
        original.costo_total, original.total_facturar,
        original.rentabilidad, original.rentabilidad_con_plazo
      ]);

      const nuevoId = resultPresupuesto.insertId;

      // Copiar insumos y prestaciones
      if (insumos.length > 0) {
        const insumosValues = insumos.map(i => [nuevoId, i.producto, i.costo, i.precio_facturar, i.cantidad]);
        await connection.query(
          'INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad) VALUES ?',
          [insumosValues]
        );
      }

      if (prestaciones.length > 0) {
        const prestacionesValues = prestaciones.map(p => [
          nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado, p.valor_facturar
        ]);
        await connection.query(
          'INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) VALUES ?',
          [prestacionesValues]
        );
      }

      await connection.commit();

      return {
        requiereNuevaVersion: true,
        id: nuevoId,
        version: nuevaVersion,
        estado: 'borrador',
        mensaje: `Nueva versión ${nuevaVersion} creada para edición`
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
