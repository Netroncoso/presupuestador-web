import { Router } from 'express';
import { authenticateToken, requireGerenciaFinanciera } from '../middleware/auth';
import * as reportesController from '../controllers/reportesFinancierosController';

const router = Router();

router.use(authenticateToken);
router.use(requireGerenciaFinanciera);

/**
 * @swagger
 * /api/reportes/financiero/kpis:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Obtener KPIs principales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs del sistema
 */
router.get('/kpis', reportesController.obtenerKPIs);

/**
 * @swagger
 * /api/reportes/financiero/ranking-financiadores:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Ranking de financiadores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranking por volumen
 */
router.get('/ranking-financiadores', reportesController.obtenerRankingFinanciadores);

/**
 * @swagger
 * /api/reportes/financiero/ranking-sucursales:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Ranking de sucursales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranking por sucursal
 */
router.get('/ranking-sucursales', reportesController.obtenerRankingSucursales);

/**
 * @swagger
 * /api/reportes/financiero/analisis-costos:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Análisis de costos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Análisis detallado
 */
router.get('/analisis-costos', reportesController.obtenerAnalisisCostos);

/**
 * @swagger
 * /api/reportes/financiero/promedios-generales:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Promedios generales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Promedios del sistema
 */
router.get('/promedios-generales', reportesController.obtenerPromediosGenerales);

/**
 * @swagger
 * /api/reportes/financiero/servicios-por-financiador:
 *   get:
 *     tags: [Reportes Financieros]
 *     summary: Servicios por financiador
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalle de servicios
 */
router.get('/servicios-por-financiador', reportesController.obtenerServiciosPorFinanciador);

export default router;
