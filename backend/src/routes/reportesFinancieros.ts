import { Router } from 'express';
import { authenticateToken, requireGerenciaFinanciera } from '../middleware/auth';
import * as reportesController from '../controllers/reportesFinancierosController';

const router = Router();

router.use(authenticateToken);
router.use(requireGerenciaFinanciera);

router.get('/kpis', reportesController.obtenerKPIs);
router.get('/ranking-financiadores', reportesController.obtenerRankingFinanciadores);
router.get('/ranking-sucursales', reportesController.obtenerRankingSucursales);
router.get('/analisis-costos', reportesController.obtenerAnalisisCostos);
router.get('/promedios-generales', reportesController.obtenerPromediosGenerales);
router.get('/servicios-por-financiador', reportesController.obtenerServiciosPorFinanciador);

export default router;
