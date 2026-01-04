import { Router, Request, Response, NextFunction } from 'express';
import { getPrestadores, getPrestacionesPorPrestador, getPrestadorInfo } from '../controllers/prestacionesController';
import { getValoresPrestadorServicio, guardarValorPrestadorServicio } from '../controllers/prestadorValoresController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validatePrestadorId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de prestador debe ser un número válido' });
  }
  next();
};

const validateServicioId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  // Permitir 0 para crear nuevos servicios, pero no negativos o NaN
  if (isNaN(id) || id < 0) {
    return res.status(400).json({ error: 'ID de servicio debe ser un número válido' });
  }
  next();
};

const validateValorData = (req: Request, res: Response, next: NextFunction) => {
  const { valor_asignado, valor_facturar, fecha_inicio } = req.body;
  
  if (!valor_asignado || isNaN(parseFloat(valor_asignado))) {
    return res.status(400).json({ error: 'Valor asignado válido es requerido' });
  }
  
  if (!valor_facturar || isNaN(parseFloat(valor_facturar))) {
    return res.status(400).json({ error: 'Valor facturar válido es requerido' });
  }
  
  if (!fecha_inicio) {
    return res.status(400).json({ error: 'Fecha de inicio es requerida' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/prestaciones/prestadores:
 *   get:
 *     summary: Listar financiadores/prestadores
 *     description: Obtiene lista de financiadores disponibles
 *     tags: [Prestaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de financiadores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idobra_social:
 *                     type: integer
 *                   Nombre_prestador:
 *                     type: string
 *                   tasa_mensual:
 *                     type: number
 *                   dias_cobranza_teorico:
 *                     type: integer
 *                   dias_cobranza_real:
 *                     type: integer
 */
router.get('/prestadores', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando prestadores/financiadores', { usuario: req.user.id });
  const resultado = await getPrestadores(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/prestaciones/prestador/{id}:
 *   get:
 *     summary: Obtener prestaciones por financiador
 *     description: Lista servicios/prestaciones con valores vigentes para un financiador
 *     tags: [Prestaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para valores vigentes (default hoy)
 *       - in: query
 *         name: sucursal_id
 *         schema:
 *           type: integer
 *         description: ID de sucursal para valores específicos
 *     responses:
 *       200:
 *         description: Lista de prestaciones con valores vigentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_prestador_servicio:
 *                     type: integer
 *                   nombre_servicio:
 *                     type: string
 *                   tipo_unidad:
 *                     type: string
 *                   valor_asignado:
 *                     type: number
 *                   valor_facturar:
 *                     type: number
 *                   cantidad_sugerida:
 *                     type: integer
 *                   dias_sin_actualizar:
 *                     type: integer
 */
router.get('/prestador/:id', authenticateToken, validatePrestadorId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prestadorId = parseInt(req.params.id);
  const { fecha, sucursal_id } = req.query;
  
  logger.info('Obteniendo prestaciones por prestador', { 
    prestadorId, 
    fecha, 
    sucursal_id, 
    usuario: req.user.id 
  });
  
  const resultado = await getPrestacionesPorPrestador(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/prestaciones/prestador/{id}/info:
 *   get:
 *     summary: Obtener información del financiador
 *     description: Obtiene datos del financiador (tasa, días cobranza, etc.)
 *     tags: [Prestaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Información del financiador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idobra_social:
 *                   type: integer
 *                 Nombre_prestador:
 *                   type: string
 *                 tasa_mensual:
 *                   type: number
 *                 dias_cobranza_teorico:
 *                   type: integer
 *                 dias_cobranza_real:
 *                   type: integer
 *                 acuerdo_asignado:
 *                   type: string
 */
router.get('/prestador/:id/info', authenticateToken, validatePrestadorId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const prestadorId = parseInt(req.params.id);
  
  logger.info('Obteniendo información del prestador', { 
    prestadorId, 
    usuario: req.user.id 
  });
  
  const resultado = await getPrestadorInfo(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/prestaciones/servicio/{id}/valores:
 *   get:
 *     summary: Obtener valores históricos de servicio
 *     description: Lista todos los períodos de vigencia de un servicio
 *     tags: [Prestaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del prestador_servicio
 *     responses:
 *       200:
 *         description: Historial de valores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   valor_asignado:
 *                     type: number
 *                   valor_facturar:
 *                     type: number
 *                   fecha_inicio:
 *                     type: string
 *                   fecha_fin:
 *                     type: string
 *                     nullable: true
 *                   sucursal_id:
 *                     type: integer
 *                     nullable: true
 *   post:
 *     summary: Guardar valor histórico (Admin)
 *     description: Agrega nuevo valor con cierre automático de anteriores
 *     tags: [Prestaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valor_asignado
 *               - valor_facturar
 *               - fecha_inicio
 *             properties:
 *               valor_asignado:
 *                 type: number
 *                 example: 5000.00
 *               valor_facturar:
 *                 type: number
 *                 example: 6000.00
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               sucursal_id:
 *                 type: integer
 *                 nullable: true
 *                 description: NULL para todas las sucursales
 *     responses:
 *       200:
 *         description: Valor guardado
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/servicio/:id/valores', authenticateToken, validateServicioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const servicioId = parseInt(req.params.id);
  
  logger.info('Obteniendo valores históricos de servicio', { 
    servicioId, 
    usuario: req.user.id 
  });
  
  const resultado = await getValoresPrestadorServicio(req, res, () => {});
  return resultado;
}));

router.post('/servicio/:id/valores', authenticateToken, requireAdmin, validateServicioId, validateValorData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id } = req.body;
  
  logger.info('Guardando valor histórico de prestación', { 
    servicioId: id, 
    valor_asignado, 
    valor_facturar, 
    fecha_inicio, 
    sucursal_id, 
    usuario: req.user.id 
  });
  
  const resultado = await guardarValorPrestadorServicio(req, res, () => {});
  
  logger.info('Valor de prestación guardado exitosamente', { 
    servicioId: id, 
    valor_asignado, 
    valor_facturar, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
