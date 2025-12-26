import { Router } from 'express';
import { getInsumos } from '../controllers/insumosController';
import { authenticateToken } from '../middleware/auth';

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
router.get('/', authenticateToken, getInsumos);

export default router;
