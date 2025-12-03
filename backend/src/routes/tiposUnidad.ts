import { Router } from 'express';
import { obtenerTiposUnidad, crearTipoUnidad } from '../controllers/tiposUnidadController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, obtenerTiposUnidad);
router.post('/', authenticateToken, requireAdmin, crearTipoUnidad);

export default router;
