import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as presupuestosController from '../controllers/presupuestosControllerV2';

const router = Router();

// Middleware para verificar rol gerencias/admin
const requireAuditor = (req: any, res: any, next: any) => {
  const rolesPermitidos = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general', 'admin'];
  if (!rolesPermitidos.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: Solo gerencias o admins' });
  }
  next();
};

// ============================================
// RUTAS DE AUDITORÍA (específicas primero)
// ============================================
router.get('/auditor/pendientes', auth, requireAuditor, presupuestosController.obtenerPendientes);

// ============================================
// RUTAS DE VERIFICACIÓN DNI (específicas)
// ============================================
router.get('/dni/:dni', auth, presupuestosController.verificarDNI);
router.get('/verificar-dni/:dni', auth, presupuestosController.verificarDNI);

// ============================================
// RUTAS GENERALES DE PRESUPUESTOS
// ============================================
router.get('/', auth, presupuestosController.listarPresupuestos);
router.post('/', auth, presupuestosController.crearPresupuesto);

// ============================================
// RUTAS CON ID DE PRESUPUESTO
// ============================================
// Consultas
router.get('/:id', auth, presupuestosController.obtenerPresupuesto);
router.get('/:id/versiones', auth, presupuestosController.obtenerHistorial);

// Acciones
router.post('/:id/finalizar', auth, presupuestosController.finalizarPresupuesto);
router.post('/:id/version/editar', auth, presupuestosController.crearVersionParaEdicion);

// Actualizaciones
router.put('/:id/prestador', auth, presupuestosController.actualizarPrestador);
router.put('/:id/estado', auth, requireAuditor, presupuestosController.cambiarEstado);

export default router;