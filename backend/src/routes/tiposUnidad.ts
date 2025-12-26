import { Router } from 'express';
import { obtenerTiposUnidad, crearTipoUnidad } from '../controllers/tiposUnidadController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/tipos-unidad:
 *   get:
 *     tags: [Admin - Tipos de Unidad]
 *     summary: Listar tipos de unidad
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de unidad
 */
router.get('/', authenticateToken, obtenerTiposUnidad);

/**
 * @swagger
 * /api/tipos-unidad:
 *   post:
 *     tags: [Admin - Tipos de Unidad]
 *     summary: Crear tipo de unidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo creado
 */
router.post('/', authenticateToken, requireAdmin, crearTipoUnidad);

export default router;
