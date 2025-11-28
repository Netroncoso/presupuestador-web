import { Router } from 'express';
import { getPrestadores, getPrestacionesPorPrestador, getPrestadorInfo } from '../controllers/prestacionesController';
import { getValoresPrestadorServicio, guardarValorPrestadorServicio } from '../controllers/prestadorValoresController';

const router = Router();

// Wrapper to handle async errors
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/prestadores', asyncHandler(getPrestadores));
router.get('/prestador/:id', asyncHandler(getPrestacionesPorPrestador));
router.get('/prestador/:id/info', asyncHandler(getPrestadorInfo));

// Rutas para valores históricos
router.get('/servicio/:id/valores', asyncHandler(getValoresPrestadorServicio));
router.post('/servicio/:id/valores', asyncHandler(guardarValorPrestadorServicio));

export default router;
