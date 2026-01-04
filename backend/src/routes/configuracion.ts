import { Router, Request, Response, NextFunction } from 'express';
import { obtenerConfiguracion, actualizarConfiguracion, actualizarMultiple } from '../controllers/configuracionController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateConfiguracion = (req: Request, res: Response, next: NextFunction) => {
  const { clave, valor } = req.body;
  
  if (!clave?.trim()) {
    return res.status(400).json({ error: 'Clave de configuración es requerida' });
  }
  
  if (valor === undefined || valor === null) {
    return res.status(400).json({ error: 'Valor de configuración es requerido' });
  }
  
  next();
};

const validateConfiguracionMultiple = (req: Request, res: Response, next: NextFunction) => {
  const { configuraciones } = req.body;
  
  if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
    return res.status(400).json({ error: 'Array de configuraciones es requerido' });
  }
  
  for (const config of configuraciones) {
    if (!config.clave?.trim()) {
      return res.status(400).json({ error: 'Todas las configuraciones deben tener clave' });
    }
    if (config.valor === undefined || config.valor === null) {
      return res.status(400).json({ error: 'Todas las configuraciones deben tener valor' });
    }
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/configuracion:
 *   get:
 *     summary: Obtener configuración del sistema
 *     description: Obtiene reglas de negocio y umbrales de auditoría
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración actual
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   clave:
 *                     type: string
 *                     example: "rentabilidad_minima"
 *                   valor:
 *                     type: string
 *                     example: "15"
 *                   descripcion:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                     enum: [number, string, boolean]
 *   put:
 *     summary: Actualizar configuración (Super Admin)
 *     description: Actualiza una regla de negocio específica
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clave
 *               - valor
 *             properties:
 *               clave:
 *                 type: string
 *                 example: "rentabilidad_minima"
 *               valor:
 *                 type: string
 *                 example: "15"
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       403:
 *         description: Acceso denegado - Solo super admin
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo configuración del sistema', { usuario: req.user.id });
  const resultado = await obtenerConfiguracion(req, res, () => {});
  return resultado;
}));

router.put('/', authenticateToken, requireSuperAdmin, validateConfiguracion, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { clave, valor } = req.body;
  
  logger.info('Actualizando configuración', { clave, valor, usuario: req.user.id });
  const resultado = await actualizarConfiguracion(req, res, () => {});
  
  logger.info('Configuración actualizada exitosamente', { 
    clave, 
    valor, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/configuracion/multiple:
 *   put:
 *     summary: Actualizar múltiples configuraciones (Super Admin)
 *     description: Actualiza varias reglas de negocio a la vez
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               configuraciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     clave:
 *                       type: string
 *                     valor:
 *                       type: string
 *                 example:
 *                   - clave: "rentabilidad_minima"
 *                     valor: "15"
 *                   - clave: "costo_total_maximo"
 *                     valor: "150000"
 *     responses:
 *       200:
 *         description: Configuraciones actualizadas
 *       403:
 *         description: Acceso denegado - Solo super admin
 */
router.put('/multiple', authenticateToken, requireSuperAdmin, validateConfiguracionMultiple, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { configuraciones } = req.body;
  
  logger.info('Actualizando configuraciones múltiples', { 
    cantidad: configuraciones.length, 
    claves: configuraciones.map((c: any) => c.clave),
    usuario: req.user.id 
  });
  
  const resultado = await actualizarMultiple(req, res, () => {});
  
  logger.info('Configuraciones múltiples actualizadas exitosamente', { 
    cantidad: configuraciones.length, 
    claves: configuraciones.map((c: any) => c.clave),
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
