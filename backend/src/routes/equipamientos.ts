import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as equipamientosController from '../controllers/equipamientosController';

const router = Router();

// Rutas admin CRUD base
router.get('/admin', authenticateToken, requireAdmin, equipamientosController.getAllEquipamientos);
router.post('/admin', authenticateToken, requireAdmin, equipamientosController.crearEquipamiento);
router.put('/admin/:id', authenticateToken, requireAdmin, equipamientosController.actualizarEquipamiento);
router.delete('/admin/:id', authenticateToken, requireAdmin, equipamientosController.eliminarEquipamiento);

// Rutas tipos
router.get('/tipos', authenticateToken, equipamientosController.getTiposEquipamiento);
router.post('/tipos', authenticateToken, requireAdmin, equipamientosController.crearTipoEquipamiento);

// Rutas admin acuerdos
router.get('/admin/financiador/:id', authenticateToken, requireAdmin, equipamientosController.getEquipamientosPorFinanciadorAdmin);
router.put('/admin/acuerdo/:id', authenticateToken, requireAdmin, equipamientosController.actualizarAcuerdoEquipamiento);
router.post('/admin/:id/valores', authenticateToken, requireAdmin, equipamientosController.agregarValorEquipamientoAdmin);
router.get('/admin/:id/valores', authenticateToken, requireAdmin, equipamientosController.getValoresEquipamientoAdmin);

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
