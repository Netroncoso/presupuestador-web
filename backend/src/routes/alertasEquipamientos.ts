import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as alertasEquipamientosController from '../controllers/alertasEquipamientosController';

const router = Router();

router.get('/', authenticateToken, requireAdmin, alertasEquipamientosController.obtenerAlertasEquipamientos);
router.put('/:id', authenticateToken, requireAdmin, alertasEquipamientosController.actualizarAlertaEquipamiento);

export default router;
