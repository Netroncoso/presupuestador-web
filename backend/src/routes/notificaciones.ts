import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as notificacionesController from '../controllers/notificacionesController';

const router = Router();

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtener notificaciones del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', auth, notificacionesController.obtenerNotificaciones);

/**
 * @swagger
 * /api/notificaciones/count:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Contar notificaciones no leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contador de no leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get('/count', auth, notificacionesController.contarNoLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 *   put:
 *     tags: [Notificaciones]
 *     summary: Marcar notificación como leída
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
 *         description: Notificación marcada
 */
router.put('/:id/leer', auth, notificacionesController.marcarComoLeida);

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 *   put:
 *     tags: [Notificaciones]
 *     summary: Marcar todas las notificaciones como leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas marcadas como leídas
 */
router.put('/leer-todas', auth, notificacionesController.marcarTodasLeidas);

export default router;
