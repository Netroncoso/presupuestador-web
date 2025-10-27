import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllInsumos, createInsumo, updateInsumo, deleteInsumo } from '../../controllers/admin/adminInsumosController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getAllInsumos);
router.post('/', createInsumo);
router.put('/:id', updateInsumo);
router.delete('/:id', deleteInsumo);

export default router;