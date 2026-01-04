import { Router, Request, Response, NextFunction } from 'express';
import { obtenerTiposUnidad, crearTipoUnidad } from '../controllers/tiposUnidadController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateTipoUnidadData = (req: Request, res: Response, next: NextFunction) => {
  const { nombre } = req.body;
  
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre del tipo de unidad es requerido' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/tipos-unidad:
 *   get:
 *     tags: [Admin - Tipos de Unidad]
 *     summary: Listar tipos de unidad
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de unidad
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo tipos de unidad', { usuario: req.user.id });
  const resultado = await obtenerTiposUnidad(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/tipos-unidad:
 *   post:
 *     tags: [Admin - Tipos de Unidad]
 *     summary: Crear tipo de unidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo creado
 */
router.post('/', authenticateToken, requireAdmin, validateTipoUnidadData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { nombre } = req.body;
  
  logger.info('Creando tipo de unidad', { nombre, usuario: req.user.id });
  const resultado = await crearTipoUnidad(req, res, () => {});
  
  logger.info('Tipo de unidad creado exitosamente', { 
    nombre, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
