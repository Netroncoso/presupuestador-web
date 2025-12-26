import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as alertasEquipamientosController from '../controllers/alertasEquipamientosController';

const router = Router();

/**
 * @swagger
 * /api/alertas-equipamientos:
 *   get:
 *     summary: Obtener alertas de equipamientos (Admin)
 *     description: Lista configuración de alertas por tipo de equipamiento
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas de equipamientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                     description: Tipo de equipamiento
 *                   cantidad_maxima:
 *                     type: integer
 *                     nullable: true
 *                   mensaje_alerta:
 *                     type: string
 *                     nullable: true
 *                   color_alerta:
 *                     type: string
 *                   activo_alerta:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', authenticateToken, requireAdmin, alertasEquipamientosController.obtenerAlertasEquipamientos);

/**
 * @swagger
 * /api/alertas-equipamientos/{id}:
 *   put:
 *     summary: Actualizar alerta de equipamiento (Admin)
 *     description: Actualiza configuración de alerta para un tipo de equipamiento
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de equipamiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 5
 *               mensaje_alerta:
 *                 type: string
 *                 example: "Alto consumo de oxígeno - Paciente complejo"
 *               color_alerta:
 *                 type: string
 *                 enum: [orange, red, yellow]
 *                 example: "orange"
 *               activo_alerta:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', authenticateToken, requireAdmin, alertasEquipamientosController.actualizarAlertaEquipamiento);

export default router;
