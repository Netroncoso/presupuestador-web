import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllInsumos, createInsumo, updateInsumo, deleteInsumo } from '../../controllers/admin/adminInsumosController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/insumos:
 *   get:
 *     summary: Listar todos los insumos (Admin)
 *     description: Obtiene catálogo completo de insumos para administración
 *     tags: [Admin - Insumos]
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
 *                   Precio:
 *                     type: number
 *                   Categoria:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado - Solo admin
 *   post:
 *     summary: Crear nuevo insumo (Admin)
 *     tags: [Admin - Insumos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Producto
 *               - Precio
 *               - Categoria
 *             properties:
 *               Producto:
 *                 type: string
 *                 example: "Guantes de látex (caja x100)"
 *               codigo_producto:
 *                 type: string
 *                 nullable: true
 *                 example: "7798123456789"
 *                 description: Código EAN/SKU
 *               Precio:
 *                 type: number
 *                 example: 2500.00
 *               Categoria:
 *                 type: string
 *                 example: "Descartables"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Insumo creado exitosamente
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', getAllInsumos);
router.post('/', createInsumo);

/**
 * @swagger
 * /api/admin/insumos/{id}:
 *   put:
 *     summary: Actualizar insumo (Admin)
 *     tags: [Admin - Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del insumo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Producto:
 *                 type: string
 *               codigo_producto:
 *                 type: string
 *                 nullable: true
 *               Precio:
 *                 type: number
 *               Categoria:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Insumo actualizado
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Insumo no encontrado
 *   delete:
 *     summary: Eliminar insumo (Admin)
 *     tags: [Admin - Insumos]
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
 *         description: Insumo eliminado
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', updateInsumo);
router.delete('/:id', deleteInsumo);

export default router;
