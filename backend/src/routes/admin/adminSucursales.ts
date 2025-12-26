import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllSucursales, updateSucursal } from '../../controllers/admin/adminSucursalesController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/sucursales:
 *   get:
 *     summary: Listar todas las sucursales (Admin)
 *     description: Obtiene lista completa de sucursales con porcentajes de margen
 *     tags: [Admin - Sucursales]
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
 *                   porcentaje_insumos:
 *                     type: number
 *                     description: Porcentaje de margen para insumos
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', getAllSucursales);

/**
 * @swagger
 * /api/admin/sucursales/{id}:
 *   put:
 *     summary: Actualizar sucursal (Admin)
 *     description: Actualiza datos de una sucursal (nombre, porcentaje de margen)
 *     tags: [Admin - Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Sucursales_mh:
 *                 type: string
 *                 example: "CABA"
 *               porcentaje_insumos:
 *                 type: number
 *                 example: 20
 *                 description: Porcentaje de margen para insumos (%)
 *     responses:
 *       200:
 *         description: Sucursal actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Sucursal no encontrada
 */
router.put('/:id', updateSucursal);

export default router;
