import { Router } from 'express';
import { streamUpdates } from '../controllers/sseController';

const router = Router();

/**
 * @swagger
 * /api/stream/updates:
 *   get:
 *     tags: [Sistema - SSE]
 *     summary: Stream de actualizaciones en tiempo real (SSE)
 *     description: Conexión Server-Sent Events para notificaciones y actualizaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stream SSE activo
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.get('/updates', streamUpdates);

export default router;