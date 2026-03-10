import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class FinanciadorZonasService {

  // Ensure table exists and create if necessary
  private async ensureTableExists() {
    try {
      // Check if table exists
      const [tableCheck] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count 
         FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name = 'financiador_zonas'`
      );

      if (tableCheck[0].count === 0) {
        console.log('⚠️ Table financiador_zonas does not exist, creating it...');

        // Create the table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS financiador_zonas (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            activo TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_activo (activo)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Insert default zones
        await pool.query(`
          INSERT IGNORE INTO financiador_zonas (nombre, descripcion) VALUES
          ('Zona 1', 'Zona 1 - Financiadores'),
          ('Zona 2', 'Zona 2 - Financiadores'),
          ('Zona 3', 'Zona 3 - Financiadores'),
          ('Zona 4', 'Zona 4 - Financiadores'),
          ('Zona 5', 'Zona 5 - Financiadores')
        `);

        console.log('✅ Table created and populated with default zones');
      }
    } catch (error) {
      console.error('Error ensuring table exists:', error);
      throw error;
    }
  }

  // Obtener todas las zonas de financiador
  async obtenerTodasZonas() {
    await this.ensureTableExists();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM financiador_zonas WHERE activo = 1 ORDER BY nombre'
    );
    return rows;
  }

  // Obtener zonas asignadas a un financiador
  async obtenerZonasPorFinanciador(financiadorId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT fz.* 
       FROM financiador_zonas fz
       INNER JOIN financiador_zona_mapeo fzm ON fz.id = fzm.zona_id
       WHERE fzm.financiador_id = ? AND fzm.activo = 1 AND fz.activo = 1
       ORDER BY fz.nombre`,
      [financiadorId]
    );
    return rows;
  }

  // Obtener servicios con convenio por financiador y zona
  async obtenerServiciosConvenio(financiadorId: number, zonaFinanciadorId: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT
           fs.id as id_financiador_servicio,
           s.id as servicio_id,
           s.nombre,
           s.descripcion,
           s.tipo_unidad,
           fs.unidades_base,
           fs.admite_horas_nocturnas,
           fsv.precio_facturar,
           fsv.fecha_inicio,
           fsv.fecha_fin
         FROM financiador_servicio fs
         INNER JOIN servicios s ON fs.servicio_id = s.id
         INNER JOIN financiador_servicio_valores fsv ON fs.id = fsv.financiador_servicio_id
         WHERE fs.financiador_id = ? 
           AND fsv.zona_financiador_id = ?
           AND s.activo = 1
           AND fs.activo = 1
           AND CURDATE() BETWEEN fsv.fecha_inicio AND COALESCE(fsv.fecha_fin, '9999-12-31')
         ORDER BY s.nombre`,
        [financiadorId, zonaFinanciadorId]
      );
      return rows;
    } catch (error) {
      console.error('Error en obtenerServiciosConvenio:', error);
      return [];
    }
  }

  // Obtener servicios del tarifario por zona
  async obtenerServiciosTarifario(zonaTarifarioId: number) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
           s.id,
           s.nombre,
           s.descripcion,
           s.tipo_unidad,
           tsv.costo_1,
           tsv.costo_2,
           tsv.costo_3,
           tsv.costo_4,
           tsv.costo_5
         FROM servicios s
         INNER JOIN tarifario_servicio_valores tsv ON s.id = tsv.servicio_id
         WHERE tsv.zona_tarifario_id = ?
           AND s.activo = 1
           AND (tsv.fecha_fin IS NULL OR tsv.fecha_fin >= CURDATE())
         ORDER BY s.nombre`,
        [zonaTarifarioId]
      );

      return rows.map(row => ({
        ...row,
        valores: [row.costo_1, row.costo_2, row.costo_3, row.costo_4, row.costo_5]
      }));
    } catch (error) {
      console.error('Error en obtenerServiciosTarifario:', error);
      return [];
    }
  }

  // Asignar zonas a un financiador
  async asignarZonas(financiadorId: number, zonaIds: number[]) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Desactivar todas las zonas actuales
      await connection.query(
        'UPDATE financiador_zona_mapeo SET activo = 0 WHERE financiador_id = ?',
        [financiadorId]
      );

      // Insertar o reactivar zonas
      for (const zonaId of zonaIds) {
        await connection.query(
          `INSERT INTO financiador_zona_mapeo (financiador_id, zona_id, activo)
           VALUES (?, ?, 1)
           ON DUPLICATE KEY UPDATE activo = 1`,
          [financiadorId, zonaId]
        );
      }

      await connection.commit();
      return { success: true, mensaje: 'Zonas asignadas correctamente' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Crear nueva zona financiador
  async crearZona(nombre: string, descripcion?: string) {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO financiador_zonas (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion || null]
    );
    return { id: result.insertId, mensaje: 'Zona creada exitosamente' };
  }

  // Actualizar zona financiador
  async actualizarZona(id: number, nombre: string, descripcion?: string, activo?: number) {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE financiador_zonas SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, descripcion || null, activo ?? 1, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Zona no encontrada');
    }

    return { mensaje: 'Zona actualizada exitosamente' };
  }

  // Obtener valores vigentes por zona para un financiador
  async obtenerValoresVigentes(financiadorId: number, servicioNombre?: string) {
    let whereClause = 'WHERE fs.financiador_id = ? AND fs.activo = 1 AND s.activo = 1';
    const params: any[] = [financiadorId];

    if (servicioNombre) {
      whereClause += ' AND s.nombre LIKE ?';
      params.push(`%${servicioNombre}%`);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         s.nombre as servicio,
         fz.nombre as zona,
         fsv.precio_facturar as valor_facturar,
         fsv.fecha_inicio,
         fsv.fecha_fin
       FROM servicios s
       INNER JOIN financiador_servicio fs ON s.id = fs.servicio_id
       INNER JOIN financiador_servicio_valores fsv ON fs.id = fsv.financiador_servicio_id
       INNER JOIN financiador_zonas fz ON fsv.zona_financiador_id = fz.id
       ${whereClause}
         AND (fsv.fecha_fin IS NULL OR fsv.fecha_fin >= CURDATE())
       ORDER BY s.nombre, fz.nombre`,
      params
    );

    // Agrupar por servicio
    const serviciosAgrupados = rows.reduce((acc: any, row) => {
      if (!acc[row.servicio]) {
        acc[row.servicio] = {
          servicio: row.servicio,
          zonas: []
        };
      }
      acc[row.servicio].zonas.push({
        zona: row.zona,
        valor_facturar: row.valor_facturar,
        fecha_inicio: row.fecha_inicio,
        fecha_fin: row.fecha_fin
      });
      return acc;
    }, {});

    return Object.values(serviciosAgrupados);
  }

  // Completar datos del paciente para convenio
  async completarDatosConvenio(financiadorId: number, dni: string) {
    // Buscar datos del paciente en presupuestos anteriores
    const [presupuestos] = await pool.query<RowDataPacket[]>(
      `SELECT 
         p.Nombre_Apellido,
         p.DNI,
         s.Sucursales_mh as sucursal,
         s.ID as sucursal_id,
         p.zona_tarifario_id,
         p.zona_financiador_id,
         p.created_at
       FROM presupuestos p
       INNER JOIN sucursales s ON p.sucursal_id = s.ID
       WHERE p.DNI = ? AND p.financiador_id = ?
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [dni, financiadorId]
    );

    if (presupuestos.length === 0) {
      return {
        encontrado: false,
        mensaje: 'No se encontraron datos previos para este DNI con el financiador seleccionado'
      };
    }

    const datosEncontrados = presupuestos[0];

    return {
      encontrado: true,
      datos: {
        nombre: datosEncontrados.Nombre_Apellido,
        dni: datosEncontrados.DNI,
        sucursal: datosEncontrados.sucursal,
        sucursal_id: datosEncontrados.sucursal_id,
        zona_tarifario_id: datosEncontrados.zona_tarifario_id,
        zona_financiador_id: datosEncontrados.zona_financiador_id,
        ultimo_presupuesto: datosEncontrados.created_at
      },
      mensaje: 'Datos del paciente completados automáticamente desde el historial'
    };
  }
}

export const financiadorZonasService = new FinanciadorZonasService();
