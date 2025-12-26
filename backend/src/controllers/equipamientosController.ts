import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// GET /api/equipamientos - Obtener todos los equipamientos (admin)
export const getAllEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT id, nombre, tipo, precio_referencia, activo FROM equipamientos ORDER BY nombre'
  );
  res.json(rows);
});

// Obtener todos los equipamientos activos (catálogo)
export const getEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT * FROM equipamientos WHERE activo = 1 ORDER BY tipo, nombre`
  );
  res.json(rows);
});

// Obtener equipamientos por financiador con valores vigentes
export const getEquipamientosPorFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const financiadorId = req.params.id;
  const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : null;
  
  const [rows] = await pool.query(
    `SELECT 
      e.id,
      e.nombre,
      e.descripcion,
      e.tipo,
      e.precio_referencia,
      e.unidad_tiempo,
      COALESCE(
        (SELECT valor_asignado 
         FROM financiador_equipamiento_valores v
         JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
         WHERE fe.idobra_social = ?
           AND fe.id_equipamiento = e.id
           AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
           AND ? BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
         ORDER BY 
           CASE 
             WHEN v.sucursal_id IS NOT NULL 
               AND DATEDIFF(v.fecha_inicio, 
                 (SELECT MAX(v2.fecha_inicio) FROM financiador_equipamiento_valores v2
                  JOIN financiador_equipamiento fe2 ON v2.id_financiador_equipamiento = fe2.id
                  WHERE fe2.idobra_social = ?
                    AND fe2.id_equipamiento = e.id
                    AND v2.sucursal_id IS NULL
                    AND ? BETWEEN v2.fecha_inicio AND COALESCE(v2.fecha_fin, '9999-12-31'))
               ) >= -30
             THEN 1
             ELSE 2
           END,
           v.fecha_inicio DESC
         LIMIT 1),
        e.precio_referencia
      ) AS valor_asignado,
      COALESCE(
        (SELECT valor_facturar 
         FROM financiador_equipamiento_valores v
         JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
         WHERE fe.idobra_social = ?
           AND fe.id_equipamiento = e.id
           AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
           AND ? BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
         ORDER BY 
           CASE 
             WHEN v.sucursal_id IS NOT NULL 
               AND DATEDIFF(v.fecha_inicio, 
                 (SELECT MAX(v2.fecha_inicio) FROM financiador_equipamiento_valores v2
                  JOIN financiador_equipamiento fe2 ON v2.id_financiador_equipamiento = fe2.id
                  WHERE fe2.idobra_social = ?
                    AND fe2.id_equipamiento = e.id
                    AND v2.sucursal_id IS NULL
                    AND ? BETWEEN v2.fecha_inicio AND COALESCE(v2.fecha_fin, '9999-12-31'))
               ) >= -30
             THEN 1
             ELSE 2
           END,
           v.fecha_inicio DESC
         LIMIT 1),
        e.precio_referencia
      ) AS valor_facturar,
      EXISTS(
        SELECT 1 FROM financiador_equipamiento fe
        WHERE fe.idobra_social = ? AND fe.id_equipamiento = e.id
      ) AS tiene_acuerdo,
      COALESCE(
        (SELECT DATEDIFF(CURDATE(), MAX(v.fecha_inicio))
         FROM financiador_equipamiento_valores v
         JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
         WHERE fe.idobra_social = ? AND fe.id_equipamiento = e.id),
        999
      ) AS dias_sin_actualizar
     FROM equipamientos e
     WHERE e.activo = 1
     ORDER BY e.tipo, e.nombre`, 
    [financiadorId, sucursalId, fecha, financiadorId, fecha, financiadorId, sucursalId, fecha, financiadorId, fecha, financiadorId, financiadorId]
  );
  
  res.json(rows);
});

// Obtener valores históricos de un acuerdo
export const getValoresEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id || isNaN(Number(id))) {
    throw new AppError(400, "ID inválido");
  }

  const [rows] = await pool.query(
    `SELECT 
      id, 
      valor_asignado,
      valor_facturar,
      fecha_inicio, 
      fecha_fin,
      sucursal_id,
      created_at
     FROM financiador_equipamiento_valores 
     WHERE id_financiador_equipamiento = ? 
     ORDER BY fecha_inicio DESC`,
    [id]
  );

  res.json(rows);
});

// Guardar nuevo valor histórico
export const guardarValorEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  let financiadorEquipamientoId = Number(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, id_equipamiento, idobra_social } = req.body;

  if (!valor_asignado || !valor_facturar || !fecha_inicio) {
    throw new AppError(400, "Datos incompletos: valor_asignado, valor_facturar y fecha_inicio requeridos");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Si no existe financiadorEquipamientoId, crear registro en financiador_equipamiento
    if (!financiadorEquipamientoId || isNaN(financiadorEquipamientoId)) {
      if (!id_equipamiento || !idobra_social) {
        throw new AppError(400, "id_equipamiento e idobra_social requeridos para crear acuerdo nuevo");
      }

      // Verificar si ya existe
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND idobra_social = ?',
        [id_equipamiento, idobra_social]
      );

      if (existing.length > 0) {
        financiadorEquipamientoId = existing[0].id;
      } else {
        // Crear nuevo registro activo
        const [result]: any = await connection.query(
          'INSERT INTO financiador_equipamiento (id_equipamiento, idobra_social, activo) VALUES (?, ?, 1)',
          [id_equipamiento, idobra_social]
        );
        financiadorEquipamientoId = result.insertId;
      }
    }

    // Cerrar todos los períodos vigentes o que solapan con la nueva fecha para la misma sucursal
    await connection.query(
      `UPDATE financiador_equipamiento_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE id_financiador_equipamiento = ? 
         AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
         AND fecha_inicio < ?
         AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [fecha_inicio, financiadorEquipamientoId, sucursal_id, sucursal_id, fecha_inicio, fecha_inicio]
    );

    // Si es valor general, cerrar valores específicos obsoletos (> 30 días)
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
    res.json({ 
      ok: true, 
      message: 'Valor guardado correctamente',
      id_financiador_equipamiento: financiadorEquipamientoId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// PUT /api/equipamientos/:id - Actualizar equipamiento
export const actualizarEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, tipo, precio_referencia, activo } = req.body;

  await pool.query(
    'UPDATE equipamientos SET nombre = ?, tipo = ?, precio_referencia = ?, activo = ? WHERE id = ?',
    [nombre, tipo, precio_referencia, activo, id]
  );

  res.json({ success: true });
});

