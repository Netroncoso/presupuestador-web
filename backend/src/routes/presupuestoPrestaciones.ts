import { Router } from 'express';
import { guardarPrestacionPresupuesto, eliminarPrestacionPresupuesto, obtenerPrestacionesPresupuesto } from '../controllers/presupuestoPrestacionesController';

const router = Router();

router.post('/:id/prestaciones', guardarPrestacionPresupuesto);
router.delete('/:id/prestaciones', eliminarPrestacionPresupuesto);
router.get('/:id/prestaciones', obtenerPrestacionesPresupuesto);

export default router;