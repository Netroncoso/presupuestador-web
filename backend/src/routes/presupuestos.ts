import { Router } from 'express';
import { crearPresupuesto, actualizarTotales, actualizarPrestador, verificarDNI, obtenerPresupuesto, guardarVersion } from '../controllers/presupuestosController';

const router = Router();

router.get('/verificar-dni/:dni', verificarDNI);
router.get('/:id', obtenerPresupuesto);
router.post('/', crearPresupuesto);
router.post('/:id/guardar-version', guardarVersion);
router.put('/:id/totales', actualizarTotales);
router.put('/:id/prestador', actualizarPrestador);

export default router;