// POST /api/equipamientos/:id/valores - Agregar valor histórico por financiador
export const agregarValorEquipamientoAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, financiador_id } = req.body;

  if (!valor_asignado || !valor_facturar || !fecha_inicio || !financiador_id) {
    throw new AppError(400, 'Faltan campos obligatorios');
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar/crear financiador_equipamiento
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND idobra_social = ?',
      [id, financiador_id]
    );

    let financiadorEquipamientoId;
    if (existing.length > 0) {
      financiadorEquipamientoId = existing[0].id;
    } else {
      const [result]: any = await connection.query(
        'INSERT INTO financiador_equipamiento (id_equipamiento, idobra_social, activo) VALUES (?, ?, 1)',
        [id, financiador_id]
      );
      financiadorEquipamientoId = result.insertId;
    }

    // Cerrar valores anteriores
    await connection.query(
      `UPDATE financiador_equipamiento_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE id_financiador_equipamiento = ?
         AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
         AND fecha_fin IS NULL`,
      [fecha_inicio, financiadorEquipamientoId, sucursal_id, sucursal_id]
    );

    // Insertar nuevo valor
    await connection.query(
      `INSERT INTO financiador_equipamiento_valores 
       (id_financiador_equipamiento, valor_asignado, valor_facturar, fecha_inicio, sucursal_id)
       VALUES (?, ?, ?, ?, ?)`,
      [financiadorEquipamientoId, valor_asignado, valor_facturar, fecha_inicio, sucursal_id || null]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// GET /api/equipamientos/:id/valores - Obtener valores históricos
export const getValoresEquipamientoAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT 
      v.id,
      v.valor_asignado,
      v.valor_facturar,
      v.fecha_inicio,
      v.fecha_fin,
      v.sucursal_id,
      fe.idobra_social as financiador_id
     FROM financiador_equipamiento_valores v
     JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
     WHERE fe.id_equipamiento = ?
     ORDER BY v.fecha_inicio DESC`,
    [id]
  );

  res.json(rows);
});

// POST /api/equipamientos/admin - Crear equipamiento
export const crearEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, tipo, precio_referencia, activo } = req.body;

  const [result]: any = await pool.query(
    'INSERT INTO equipamientos (nombre, tipo, precio_referencia, activo) VALUES (?, ?, ?, ?)',
    [nombre, tipo, precio_referencia, activo]
  );

  res.json({ success: true, id: result.insertId });
});

// DELETE /api/equipamientos/admin/:id - Eliminar equipamiento
export const eliminarEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await pool.query('DELETE FROM equipamientos WHERE id = ?', [id]);

  res.json({ success: true });
});

// GET /api/equipamientos/tipos - Obtener tipos de equipamiento
export const getTiposEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT * FROM tipos_equipamiento ORDER BY nombre'
  );
  res.json(rows);
});

// POST /api/equipamientos/tipos - Crear tipo de equipamiento
export const crearTipoEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, descripcion } = req.body;

  const [result]: any = await pool.query(
    'INSERT INTO tipos_equipamiento (nombre, descripcion, activo) VALUES (?, ?, 1)',
    [nombre, descripcion]
  );

  res.json({ success: true, id: result.insertId });
});

// GET /api/equipamientos/admin/financiador/:id - Obtener equipamientos con valores por financiador
export const getEquipamientosPorFinanciadorAdmin = asyncHandler(async (req: Request, res: Response) => {
  const financiadorId = req.params.id;
  
  const [rows] = await pool.query(
    `SELECT 
      e.id,
      e.nombre,
      e.tipo,
      e.precio_referencia,
      e.activo,
      fe.id as id_financiador_equipamiento,
      fe.activo as activo_financiador,
      (
        SELECT COUNT(*)
        FROM financiador_equipamiento_valores v
        WHERE v.id_financiador_equipamiento = fe.id
          AND v.fecha_fin IS NULL
      ) as count_valores_vigentes,
      (
        SELECT valor_asignado
        FROM financiador_equipamiento_valores v
        WHERE v.id_financiador_equipamiento = fe.id
          AND v.fecha_fin IS NULL
        ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC
        LIMIT 1
      ) as valor_asignado_vigente,
      (
        SELECT valor_facturar
        FROM financiador_equipamiento_valores v
        WHERE v.id_financiador_equipamiento = fe.id
          AND v.fecha_fin IS NULL
        ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC
        LIMIT 1
      ) as valor_facturar_vigente,
      (
        SELECT sucursal_id
        FROM financiador_equipamiento_valores v
        WHERE v.id_financiador_equipamiento = fe.id
          AND v.fecha_fin IS NULL
        ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC
        LIMIT 1
      ) as sucursal_id_vigente
     FROM equipamientos e
     LEFT JOIN financiador_equipamiento fe ON e.id = fe.id_equipamiento AND fe.idobra_social = ?
     WHERE e.activo = 1
     ORDER BY e.tipo, e.nombre`,
    [financiadorId]
  );
  
  res.json(rows);
});

// PUT /api/equipamientos/admin/acuerdo/:id - Actualizar estado de acuerdo
export const actualizarAcuerdoEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;

  await pool.query(
    'UPDATE financiador_equipamiento SET activo = ? WHERE id = ?',
    [activo, id]
  );

  res.json({ success: true });
});

// Agregar equipamiento a presupuesto
export const agregarEquipamientoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = req.params.id;
  const { id_equipamiento, nombre, cantidad, costo, precio_facturar, tiene_acuerdo } = req.body;

  if (!id_equipamiento || !nombre || !cantidad || !costo || !precio_facturar) {
    throw new AppError(400, "Datos incompletos");
  }

  const [result]: any = await pool.query(
    `INSERT INTO presupuesto_equipamiento 
     (idPresupuestos, id_equipamiento, nombre, cantidad, costo, precio_facturar, tiene_acuerdo) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [presupuestoId, id_equipamiento, nombre, cantidad, costo, precio_facturar, tiene_acuerdo || false]
  );

  res.json({ ok: true, id: result.insertId });
});

