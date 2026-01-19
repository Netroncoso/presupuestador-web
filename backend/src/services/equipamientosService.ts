import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

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
  async obtenerTodos(page: number = 1, limit: number = 100) {
    const cacheKey = `catalogos:equipamientos:all:page:${page}:limit:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.tipo_equipamiento_id, te.nombre as tipo, e.precio_referencia, e.activo 
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       ORDER BY e.nombre
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [countResult] = await pool.query<any[]>('SELECT COUNT(*) as total FROM equipamientos');
    const total = countResult[0].total;
    
    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    cacheService.set(cacheKey, result, 1800); // 30 min
    return result;
  }

  async obtenerActivos() {
    const cacheKey = 'catalogos:equipamientos:activos';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const [rows] = await pool.query(
      `SELECT e.*, te.nombre as tipo 
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       WHERE e.activo = 1 
       ORDER BY te.nombre, e.nombre`
    );
    
    cacheService.set(cacheKey, rows, 1800); // 30 min
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
        v.fecha_inicio, v.sucursal_id,
        DATEDIFF(CURDATE(), v.fecha_inicio) as dias_sin_actualizar
       FROM financiador_equipamiento fe
       JOIN financiador_equipamiento_valores v ON fe.id = v.id_financiador_equipamiento
       WHERE fe.financiador_id = ? 
         AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
         AND ? BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
       ORDER BY fe.id_equipamiento, v.fecha_inicio DESC`,
      [financiadorId, sucursalId, fecha]
    );
    return rows;
  }

  private mergeEquipamientosWithValores(equipamientos: RowDataPacket[], valores: RowDataPacket[]) {
    const valoresMap = new Map();
    
    // Agrupar valores por equipamiento
    const valoresPorEquipamiento = new Map<number, RowDataPacket[]>();
    valores.forEach(v => {
      if (!valoresPorEquipamiento.has(v.id_equipamiento)) {
        valoresPorEquipamiento.set(v.id_equipamiento, []);
      }
      valoresPorEquipamiento.get(v.id_equipamiento)!.push(v);
    });

    // Aplicar lógica de prioridad con anti-obsolescencia
    valoresPorEquipamiento.forEach((vals, equipId) => {
      const valorEspecifico = vals.find(v => v.sucursal_id !== null);
      const valorGeneral = vals.find(v => v.sucursal_id === null);
      
      // Si hay específico y general, verificar obsolescencia (30 días)
      if (valorEspecifico && valorGeneral) {
        const diasDiferencia = Math.abs(
          new Date(valorEspecifico.fecha_inicio).getTime() - 
          new Date(valorGeneral.fecha_inicio).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        // Si específico está obsoleto (>30 días diferencia), usar general
        if (diasDiferencia > 30) {
          valoresMap.set(equipId, valorGeneral);
        } else {
          valoresMap.set(equipId, valorEspecifico);
        }
      } else if (valorEspecifico) {
        valoresMap.set(equipId, valorEspecifico);
      } else if (valorGeneral) {
        valoresMap.set(equipId, valorGeneral);
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
    const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, id_equipamiento, financiador_id } = datos;

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
        if (!id_equipamiento || !financiador_id) {
          throw new AppError(400, "id_equipamiento e financiador_id requeridos para crear acuerdo nuevo");
        }

        const [existing] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND financiador_id = ?',
          [id_equipamiento, financiador_id]
        );

        if (existing.length > 0) {
          financiadorEquipamientoId = existing[0].id;
        } else {
          const [result]: any = await connection.query(
            'INSERT INTO financiador_equipamiento (id_equipamiento, financiador_id, activo) VALUES (?, ?, 1)',
            [id_equipamiento, financiador_id]
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

    this.invalidateCache();
    return { success: true };
  }

  async crear(datos: any) {
    const { nombre, tipo_equipamiento_id, precio_referencia, activo } = datos;

    const [result]: any = await pool.query(
      'INSERT INTO equipamientos (nombre, tipo_equipamiento_id, precio_referencia, activo) VALUES (?, ?, ?, ?)',
      [nombre, tipo_equipamiento_id, precio_referencia, activo]
    );

    this.invalidateCache();
    return { success: true, id: result.insertId };
  }

  async eliminar(id: string) {
    await pool.query('DELETE FROM equipamientos WHERE id = ?', [id]);
    this.invalidateCache();
    return { success: true };
  }

  async obtenerTipos() {
    const cacheKey = 'catalogos:tipos_equipamiento';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const [rows] = await pool.query('SELECT * FROM tipos_equipamiento ORDER BY nombre');
    
    cacheService.set(cacheKey, rows, 1800); // 30 min
    return rows;
  }

  async crearTipo(datos: any) {
    const { nombre, descripcion } = datos;

    const [result]: any = await pool.query(
      'INSERT INTO tipos_equipamiento (nombre, descripcion, activo) VALUES (?, ?, 1)',
      [nombre, descripcion]
    );

    this.invalidateCache();
    return { success: true, id: result.insertId };
  }

  private invalidateCache() {
    cacheService.del('catalogos:equipamientos:all:page:1:limit:100');
    cacheService.del('catalogos:equipamientos:activos');
    cacheService.del('catalogos:tipos_equipamiento');
  }

  async agregarValorAdmin(equipamientoId: string, datos: any) {
    const validEquipamientoId = this.validateEquipamientoId(equipamientoId);
    const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, financiador_id } = datos;

    if (!fecha_inicio || !financiador_id) {
      throw new AppError(400, 'Faltan campos obligatorios: fecha_inicio, financiador_id');
    }

    const { valorAsignado, valorFacturar } = this.validateNumericValues(valor_asignado, valor_facturar);
    const financiadorIdNum = this.validateFinanciadorId(financiador_id);
    this.validateDateFormat(fecha_inicio);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [equipamiento] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM equipamientos WHERE id = ? AND activo = 1',
        [validEquipamientoId]
      );

      if (equipamiento.length === 0) {
        throw new AppError(404, 'Equipamiento no encontrado');
      }

      let [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND financiador_id = ?',
        [validEquipamientoId, financiadorIdNum]
      );

      let financiadorEquipamientoId;
      if (existing.length > 0) {
        financiadorEquipamientoId = existing[0].id;
      } else {
        const [result]: any = await connection.query(
          'INSERT INTO financiador_equipamiento (id_equipamiento, financiador_id, activo) VALUES (?, ?, 1)',
          [validEquipamientoId, financiadorIdNum]
        );
        financiadorEquipamientoId = result.insertId;
      }

      await connection.query(
        `UPDATE financiador_equipamiento_valores SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
         WHERE id_financiador_equipamiento = ? AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
           AND fecha_fin IS NULL AND fecha_inicio < ?`,
        [fecha_inicio, financiadorEquipamientoId, sucursal_id, sucursal_id, fecha_inicio]
      );

      await connection.query(
        `INSERT INTO financiador_equipamiento_valores (id_financiador_equipamiento, valor_asignado, valor_facturar, fecha_inicio, sucursal_id)
         VALUES (?, ?, ?, ?, ?)`,
        [financiadorEquipamientoId, valorAsignado, valorFacturar, fecha_inicio, sucursal_id || null]
      );

      await connection.commit();
      return { success: true, message: 'Valor agregado correctamente' };
    } catch (error) {
      await connection.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Error interno al agregar valor");
    } finally {
      connection.release();
    }
  }

  async obtenerValoresAdmin(equipamientoId: string) {
    const [rows] = await pool.query(
      `SELECT v.id, v.valor_asignado, v.valor_facturar, v.fecha_inicio, v.fecha_fin, v.sucursal_id, fe.financiador_id
       FROM financiador_equipamiento_valores v
       JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
       WHERE fe.id_equipamiento = ?
       ORDER BY v.fecha_inicio DESC`,
      [equipamientoId]
    );
    return rows;
  }

  async obtenerPorFinanciadorAdmin(financiadorId: string) {
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, te.nombre as tipo, e.precio_referencia, e.activo,
              fe.id as id_financiador_equipamiento, fe.activo as activo_financiador,
              (SELECT COUNT(*) FROM financiador_equipamiento_valores v WHERE v.id_financiador_equipamiento = fe.id AND v.fecha_fin IS NULL) as count_valores_vigentes,
              (SELECT valor_asignado FROM financiador_equipamiento_valores v WHERE v.id_financiador_equipamiento = fe.id AND v.fecha_fin IS NULL ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC LIMIT 1) as valor_asignado_vigente,
              (SELECT valor_facturar FROM financiador_equipamiento_valores v WHERE v.id_financiador_equipamiento = fe.id AND v.fecha_fin IS NULL ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC LIMIT 1) as valor_facturar_vigente,
              (SELECT sucursal_id FROM financiador_equipamiento_valores v WHERE v.id_financiador_equipamiento = fe.id AND v.fecha_fin IS NULL ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC LIMIT 1) as sucursal_id_vigente
       FROM equipamientos e
       LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
       LEFT JOIN financiador_equipamiento fe ON e.id = fe.id_equipamiento AND fe.financiador_id = ?
       WHERE e.activo = 1
       ORDER BY te.nombre, e.nombre`,
      [financiadorId]
    );
    return rows;
  }

  async actualizarAcuerdo(acuerdoId: string, activo: number) {
    await pool.query('UPDATE financiador_equipamiento SET activo = ? WHERE id = ?', [activo, acuerdoId]);
    return { success: true };
  }

  async agregarAPresupuesto(presupuestoId: string, datos: any) {
    const { id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo } = datos;

    if (!id_equipamiento || !nombre || !cantidad || !costo || !precio_facturar) {
      throw new AppError(400, "Datos incompletos");
    }

    const [result]: any = await pool.query(
      `INSERT INTO presupuesto_equipamiento (idPresupuestos, id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), costo = VALUES(costo), precio_facturar = VALUES(precio_facturar), tipo = VALUES(tipo)`,
      [presupuestoId, id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo || false]
    );

    return { ok: true, id: result.insertId };
  }

  async eliminarDePresupuesto(presupuestoId: string, equipamientoId: string) {
    await pool.query('DELETE FROM presupuesto_equipamiento WHERE idPresupuestos = ? AND id = ?', [presupuestoId, equipamientoId]);
    return { ok: true };
  }

  async obtenerDePresupuesto(presupuestoId: string, soloLectura: boolean) {
    const validPresupuestoId = this.validateEquipamientoId(presupuestoId);

    if (soloLectura) {
      const [rows] = await pool.query(
        'SELECT * FROM presupuesto_equipamiento WHERE idPresupuestos = ? ORDER BY nombre LIMIT 100',
        [validPresupuestoId]
      );
      return rows;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pe.*, p.financiador_id, p.sucursal_id
       FROM presupuesto_equipamiento pe
       JOIN presupuestos p ON pe.idPresupuestos = p.idPresupuestos
       WHERE pe.idPresupuestos = ? ORDER BY pe.nombre LIMIT 100`,
      [validPresupuestoId]
    );

    if (rows.length === 0) return [];

    const equipamientoIds = rows.map(eq => eq.id_equipamiento).filter(Boolean);
    const obraSocial = rows[0]?.financiador_id;
    const sucursalId = rows[0]?.sucursal_id;

    let valoresMap = new Map();
    if (equipamientoIds.length > 0 && obraSocial) {
      const placeholders = equipamientoIds.map(() => '?').join(',');
      const [valores] = await pool.query<RowDataPacket[]>(
        `SELECT fe.id_equipamiento, v.valor_facturar
         FROM financiador_equipamiento fe
         JOIN financiador_equipamiento_valores v ON fe.id = v.id_financiador_equipamiento
         WHERE fe.financiador_id = ? AND fe.id_equipamiento IN (${placeholders})
           AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
           AND CURDATE() BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
         ORDER BY fe.id_equipamiento, v.sucursal_id DESC, v.fecha_inicio DESC`,
        [obraSocial, ...equipamientoIds, sucursalId]
      );

      valores.forEach(v => {
        if (!valoresMap.has(v.id_equipamiento)) {
          valoresMap.set(v.id_equipamiento, v.valor_facturar);
        }
      });
    }

    return rows.map(eq => ({
      ...eq,
      precio_facturar: valoresMap.get(eq.id_equipamiento) || eq.precio_facturar
    }));
  }
}

export const equipamientosService = new EquipamientosService();
