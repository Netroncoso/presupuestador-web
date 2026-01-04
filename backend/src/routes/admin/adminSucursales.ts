import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllSucursales, updateSucursal } from '../../controllers/admin/adminSucursalesController';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateSucursalId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de sucursal debe ser un número válido' });
  }
  next();
};

const validateSucursalData = (req: Request, res: Response, next: NextFunction) => {
  const { Sucursales_mh, porcentaje_insumos } = req.body;
  
  if (Sucursales_mh !== undefined && !Sucursales_mh?.trim()) {
    return res.status(400).json({ error: 'Nombre de sucursal no puede estar vacío' });
  }
  
  if (porcentaje_insumos !== undefined && (isNaN(parseFloat(porcentaje_insumos)) || parseFloat(porcentaje_insumos) < 0)) {
    return res.status(400).json({ error: 'Porcentaje de insumos debe ser un número válido' });
  }
  
  next();
};

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/sucursales:
 *   get:
 *     summary: Listar todas las sucursales (Admin)
 *     description: Obtiene lista completa de sucursales con porcentajes de margen
 *     tags: [Admin - Sucursales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sucursales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID:
 *                     type: integer
 *                   Sucursales_mh:
 *                     type: string
 *                   porcentaje_insumos:
 *                     type: number
 *                     description: Porcentaje de margen para insumos
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  logger.info('Listando sucursales admin', { usuario: (req as AuthenticatedRequest).user.id });
  getAllSucursales(req, res, next);
});

/**
 * @swagger
 * /api/admin/sucursales/{id}:
 *   put:
 *     summary: Actualizar sucursal (Admin)
 *     description: Actualiza datos de una sucursal (nombre, porcentaje de margen)
 *     tags: [Admin - Sucursales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sucursal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Sucursales_mh:
 *                 type: string
 *                 example: "CABA"
 *               porcentaje_insumos:
 *                 type: number
 *                 example: 20
 *                 description: Porcentaje de margen para insumos (%)
 *     responses:
 *       200:
 *         description: Sucursal actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Sucursal no encontrada
 */
router.put('/:id', validateSucursalId, validateSucursalData, (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  const { Sucursales_mh, porcentaje_insumos } = req.body;
  
  logger.info('Actualizando sucursal', { 
    sucursalId: id, 
    Sucursales_mh, 
    porcentaje_insumos, 
    usuario: (req as AuthenticatedRequest).user.id 
  });
  
  updateSucursal(req, res, next);
  
  logger.info('Sucursal actualizada exitosamente', { 
    sucursalId: id, 
    usuario: (req as AuthenticatedRequest).user.id 
  });
});

export default router;