// Eliminar equipamiento de presupuesto
export const eliminarEquipamientoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const { id, equipamientoId } = req.params;

  await pool.query(
    'DELETE FROM presupuesto_equipamiento WHERE idPresupuestos = ? AND id = ?',
    [id, equipamientoId]
  );

  res.json({ ok: true });
});

// Obtener equipamientos de un presupuesto
export const getEquipamientosPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = req.params.id;
  const soloLectura = req.query.soloLectura === 'true';

  if (soloLectura) {
    // Modo solo lectura: devolver valores guardados tal cual
    const [rows] = await pool.query(
      `SELECT * FROM presupuesto_equipamiento WHERE idPresupuestos = ? ORDER BY nombre`,
      [presupuestoId]
    );
    res.json(rows);
  } else {
    // Modo edición: actualizar precio_facturar con valores actuales
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        pe.*,
        p.idobra_social,
        p.sucursal_id
       FROM presupuesto_equipamiento pe
       JOIN presupuestos p ON pe.idPresupuestos = p.idPresupuestos
       WHERE pe.idPresupuestos = ?
       ORDER BY pe.nombre`,
      [presupuestoId]
    );

    // Actualizar precio_facturar con valores actuales
    const equipamientosActualizados = await Promise.all(
      rows.map(async (eq: any) => {
        const [valores] = await pool.query<RowDataPacket[]>(
          `SELECT valor_facturar
           FROM financiador_equipamiento_valores v
           JOIN financiador_equipamiento fe ON v.id_financiador_equipamiento = fe.id
           WHERE fe.idobra_social = ?
             AND fe.id_equipamiento = ?
             AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
             AND CURDATE() BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
           ORDER BY v.sucursal_id DESC, v.fecha_inicio DESC
           LIMIT 1`,
          [eq.idobra_social, eq.id_equipamiento, eq.sucursal_id]
        );

        return {
          ...eq,
          precio_facturar: valores.length > 0 ? valores[0].valor_facturar : eq.precio_facturar
        };
      })
    );

    res.json(equipamientosActualizados);
  }
});
