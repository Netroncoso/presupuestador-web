import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as presupuestosController from '../controllers/presupuestosControllerV2';

const router = Router();

// Middleware para verificar rol auditor/admin
const requireAuditor = (req: any, res: any, next: any) => {
  if (!['auditor_medico', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: Solo auditores o admins' });
  }
  next();
};

// Rutas específicas PRIMERO (antes de rutas con parámetros)
router.get('/auditor/pendientes', auth, requireAuditor, presupuestosController.obtenerPendientes);
router.get('/dni/:dni', auth, presupuestosController.verificarDNI);
router.get('/verificar-dni/:dni', auth, presupuestosController.verificarDNI);

// Rutas generales
router.get('/', auth, presupuestosController.listarPresupuestos);
router.post('/', auth, presupuestosController.crearPresupuesto);

// Rutas con parámetros ID
router.get('/:id', auth, presupuestosController.obtenerPresupuesto);
router.get('/:id/historial', auth, presupuestosController.obtenerHistorial);
router.post('/:id/finalizar', auth, presupuestosController.finalizarPresupuesto);
router.post('/:id/editar', auth, presupuestosController.crearVersionParaEdicion);
router.post('/:id/guardar-version', auth, presupuestosController.guardarVersion);
router.put('/:id/prestador', auth, presupuestosController.actualizarPrestador);
router.put('/:id/estado', auth, requireAuditor, presupuestosController.cambiarEstado);

export default router;