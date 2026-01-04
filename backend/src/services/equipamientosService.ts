import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class EquipamientosService {
  
  // Validaciones
  private validateFinanciadorId(id: string): number {
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0) {
      throw new AppError(400, "ID de financiador inválido");
    }
    return numId;
  }

  private validateDateFormat(fecha: string): void {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      throw new AppError(400, "Formato de fecha inválido (YYYY-MM-DD)");
    }
  }

  private validateEquipamientoId(id: string): number {
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0) {
      throw new AppError(400, "ID de equipamiento inválido");
    }
    return numId;
  }

  private validateNumericValues(valor_asignado: any, valor_facturar: any): { valorAsignado: number; valorFacturar: number } {
    const valorAsignado = Number(valor_asignado);
    const valorFacturar = Number(valor_facturar);
    
    if (isNaN(valorAsignado) || valorAsignado < 0) {
      throw new AppError(400, 'Valor asignado debe ser un número positivo');
    }
    
    if (isNaN(valorFacturar) || valorFacturar < 0) {
      throw new AppError(400, 'Valor facturar debe ser un número positivo');
    }
    
    return { valorAsignado, valorFacturar };
  }

  // Métodos de datos
  async obtenerTodos() {
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.tipo_equipamiento_id, te.nombre as tipo, e.precio_referencia, e.activo 
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       ORDER BY e.nombre`
    );
    return rows;
  }

  async obtenerActivos() {
    const [rows] = await pool.query(
      `SELECT e.*, te.nombre as tipo 
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       WHERE e.activo = 1 
       ORDER BY te.nombre, e.nombre`
    );
    return rows;
  }

  async obtenerPorFinanciador(financiadorId: string, fecha: string, sucursalId: number | null) {
    const validFinanciadorId = this.validateFinanciadorId(financiadorId);
    this.validateDateFormat(fecha);
    
    const equipamientos = await this.fetchEquipamientos();
    const valores = await this.fetchValoresByFinanciador(validFinanciadorId, sucursalId, fecha);
    return this.mergeEquipamientosWithValores(equipamientos, valores);
  }

  private async fetchEquipamientos(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id, e.nombre, e.descripcion, te.nombre as tipo,
        e.tipo_equipamiento_id, te.cantidad_maxima, te.mensaje_alerta,
        te.color_alerta, te.activo_alerta, e.precio_referencia, e.unidad_tiempo
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       WHERE e.activo = 1
       ORDER BY te.nombre, e.nombre`
    );
    return rows;
  }

  private async fetchValoresByFinanciador(financiadorId: number, sucursalId: number | null, fecha: string): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        fe.id_equipamiento, v.valor_asignado, v.valor_facturar,
        v.fecha_inicio, DATEDIFF(CURDATE(), v.fecha_inicio) as dias_sin_actualizar
       FROM financiador_equipamiento fe
       JOIN financiador_equipamiento_valores v ON fe.id = v.id_financiador_equipamiento
       WHERE fe.idobra_social = ? AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
         AND ? BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
       ORDER BY fe.id_equipamiento, v.sucursal_id DESC, v.fecha_inicio DESC`,
      [financiadorId, sucursalId, fecha]
    );
    return rows;
  }

  private mergeEquipamientosWithValores(equipamientos: RowDataPacket[], valores: RowDataPacket[]) {
    const valoresMap = new Map();
    valores.forEach(v => {
      if (!valoresMap.has(v.id_equipamiento)) {
        valoresMap.set(v.id_equipamiento, v);
      }
    });

    return equipamientos.map(eq => {
      const valor = valoresMap.get(eq.id);
      return {
        ...eq,
        valor_asignado: valor?.valor_asignado || eq.precio_referencia,
        valor_facturar: valor?.valor_facturar || eq.precio_referencia,
        tiene_acuerdo: !!valor,
        dias_sin_actualizar: valor?.dias_sin_actualizar || 0
      };
    });
  }

  async obtenerValoresHistoricos(id: string) {
    // Permitir ID = 0 para nuevos acuerdos
    const numId = Number(id);
    if (isNaN(numId) || numId < 0) {
      throw new AppError(400, "ID de acuerdo inválido");
    }
    
    // Si es 0, retornar array vacío (nuevo acuerdo)
    if (numId === 0) {
      return [];
    }
    
    const [rows] = await pool.query(
      `SELECT id, valor_asignado, valor_facturar, fecha_inicio, fecha_fin, sucursal_id, created_at
       FROM financiador_equipamiento_valores 
       WHERE id_financiador_equipamiento = ? 
       ORDER BY fecha_inicio DESC LIMIT 100`,
      [numId]
    );

    return rows;
  }

  async guardarValor(id: string, datos: any) {
    let financiadorEquipamientoId = Number(id);
    const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, id_equipamiento, idobra_social } = datos;

    if (!valor_asignado || !valor_facturar || !fecha_inicio) {
      throw new AppError(400, "Datos incompletos: valor_asignado, valor_facturar y fecha_inicio requeridos");
    }

    if (isNaN(Number(valor_asignado)) || isNaN(Number(valor_facturar))) {
      throw new AppError(400, "Los valores deben ser números válidos");
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Si no existe financiadorEquipamientoId, crear registro
      if (!financiadorEquipamientoId || isNaN(financiadorEquipamientoId)) {
        if (!id_equipamiento || !idobra_social) {
          throw new AppError(400, "id_equipamiento e idobra_social requeridos para crear acuerdo nuevo");
        }

        const [existing] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND idobra_social = ?',
          [id_equipamiento, idobra_social]
        );

        if (existing.length > 0) {
          financiadorEquipamientoId = existing[0].id;
        } else {
          const [result]: any = await connection.query(
            'INSERT INTO financiador_equipamiento (id_equipamiento, idobra_social, activo) VALUES (?, ?, 1)',
            [id_equipamiento, idobra_social]
          );
          financiadorEquipamientoId = result.insertId;
        }
      }

      // Cerrar períodos vigentes
      await connection.query(
        `UPDATE financiador_equipamiento_valores 
         SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
         WHERE id_financiador_equipamiento = ? 
           AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
           AND fecha_inicio < ?
           AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
        [fecha_inicio, financiadorEquipamientoId, sucursal_id, sucursal_id, fecha_inicio, fecha_inicio]
      );

      // Si es valor general, cerrar valores específicos obsoletos
      if (sucursal_id === null || sucursal_id === undefined) {
        await connection.query(
          `UPDATE financiador_equipamiento_valores 
           SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
           WHERE id_financiador_equipamiento = ? 
             AND sucursal_id IS NOT NULL
             AND fecha_fin IS NULL
             AND DATEDIFF(?, fecha_inicio) > 30`,
          [fecha_inicio, financiadorEquipamientoId, fecha_inicio]
        );
      }

      // Insertar nuevo período
      await connection.query(
        `INSERT INTO financiador_equipamiento_valores 
         (id_financiador_equipamiento, valor_asignado, valor_facturar, fecha_inicio, sucursal_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [financiadorEquipamientoId, valor_asignado, valor_facturar, fecha_inicio, sucursal_id]
      );

      await connection.commit();
      return { 
        ok: true, 
        message: 'Valor guardado correctamente',
        id_financiador_equipamiento: financiadorEquipamientoId
      };
    } catch (error) {
      await connection.rollback();
      throw new AppError(500, "Error al guardar valor de equipamiento");
    } finally {
      connection.release();
    }
  }

  async actualizar(id: string, datos: any) {
    const { nombre, tipo_equipamiento_id, precio_referencia, activo } = datos;

    await pool.query(
      'UPDATE equipamientos SET nombre = ?, tipo_equipamiento_id = ?, precio_referencia = ?, activo = ? WHERE id = ?',
      [nombre, tipo_equipamiento_id, precio_referencia, activo, id]
    );

    return { success: true };
  }

  async crear(datos: any) {
    const { nombre, tipo_equipamiento_id, precio_referencia, activo } = datos;

    const [result]: any = await pool.query(
      'INSERT INTO equipamientos (nombre, tipo_equipamiento_id, precio_referencia, activo) VALUES (?, ?, ?, ?)',
      [nombre, tipo_equipamiento_id, precio_referencia, activo]
    );

    return { success: true, id: result.insertId };
  }

  async eliminar(id: string) {
    await pool.query('DELETE FROM equipamientos WHERE id = ?', [id]);
    return { success: true };
  }

  async obtenerTipos() {
    const [rows] = await pool.query('SELECT * FROM tipos_equipamiento ORDER BY nombre');
    return rows;
  }

  async crearTipo(datos: any) {
    const { nombre, descripcion } = datos;

    const [result]: any = await pool.query(
      'INSERT INTO tipos_equipamiento (nombre, descripcion, activo) VALUES (?, ?, 1)',
      [nombre, descripcion]
    );

    return { success: true, id: result.insertId };
  }
}

export const equipamientosService = new EquipamientosService();