import { Router, Request, Response } from 'express';
import { authenticateToken, requireGerenciaFinanciera } from '../middleware/auth';
import * as reportesController from '../controllers/reportesFinancierosController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

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
router.get('/kpis', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo KPIs financieros', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerKPIs(req, res, () => {});
  return resultado;
}));

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
router.get('/ranking-financiadores', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo ranking de financiadores', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerRankingFinanciadores(req, res, () => {});
  return resultado;
}));

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
router.get('/ranking-sucursales', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo ranking de sucursales', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerRankingSucursales(req, res, () => {});
  return resultado;
}));

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
router.get('/analisis-costos', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo análisis de costos', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerAnalisisCostos(req, res, () => {});
  return resultado;
}));

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
router.get('/promedios-generales', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo promedios generales', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerPromediosGenerales(req, res, () => {});
  return resultado;
}));

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
router.get('/servicios-por-financiador', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo servicios por financiador', { usuario: req.user.id });
  
  const resultado = await reportesController.obtenerServiciosPorFinanciador(req, res, () => {});
  return resultado;
}));

export default router;
