import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getPrestadoresActivos, getServiciosPorPrestador, createOrUpdateServicioPrestador } from '../../controllers/admin/adminServiciosController';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateFinanciadorId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.financiadorId);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de financiador debe ser un número válido' });
  }
  next();
};

const validateServicioId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.servicioId);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de servicio debe ser un número válido' });
  }
  next();
};

const validateServicioData = (req: Request, res: Response, next: NextFunction) => {
  const { valor_asignado, valor_facturar, cantidad_sugerida } = req.body;
  
  if (valor_asignado !== undefined && (isNaN(parseFloat(valor_asignado)) || parseFloat(valor_asignado) < 0)) {
    return res.status(400).json({ error: 'Valor asignado debe ser un número válido' });
  }
  
  if (valor_facturar !== undefined && (isNaN(parseFloat(valor_facturar)) || parseFloat(valor_facturar) < 0)) {
    return res.status(400).json({ error: 'Valor facturar debe ser un número válido' });
  }
  
  if (cantidad_sugerida !== undefined && (isNaN(parseInt(cantidad_sugerida)) || parseInt(cantidad_sugerida) < 0)) {
    return res.status(400).json({ error: 'Cantidad sugerida debe ser un número entero válido' });
  }
  
  next();
};

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/servicios/prestadores:
 *   get:
 *     summary: Listar financiadores activos (Admin)
 *     description: Obtiene lista de financiadores para gestión de servicios
 *     tags: [Admin - Servicios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de financiadores activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idobra_social:
 *                     type: integer
 *                   Financiador:
 *                     type: string
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/financiadores', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo financiadores activos', { usuario: req.user.id });
  
  const resultado = await getPrestadoresActivos(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/admin/servicios/prestador/{prestadorId}/servicios:
 *   get:
 *     summary: Obtener servicios por financiador (Admin)
 *     description: Lista todos los servicios con valores vigentes para un financiador
 *     tags: [Admin - Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prestadorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *     responses:
 *       200:
 *         description: Lista de servicios con valores
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
 *                   activo:
 *                     type: boolean
 */
router.get('/financiador/:financiadorId/servicios', validateFinanciadorId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const financiadorId = parseInt(req.params.financiadorId);
  
  logger.info('Obteniendo servicios por financiador', { 
    financiadorId, 
    usuario: req.user.id 
  });
  
  const resultado = await getServiciosPorPrestador(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/admin/servicios/prestador/{prestadorId}/servicio/{servicioId}:
 *   put:
 *     summary: Actualizar servicio de financiador (Admin)
 *     description: Crea o actualiza relación servicio-financiador con valores
 *     tags: [Admin - Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prestadorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: servicioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               valor_asignado:
 *                 type: number
 *                 example: 5000.00
 *               valor_facturar:
 *                 type: number
 *                 example: 6000.00
 *               cantidad_sugerida:
 *                 type: integer
 *                 example: 10
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Servicio actualizado
 */
router.put('/financiador/:financiadorId/servicio/:servicioId', validateFinanciadorId, validateServicioId, validateServicioData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const financiadorId = parseInt(req.params.financiadorId);
  const servicioId = parseInt(req.params.servicioId);
  const { valor_asignado, valor_facturar, cantidad_sugerida } = req.body;
  
  logger.info('Actualizando servicio de financiador', { 
    financiadorId, 
    servicioId, 
    valor_asignado, 
    valor_facturar, 
    cantidad_sugerida,
    usuario: req.user.id 
  });
  
  const resultado = await createOrUpdateServicioPrestador(req, res, () => {});
  
  logger.info('Servicio de financiador actualizado exitosamente', { 
    financiadorId, 
    servicioId, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
