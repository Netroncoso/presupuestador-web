import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { getAllServicios, createServicio, updateServicio, deleteServicio } from '../../controllers/admin/adminServiciosCrudController';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/admin/servicios-crud:
 *   get:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Listar todos los servicios (catálogo base)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios
 */
router.get('/', getAllServicios);

/**
 * @swagger
 * /api/admin/servicios-crud:
 *   post:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Crear nuevo servicio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, tipo_unidad_id]
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo_unidad_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Servicio creado
 */
router.post('/', requireAdmin, csrfProtection, createServicio);

/**
 * @swagger
 * /api/admin/servicios-crud/{id}:
 *   put:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Actualizar servicio
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
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo_unidad_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Servicio actualizado
 */
router.put('/:id', requireAdmin, csrfProtection, updateServicio);

/**
 * @swagger
 * /api/admin/servicios-crud/{id}:
 *   delete:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Eliminar servicio
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
 *         description: Servicio eliminado
 */
router.delete('/:id', requireAdmin, csrfProtection, deleteServicio);

export default router;
