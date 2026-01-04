import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { getUsuarios, createUsuario, updateUsuario, toggleUsuario, deleteUsuario } from '../controllers/adminUsuariosController';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateUsuarioId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de usuario debe ser un número válido' });
  }
  next();
};

const validateUsuarioData = (req: Request, res: Response, next: NextFunction) => {
  const { username, password, rol, sucursal_id } = req.body;
  
  if (!username?.trim()) {
    return res.status(400).json({ error: 'Username es requerido' });
  }
  
  if (!password?.trim()) {
    return res.status(400).json({ error: 'Password es requerido' });
  }
  
  if (!rol?.trim()) {
    return res.status(400).json({ error: 'Rol es requerido' });
  }
  
  if (!sucursal_id || isNaN(parseInt(sucursal_id))) {
    return res.status(400).json({ error: 'Sucursal válida es requerida' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/admin/usuarios:
 *   get:
 *     tags: [Admin - Usuarios]
 *     summary: Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/usuarios', authenticateToken, requireSuperAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando usuarios', { usuario: req.user.id });
  const resultado = await getUsuarios(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/admin/usuarios:
 *   post:
 *     tags: [Admin - Usuarios]
 *     summary: Crear nuevo usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, rol, sucursal_id]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [usuario, gerencia_administrativa, gerencia_prestacional, gerencia_general, admin]
 *               sucursal_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/usuarios', authenticateToken, requireSuperAdmin, validateUsuarioData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { username, rol, sucursal_id } = req.body;
  
  logger.info('Creando usuario', { username, rol, sucursal_id, creador: req.user.id });
  const resultado = await createUsuario(req, res, () => {});
  
  logger.info('Usuario creado exitosamente', { 
    username, 
    rol, 
    sucursal_id, 
    creador: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/usuarios/{id}:
 *   put:
 *     tags: [Admin - Usuarios]
 *     summary: Actualizar usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *               sucursal_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/usuarios/:id', authenticateToken, requireSuperAdmin, validateUsuarioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Actualizando usuario', { usuarioId: id, editor: req.user.id });
  const resultado = await updateUsuario(req, res, () => {});
  
  logger.info('Usuario actualizado exitosamente', { 
    usuarioId: id, 
    editor: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/usuarios/{id}/toggle:
 *   put:
 *     tags: [Admin - Usuarios]
 *     summary: Activar/Desactivar usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/usuarios/:id/toggle', authenticateToken, requireSuperAdmin, validateUsuarioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Cambiando estado de usuario', { usuarioId: id, editor: req.user.id });
  const resultado = await toggleUsuario(req, res, () => {});
  
  logger.info('Estado de usuario cambiado exitosamente', { 
    usuarioId: id, 
    editor: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/usuarios/{id}:
 *   delete:
 *     tags: [Admin - Usuarios]
 *     summary: Eliminar usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/usuarios/:id', authenticateToken, requireSuperAdmin, validateUsuarioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Eliminando usuario', { usuarioId: id, eliminador: req.user.id });
  const resultado = await deleteUsuario(req, res, () => {});
  
  logger.info('Usuario eliminado exitosamente', { 
    usuarioId: id, 
    eliminador: req.user.id 
  });
  
  return resultado;
}));

export default router;
