import { Router } from 'express';
import { guardarInsumoPresupuesto, eliminarInsumoPresupuesto, obtenerInsumosPresupuesto } from '../controllers/presupuestoInsumosController';

const router = Router();

/**
 * @swagger
 * /api/presupuesto-insumos/{id}:
 *   get:
 *     tags: [Presupuestos - Items]
 *     summary: Obtener insumos de un presupuesto
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
 *         description: Lista de insumos del presupuesto
 */
router.get('/:id', obtenerInsumosPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/insumos:
 *   post:
 *     tags: [Presupuestos - Items]
 *     summary: Agregar insumo a presupuesto
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
 *             required: [insumo_id, cantidad, costo, precio_facturar]
 *             properties:
 *               insumo_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               costo:
 *                 type: number
 *               precio_facturar:
 *                 type: number
 *               porcentaje_aplicado:
 *                 type: number
 *     responses:
 *       201:
 *         description: Insumo agregado
 */
router.post('/:id/insumos', guardarInsumoPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/insumos:
 *   delete:
 *     tags: [Presupuestos - Items]
 *     summary: Eliminar insumo de presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: insumo_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo eliminado
 */
router.delete('/:id/insumos', eliminarInsumoPresupuesto);

router.get('/:id/insumos', obtenerInsumosPresupuesto);

export default router;
