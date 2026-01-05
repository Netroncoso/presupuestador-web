import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
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

// POST /api/equipamientos/:id/valores - Agregar valor histórico por financiador
export const agregarValorEquipamientoAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await equipamientosService.agregarValorAdmin(id, req.body);
  res.json(resultado);
});

// GET /api/equipamientos/:id/valores - Obtener valores históricos
export const getValoresEquipamientoAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const valores = await equipamientosService.obtenerValoresAdmin(id);
  res.json(valores);
});

// GET /api/equipamientos/admin/financiador/:id - Obtener equipamientos con valores por financiador
export const getEquipamientosPorFinanciadorAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const equipamientos = await equipamientosService.obtenerPorFinanciadorAdmin(id);
  res.json(equipamientos);
});

// PUT /api/equipamientos/admin/acuerdo/:id - Actualizar estado de acuerdo
export const actualizarAcuerdoEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  const resultado = await equipamientosService.actualizarAcuerdo(id, activo);
  res.json(resultado);
});

// Agregar equipamiento a presupuesto
export const agregarEquipamientoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await equipamientosService.agregarAPresupuesto(id, req.body);
  res.json(resultado);
});

// Eliminar equipamiento de presupuesto
export const eliminarEquipamientoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const { id, equipamientoId } = req.params;
  const resultado = await equipamientosService.eliminarDePresupuesto(id, equipamientoId);
  res.json(resultado);
});

// Obtener equipamientos de un presupuesto
export const getEquipamientosPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const soloLectura = req.query.soloLectura === 'true';
  const equipamientos = await equipamientosService.obtenerDePresupuesto(id, soloLectura);
  res.json(equipamientos);
});
