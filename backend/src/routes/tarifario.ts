// ============================================================================
// ROUTES: TARIFARIO
// ============================================================================

import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as tarifarioController from '../controllers/tarifarioController';
import * as zonasController from '../controllers/zonasController';
import * as prestacionesTarifarioController from '../controllers/prestacionesTarifarioController';

const router = express.Router();

// ============================================================================
// SERVICIOS DEL TARIFARIO
// ============================================================================

/**
 * @swagger
 * /api/tarifario-servicio/activos:
 *   get:
 *     summary: Listar servicios activos del tarifario
 *     tags: [Tarifario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios activos
 */
router.get('/tarifario-servicio/activos', authenticateToken, tarifarioController.listarServiciosActivos);

/**
 * @swagger
 * /api/tarifario-servicio/{id}/valores-vigentes:
 *   get:
 *     summary: Obtener valores vigentes de un servicio por zona
 *     tags: [Tarifario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: zona_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 5 valores vigentes con alertas
 */
router.get('/tarifario-servicio/:id/valores-vigentes', authenticateToken, tarifarioController.obtenerValoresVigentes);

/**
 * @swagger
 * /api/tarifario-servicio/markup:
 *   get:
 *     summary: Obtener markup configurado
 *     tags: [Tarifario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Porcentaje de markup
 */
router.get('/tarifario-servicio/markup', authenticateToken, tarifarioController.obtenerMarkup);

// ============================================================================
// ZONAS
// ============================================================================

/**
 * @swagger
 * /api/sucursales/{id}/zonas:
 *   get:
 *     summary: Obtener zonas de una sucursal
 *     tags: [Tarifario]
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
 *         description: Lista de zonas de la sucursal
 */
router.get('/sucursales/:id/zonas', authenticateToken, zonasController.obtenerZonasPorSucursal);

// ============================================================================
// PRESTACIONES TARIFARIO EN PRESUPUESTOS
// ============================================================================

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones-tarifario:
 *   get:
 *     summary: Listar prestaciones del tarifario de un presupuesto
 *     tags: [Presupuestos]
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
 *         description: Lista de prestaciones del tarifario
 */
router.get('/presupuestos/:id/prestaciones-tarifario', authenticateToken, prestacionesTarifarioController.listarPrestacionesTarifario);

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones-tarifario:
 *   post:
 *     summary: Agregar prestación del tarifario a un presupuesto
 *     tags: [Presupuestos]
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
 *             required:
 *               - tarifario_servicio_id
 *               - cantidad
 *               - zona_id
 *               - orden_costo
 *             properties:
 *               tarifario_servicio_id:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *               zona_id:
 *                 type: integer
 *               orden_costo:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               valor_asignado:
 *                 type: number
 *                 description: Opcional - para edición manual
 *     responses:
 *       201:
 *         description: Prestación agregada exitosamente
 */
router.post('/presupuestos/:id/prestaciones-tarifario', authenticateToken, prestacionesTarifarioController.agregarPrestacionTarifario);

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones-tarifario/{itemId}:
 *   delete:
 *     summary: Eliminar prestación del tarifario
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prestación eliminada exitosamente
 */
router.delete('/presupuestos/:id/prestaciones-tarifario/:itemId', authenticateToken, prestacionesTarifarioController.eliminarPrestacionTarifario);
router.put('/presupuestos/:id/prestaciones-tarifario/:itemId', authenticateToken, prestacionesTarifarioController.actualizarPrestacionTarifario);

export default router;
