import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { getUsuarios, createUsuario, updateUsuario, toggleUsuario, deleteUsuario } from '../controllers/adminUsuariosController';

const router = Router();

router.get('/usuarios', authenticateToken, requireSuperAdmin, getUsuarios);
router.post('/usuarios', authenticateToken, requireSuperAdmin, createUsuario);
router.put('/usuarios/:id', authenticateToken, requireSuperAdmin, updateUsuario);
router.put('/usuarios/:id/toggle', authenticateToken, requireSuperAdmin, toggleUsuario);
router.delete('/usuarios/:id', authenticateToken, requireSuperAdmin, deleteUsuario);

export default router;