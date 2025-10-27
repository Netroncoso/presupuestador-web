import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllServicios, createServicio, updateServicio, deleteServicio } from '../../controllers/admin/adminServiciosCrudController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getAllServicios);
router.post('/', createServicio);
router.put('/:id', updateServicio);
router.delete('/:id', deleteServicio);

export default router;