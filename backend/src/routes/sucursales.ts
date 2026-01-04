import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSucursales } from '../controllers/sucursalesController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/sucursales:
 *   get:
 *     summary: Listar sucursales
 *     description: Obtiene lista de sucursales disponibles (público con auth)
 *     tags: [Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sucursales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID:
 *                     type: integer
 *                   Sucursales_mh:
 *                     type: string
 *                     example: "CABA"
 *                   porcentaje_insumos:
 *                     type: number
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo lista de sucursales', { usuario: req.user.id });
  
  const resultado = await getSucursales(req, res, () => {});
  return resultado;
}));

export default router;
