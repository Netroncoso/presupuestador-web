import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllPrestadores, updatePrestador } from '../../controllers/admin/adminPrestadoresController';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getAllPrestadores);
router.put('/:id', updatePrestador);

export default router;