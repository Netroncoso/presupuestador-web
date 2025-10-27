import { Router } from 'express';
import { guardarInsumoPresupuesto, eliminarInsumoPresupuesto, obtenerInsumosPresupuesto } from '../controllers/presupuestoInsumosController';

const router = Router();

router.post('/:id/insumos', guardarInsumoPresupuesto);
router.delete('/:id/insumos', eliminarInsumoPresupuesto);
router.get('/:id/insumos', obtenerInsumosPresupuesto);

export default router;