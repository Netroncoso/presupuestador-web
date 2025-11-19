import { Router } from 'express';
import { crearPresupuesto, actualizarTotales, actualizarPrestador, verificarDNI, obtenerPresupuesto, guardarVersion, listarPresupuestos, obtenerHistorial } from '../controllers/presupuestosController';
import { validateDNIMiddleware } from '../middleware/validateDNI';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, listarPresupuestos);
router.get('/verificar-dni/:dni', authenticateToken, validateDNIMiddleware, verificarDNI);
router.get('/:id/historial', authenticateToken, obtenerHistorial);
router.get('/:id', authenticateToken, obtenerPresupuesto);
router.post('/', authenticateToken, validateDNIMiddleware, crearPresupuesto);
router.post('/:id/guardar-version', authenticateToken, guardarVersion);
router.put('/:id/totales', authenticateToken, actualizarTotales);
router.put('/:id/prestador', authenticateToken, actualizarPrestador);

export default router;
