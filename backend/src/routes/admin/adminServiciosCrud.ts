import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { csrfProtection } from '../../middleware/csrf';
import { getAllServicios, createServicio, updateServicio, deleteServicio } from '../../controllers/admin/adminServiciosCrudController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET is accessible to all authenticated users (needed for filters)
router.get('/', getAllServicios);

// Write operations require admin
router.post('/', requireAdmin, csrfProtection, createServicio);
router.put('/:id', requireAdmin, csrfProtection, updateServicio);
router.delete('/:id', requireAdmin, csrfProtection, deleteServicio);

export default router;