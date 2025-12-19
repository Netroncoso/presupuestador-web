import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { getUsuarios, createUsuario, updateUsuario, toggleUsuario, deleteUsuario } from '../controllers/adminUsuariosController';

const router = Router();

router.get('/usuarios', authenticateToken, requireSuperAdmin, getUsuarios);
router.post('/usuarios', authenticateToken, requireSuperAdmin, csrfProtection, createUsuario);
router.put('/usuarios/:id', authenticateToken, requireSuperAdmin, csrfProtection, updateUsuario);
router.put('/usuarios/:id/toggle', authenticateToken, requireSuperAdmin, csrfProtection, toggleUsuario);
router.delete('/usuarios/:id', authenticateToken, requireSuperAdmin, csrfProtection, deleteUsuario);

export default router;