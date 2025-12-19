import { Router } from 'express';
import { getPrestadores, getPrestacionesPorPrestador, getPrestadorInfo } from '../controllers/prestacionesController';
import { getValoresPrestadorServicio, guardarValorPrestadorServicio } from '../controllers/prestadorValoresController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Wrapper to handle async errors
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/prestadores', authenticateToken, asyncHandler(getPrestadores));
router.get('/prestador/:id', authenticateToken, asyncHandler(getPrestacionesPorPrestador));
router.get('/prestador/:id/info', authenticateToken, asyncHandler(getPrestadorInfo));

// Rutas para valores históricos
router.get('/servicio/:id/valores', authenticateToken, asyncHandler(getValoresPrestadorServicio));
router.post('/servicio/:id/valores', requireAdmin, asyncHandler(guardarValorPrestadorServicio));

export default router;
