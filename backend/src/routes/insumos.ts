import { Router, Request, Response, NextFunction } from 'express';
import { getInsumos } from '../controllers/insumosController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/insumos:
 *   get:
 *     summary: Listar insumos activos
 *     description: Obtiene catálogo de insumos disponibles con precios actuales
 *     tags: [Insumos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de insumos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idInsumos:
 *                     type: integer
 *                   Producto:
 *                     type: string
 *                   codigo_producto:
 *                     type: string
 *                     nullable: true
 *                     description: Código EAN/SKU
 *                   Precio:
 *                     type: number
 *                   Categoria:
 *                     type: string
 *                   activo:
 *                     type: boolean
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando insumos activos', { usuario: req.user.id });
  const resultado = await getInsumos(req, res, () => {});
  return resultado;
}));

export default router;
