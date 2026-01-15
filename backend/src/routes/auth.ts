import { Router, Request, Response, NextFunction } from 'express';
import { login, verifyToken } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateLoginData = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  
  if (!username?.trim()) {
    return res.status(400).json({ error: 'Username es requerido' });
  }
  
  if (!password?.trim()) {
    return res.status(400).json({ error: 'Password es requerido' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     rol:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validateLoginData, asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body;
  
  logger.info('Intento de login', { username, ip: req.ip });
  
  // Llamar directamente al controlador sin callback
  await login(req, res);
  
  // Solo logear éxito si no hay error
  if (res.statusCode === 200) {
    logger.info('Login exitoso', { username, ip: req.ip });
  }
}));

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido
 */
router.get('/verify', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Verificación de token', { ip: req.ip });
  
  // Llamar directamente al controlador sin callback
  await verifyToken(req, res);
}));

export default router;