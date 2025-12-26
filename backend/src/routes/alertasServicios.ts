import { Router } from 'express';
import { obtenerAlertasServicios, actualizarAlertaServicio, crearAlertaServicio } from '../controllers/alertasServiciosController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/alertas-servicios:
 *   get:
 *     summary: Obtener alertas de servicios
 *     description: Lista configuración de alertas por tipo de unidad (horas, sesiones, días, etc.)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas configuradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tipo_unidad:
 *                     type: string
 *                   cantidad_maxima:
 *                     type: integer
 *                   mensaje_alerta:
 *                     type: string
 *                   color_alerta:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *   post:
 *     summary: Crear alerta de servicio (Admin)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_unidad
 *               - cantidad_maxima
 *               - mensaje_alerta
 *             properties:
 *               tipo_unidad:
 *                 type: string
 *                 example: "horas"
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 24
 *               mensaje_alerta:
 *                 type: string
 *                 example: "Cantidad elevada de horas - Verificar necesidad"
 *               color_alerta:
 *                 type: string
 *                 enum: [orange, red, yellow]
 *                 example: "orange"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Alerta creada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', authenticateToken, obtenerAlertasServicios);
router.post('/', authenticateToken, requireAdmin, crearAlertaServicio);

/**
 * @swagger
 * /api/alertas-servicios/{id}:
 *   put:
 *     summary: Actualizar alerta de servicio (Admin)
 *     tags: [Alertas]
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
 *               cantidad_maxima:
 *                 type: integer
 *               mensaje_alerta:
 *                 type: string
 *               color_alerta:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', authenticateToken, requireAdmin, actualizarAlertaServicio);

export default router;
