import { Router } from 'express';
import { obtenerAlertasServicios, actualizarAlertaServicio, crearAlertaServicio } from '../controllers/alertasServiciosController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, obtenerAlertasServicios);
router.put('/:id', authenticateToken, requireAdmin, actualizarAlertaServicio);
router.post('/', authenticateToken, requireAdmin, crearAlertaServicio);

export default router;
