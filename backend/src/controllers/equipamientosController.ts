import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { equipamientosService } from '../services/equipamientosService';

// GET /api/equipamientos - Obtener todos los equipamientos (admin)
export const getAllEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const equipamientos = await equipamientosService.obtenerTodos();
  res.json(equipamientos);
});

// Obtener todos los equipamientos activos (catálogo)
export const getEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const equipamientos = await equipamientosService.obtenerActivos();
  res.json(equipamientos);
});

// Obtener equipamientos por financiador con valores vigentes
export const getEquipamientosPorFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : null;
  
  const resultado = await equipamientosService.obtenerPorFinanciador(id, fecha, sucursalId);
  res.json(resultado);
});

// Obtener valores históricos de un acuerdo
export const getValoresEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const valores = await equipamientosService.obtenerValoresHistoricos(id);
  res.json(valores);
});

// Guardar nuevo valor histórico
export const guardarValorEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await equipamientosService.guardarValor(id, req.body);
  res.json(resultado);
});

// PUT /api/equipamientos/:id - Actualizar equipamiento
export const actualizarEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await equipamientosService.actualizar(id, req.body);
  res.json(resultado);
});

// GET /api/equipamientos/tipos - Obtener tipos de equipamiento
export const getTiposEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const tipos = await equipamientosService.obtenerTipos();
  res.json(tipos);
});

// POST /api/equipamientos/tipos - Crear tipo de equipamiento
export const crearTipoEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await equipamientosService.crearTipo(req.body);
  res.json(resultado);
});

// POST /api/equipamientos/admin - Crear equipamiento
export const crearEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await equipamientosService.crear(req.body);
  res.json(resultado);
});

// DELETE /api/equipamientos/admin/:id - Eliminar equipamiento
export const eliminarEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await equipamientosService.eliminar(id);
  res.json(resultado);
});

// Métodos adicionales que mantienen lógica compleja
const validateEquipamientoId = (id: string): number => {
  const numId = Number(id);
  if (!id || isNaN(numId) || numId <= 0) {
    throw new AppError(400, "ID de equipamiento inválido");
  }
  return numId;
};

const validateFinanciadorId = (id: string): number => {
  const numId = Number(id);
  if (!id || isNaN(numId) || numId <= 0) {
    throw new AppError(400, "ID de financiador inválido");
  }
  return numId;
};

const validateDateFormat = (fecha: string): void => {
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fechaRegex.test(fecha)) {
    throw new AppError(400, "Formato de fecha inválido (YYYY-MM-DD)");
  }
};

const validateNumericValues = (valor_asignado: any, valor_facturar: any): { valorAsignado: number; valorFacturar: number } => {
  const valorAsignado = Number(valor_asignado);
  const valorFacturar = Number(valor_facturar);
  
  if (isNaN(valorAsignado) || valorAsignado < 0) {
    throw new AppError(400, 'Valor asignado debe ser un número positivo');
  }
  
  if (isNaN(valorFacturar) || valorFacturar < 0) {
    throw new AppError(400, 'Valor facturar debe ser un número positivo');
  }
  
  return { valorAsignado, valorFacturar };
};

