import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getPrestadoresActivos, getServiciosPorPrestador, createOrUpdateServicioPrestador } from '../../controllers/admin/adminServiciosController';

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
router.get('/prestadores', getPrestadoresActivos);

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
router.get('/prestador/:prestadorId/servicios', getServiciosPorPrestador);

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
router.put('/prestador/:prestadorId/servicio/:servicioId', createOrUpdateServicioPrestador);

export default router;
