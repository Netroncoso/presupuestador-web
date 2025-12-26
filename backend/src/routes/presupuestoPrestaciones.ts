import { Router } from 'express';
import { guardarPrestacionPresupuesto, eliminarPrestacionPresupuesto, obtenerPrestacionesPresupuesto } from '../controllers/presupuestoPrestacionesController';

const router = Router();

/**
 * @swagger
 * /api/presupuesto-prestaciones/{id}:
 *   get:
 *     tags: [Presupuestos - Items]
 *     summary: Obtener prestaciones de un presupuesto
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
 *         description: Lista de prestaciones del presupuesto
 */
router.get('/:id', obtenerPrestacionesPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones:
 *   post:
 *     tags: [Presupuestos - Items]
 *     summary: Agregar prestación a presupuesto
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
 *             required: [prestador_servicio_id, cantidad, valor_asignado, valor_facturar]
 *             properties:
 *               prestador_servicio_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               valor_asignado:
 *                 type: number
 *               valor_facturar:
 *                 type: number
 *     responses:
 *       201:
 *         description: Prestación agregada
 */
router.post('/:id/prestaciones', guardarPrestacionPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones:
 *   delete:
 *     tags: [Presupuestos - Items]
 *     summary: Eliminar prestación de presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: prestador_servicio_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prestación eliminada
 */
router.delete('/:id/prestaciones', eliminarPrestacionPresupuesto);

router.get('/:id/prestaciones', obtenerPrestacionesPresupuesto);

export default router;
