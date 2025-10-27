import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getPrestadoresActivos, getServiciosPorPrestador, createOrUpdateServicioPrestador } from '../../controllers/admin/adminServiciosController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/prestadores', getPrestadoresActivos);
router.get('/prestador/:prestadorId/servicios', getServiciosPorPrestador);
router.put('/prestador/:prestadorId/servicio/:servicioId', createOrUpdateServicioPrestador);

export default router;