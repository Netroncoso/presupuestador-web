import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllSucursales, updateSucursal } from '../../controllers/admin/adminSucursalesController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getAllSucursales);
router.put('/:id', updateSucursal);

export default router;