// POST /api/equipamientos/:id/valores - Agregar valor histórico por financiador
export const agregarValorEquipamientoAdmin = asyncHandler(async (req: Request, res: Response) => {
  const equipamientoId = validateEquipamientoId(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, financiador_id } = req.body;

  if (!fecha_inicio || !financiador_id) {
    throw new AppError(400, 'Faltan campos obligatorios: fecha_inicio, financiador_id');
  }

  const { valorAsignado, valorFacturar } = validateNumericValues(valor_asignado, valor_facturar);
  const financiadorIdNum = validateFinanciadorId(financiador_id);
  validateDateFormat(fecha_inicio);

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar equipamiento existe
    const [equipamiento] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM equipamientos WHERE id = ? AND activo = 1',
      [equipamientoId]
    );

    if (equipamiento.length === 0) {
      throw new AppError(404, 'Equipamiento no encontrado');
    }

    // Obtener/crear financiador_equipamiento
    let [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM financiador_equipamiento WHERE id_equipamiento = ? AND idobra_social = ?',
      [equipamientoId, financiadorIdNum]
    );

    let financiadorEquipamientoId;
    if (existing.length > 0) {
      financiadorEquipamientoId = existing[0].id;
    } else {
      const [result]: any = await connection.query(
        'INSERT INTO financiador_equipamiento (id_equipamiento, idobra_social, activo) VALUES (?, ?, 1)',
        [equipamientoId, financiadorIdNum]
      );
      financiadorEquipamientoId = result.insertId;
    }

    // Cerrar valores anteriores
    await connection.query(
      `UPDATE financiador_equipamiento_valores SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE id_financiador_equipamiento = ? AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
         AND fecha_fin IS NULL AND fecha_inicio < ?`,
      [fecha_inicio, financiadorEquipamientoId, sucursal_id, sucursal_id, fecha_inicio]
    );

    // Insertar nuevo valor
    await connection.query(
      `INSERT INTO financiador_equipamiento_valores (id_financiador_equipamiento, valor_asignado, valor_facturar, fecha_inicio, sucursal_id)
       VALUES (?, ?, ?, ?, ?)`,
      [financiadorEquipamientoId, valorAsignado, valorFacturar, fecha_inicio, sucursal_id || null]
    );

    await connection.commit();
    res.json({ success: true, message: 'Valor agregado correctamente' });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error instanceof AppError) throw error;
    throw new AppError(500, "Error interno al agregar valor");
  } finally {
    if (connection) connection.release();
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

// GET /api/equipamientos/admin/financiador/:id - Obtener equipamientos con valores por financiador
export const getEquipamientosPorFinanciadorAdmin = asyncHandler(async (req: Request, res: Response) => {
  const financiadorId = req.params.id;
  
  const [rows] = await pool.query(
    `SELECT 
      e.id,
      e.nombre,
      te.nombre as tipo,
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
     LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
     LEFT JOIN financiador_equipamiento fe ON e.id = fe.id_equipamiento AND fe.idobra_social = ?
     WHERE e.activo = 1
     ORDER BY te.nombre, e.nombre`,
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

// Agregar equipamiento a presupuesto (UPSERT con ON DUPLICATE KEY UPDATE)
export const agregarEquipamientoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = req.params.id;
  const { id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo } = req.body;

  if (!id_equipamiento || !nombre || !cantidad || !costo || !precio_facturar) {
    throw new AppError(400, "Datos incompletos");
  }

  const [result]: any = await pool.query(
    `INSERT INTO presupuesto_equipamiento 
     (idPresupuestos, id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     cantidad = VALUES(cantidad),
     costo = VALUES(costo),
     precio_facturar = VALUES(precio_facturar),
     tipo = VALUES(tipo)`,
    [presupuestoId, id_equipamiento, nombre, tipo, cantidad, costo, precio_facturar, tiene_acuerdo || false]
  );

  res.json({ ok: true, id: result.insertId || result.insertId });
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
  const presupuestoId = validateEquipamientoId(req.params.id);
  const soloLectura = req.query.soloLectura === 'true';

  if (soloLectura) {
    const [rows] = await pool.query(
      'SELECT * FROM presupuesto_equipamiento WHERE idPresupuestos = ? ORDER BY nombre LIMIT 100',
      [presupuestoId]
    );
    return res.json(rows);
  }

  // Obtener datos base
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pe.*, p.idobra_social, p.sucursal_id
     FROM presupuesto_equipamiento pe
     JOIN presupuestos p ON pe.idPresupuestos = p.idPresupuestos
     WHERE pe.idPresupuestos = ? ORDER BY pe.nombre LIMIT 100`,
    [presupuestoId]
  );

  if (rows.length === 0) return res.json([]);

  // Obtener valores actuales en batch
  const equipamientoIds = rows.map(eq => eq.id_equipamiento).filter(Boolean);
  const obraSocial = rows[0]?.idobra_social;
  const sucursalId = rows[0]?.sucursal_id;

  let valoresMap = new Map();
  if (equipamientoIds.length > 0 && obraSocial) {
    const placeholders = equipamientoIds.map(() => '?').join(',');
    const [valores] = await pool.query<RowDataPacket[]>(
      `SELECT fe.id_equipamiento, v.valor_facturar
       FROM financiador_equipamiento fe
       JOIN financiador_equipamiento_valores v ON fe.id = v.id_financiador_equipamiento
       WHERE fe.idobra_social = ? AND fe.id_equipamiento IN (${placeholders})
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

  const resultado = rows.map(eq => ({
    ...eq,
    precio_facturar: valoresMap.get(eq.id_equipamiento) || eq.precio_facturar
  }));

  res.json(resultado);
});
