import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as equipamientosController from '../controllers/equipamientosController';

const router = Router();

// Rutas públicas (requieren autenticación)
router.get('/', authenticateToken, equipamientosController.getEquipamientos);
router.get('/financiador/:id', authenticateToken, equipamientosController.getEquipamientosPorFinanciador);

// Rutas de valores históricos
router.get('/acuerdo/:id/valores', authenticateToken, equipamientosController.getValoresEquipamiento);
router.post('/acuerdo/:id/valores', authenticateToken, requireAdmin, equipamientosController.guardarValorEquipamiento);

// Rutas de presupuesto
router.post('/presupuesto/:id', authenticateToken, equipamientosController.agregarEquipamientoPresupuesto);
router.delete('/presupuesto/:id/:equipamientoId', authenticateToken, equipamientosController.eliminarEquipamientoPresupuesto);
router.get('/presupuesto/:id', authenticateToken, equipamientosController.getEquipamientosPresupuesto);

export default router;
