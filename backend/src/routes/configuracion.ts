import { Router } from 'express';
import { obtenerConfiguracion, actualizarConfiguracion, actualizarMultiple } from '../controllers/configuracionController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/configuracion:
 *   get:
 *     summary: Obtener configuración del sistema
 *     description: Obtiene reglas de negocio y umbrales de auditoría
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración actual
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   clave:
 *                     type: string
 *                     example: "rentabilidad_minima"
 *                   valor:
 *                     type: string
 *                     example: "15"
 *                   descripcion:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                     enum: [number, string, boolean]
 *   put:
 *     summary: Actualizar configuración (Super Admin)
 *     description: Actualiza una regla de negocio específica
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clave
 *               - valor
 *             properties:
 *               clave:
 *                 type: string
 *                 example: "rentabilidad_minima"
 *               valor:
 *                 type: string
 *                 example: "15"
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       403:
 *         description: Acceso denegado - Solo super admin
 */
router.get('/', authenticateToken, obtenerConfiguracion);
router.put('/', authenticateToken, requireSuperAdmin, actualizarConfiguracion);

/**
 * @swagger
 * /api/configuracion/multiple:
 *   put:
 *     summary: Actualizar múltiples configuraciones (Super Admin)
 *     description: Actualiza varias reglas de negocio a la vez
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configuraciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     clave:
 *                       type: string
 *                     valor:
 *                       type: string
 *                 example:
 *                   - clave: "rentabilidad_minima"
 *                     valor: "15"
 *                   - clave: "costo_total_maximo"
 *                     valor: "150000"
 *     responses:
 *       200:
 *         description: Configuraciones actualizadas
 *       403:
 *         description: Acceso denegado - Solo super admin
 */
router.put('/multiple', authenticateToken, requireSuperAdmin, actualizarMultiple);

export default router;
