import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllPrestadores, updatePrestador, getAcuerdos } from '../../controllers/admin/adminPrestadoresController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/prestadores:
 *   get:
 *     summary: Listar todos los financiadores (Admin)
 *     description: Obtiene lista completa de financiadores/obras sociales
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de financiadores
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
 *                   tasa_mensual:
 *                     type: number
 *                   dias_cobranza_teorico:
 *                     type: integer
 *                   dias_cobranza_real:
 *                     type: integer
 *                   acuerdo_asignado:
 *                     type: string
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', getAllPrestadores);

/**
 * @swagger
 * /api/admin/prestadores/acuerdos:
 *   get:
 *     summary: Obtener tipos de acuerdos disponibles
 *     description: Lista los tipos de acuerdos que se pueden asignar a financiadores
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de acuerdos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["80%", "90%", "100%", "110%", "120%"]
 */
router.get('/acuerdos', getAcuerdos);

/**
 * @swagger
 * /api/admin/prestadores/{id}:
 *   put:
 *     summary: Actualizar financiador (Admin)
 *     description: Actualiza datos de un financiador/obra social
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Financiador:
 *                 type: string
 *                 example: "OSDE"
 *               tasa_mensual:
 *                 type: number
 *                 example: 3.5
 *                 description: Tasa de interés mensual (%)
 *               dias_cobranza_teorico:
 *                 type: integer
 *                 example: 30
 *               dias_cobranza_real:
 *                 type: integer
 *                 example: 45
 *               acuerdo_asignado:
 *                 type: string
 *                 example: "100%"
 *     responses:
 *       200:
 *         description: Financiador actualizado
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Financiador no encontrado
 */
router.put('/:id', updatePrestador);

export default router;
