import { Router } from 'express';
import { getSucursales } from '../controllers/sucursalesController';

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
router.get('/', getSucursales);

export default router;
