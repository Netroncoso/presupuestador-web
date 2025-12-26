import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { getUsuarios, createUsuario, updateUsuario, toggleUsuario, deleteUsuario } from '../controllers/adminUsuariosController';

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
router.get('/usuarios', authenticateToken, requireSuperAdmin, getUsuarios);

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
router.post('/usuarios', authenticateToken, requireSuperAdmin, csrfProtection, createUsuario);

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
router.put('/usuarios/:id', authenticateToken, requireSuperAdmin, csrfProtection, updateUsuario);

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
router.put('/usuarios/:id/toggle', authenticateToken, requireSuperAdmin, csrfProtection, toggleUsuario);

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
router.delete('/usuarios/:id', authenticateToken, requireSuperAdmin, csrfProtection, deleteUsuario);

export default router;
