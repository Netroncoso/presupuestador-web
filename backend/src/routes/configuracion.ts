import { Router } from 'express';
import { obtenerConfiguracion, actualizarConfiguracion, actualizarMultiple } from '../controllers/configuracionController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, obtenerConfiguracion);
router.put('/', authenticateToken, requireSuperAdmin, actualizarConfiguracion);
router.put('/multiple', authenticateToken, requireSuperAdmin, actualizarMultiple);

export default router;
