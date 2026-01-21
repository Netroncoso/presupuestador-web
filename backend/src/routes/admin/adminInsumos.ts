import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllInsumos, createInsumo, updateInsumo, deleteInsumo, toggleCritico } from '../../controllers/admin/adminInsumosController';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateInsumoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de insumo debe ser un número válido' });
  }
  next();
};

const validateInsumoData = (req: Request, res: Response, next: NextFunction) => {
  const { Producto, Precio, Categoria } = req.body;
  
  if (!Producto?.trim()) {
    return res.status(400).json({ error: 'Nombre del producto es requerido' });
  }
  
  if (!Precio || isNaN(parseFloat(Precio)) || parseFloat(Precio) < 0) {
    return res.status(400).json({ error: 'Precio válido es requerido' });
  }
  
  if (!Categoria?.trim()) {
    return res.status(400).json({ error: 'Categoría es requerida' });
  }
  
  next();
};

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/insumos:
 *   get:
 *     summary: Listar todos los insumos (Admin)
 *     description: Obtiene catálogo completo de insumos para administración
 *     tags: [Admin - Insumos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de insumos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idInsumos:
 *                     type: integer
 *                   Producto:
 *                     type: string
 *                   codigo_producto:
 *                     type: string
 *                     nullable: true
 *                   Precio:
 *                     type: number
 *                   Categoria:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado - Solo admin
 *   post:
 *     summary: Crear nuevo insumo (Admin)
 *     tags: [Admin - Insumos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Producto
 *               - Precio
 *               - Categoria
 *             properties:
 *               Producto:
 *                 type: string
 *                 example: "Guantes de látex (caja x100)"
 *               codigo_producto:
 *                 type: string
 *                 nullable: true
 *                 example: "7798123456789"
 *                 description: Código EAN/SKU
 *               Precio:
 *                 type: number
 *                 example: 2500.00
 *               Categoria:
 *                 type: string
 *                 example: "Descartables"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Insumo creado exitosamente
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando insumos admin', { usuario: req.user.id });
  
  const resultado = await getAllInsumos(req, res, () => {});
  return resultado;
}));

router.post('/', validateInsumoData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { Producto, codigo_producto, Precio, Categoria } = req.body;
  
  logger.info('Creando insumo', { 
    Producto, 
    codigo_producto, 
    Precio, 
    Categoria, 
    usuario: req.user.id 
  });
  
  const resultado = await createInsumo(req, res, () => {});
  
  logger.info('Insumo creado exitosamente', { 
    Producto, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/insumos/{id}:
 *   put:
 *     summary: Actualizar insumo (Admin)
 *     tags: [Admin - Insumos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del insumo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Producto:
 *                 type: string
 *               codigo_producto:
 *                 type: string
 *                 nullable: true
 *               Precio:
 *                 type: number
 *               Categoria:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Insumo actualizado
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Insumo no encontrado
 *   delete:
 *     summary: Eliminar insumo (Admin)
 *     tags: [Admin - Insumos]
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
 *         description: Insumo eliminado
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', validateInsumoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Actualizando insumo', { 
    insumoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await updateInsumo(req, res, () => {});
  
  logger.info('Insumo actualizado exitosamente', { 
    insumoId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

router.delete('/:id', validateInsumoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Eliminando insumo', { 
    insumoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await deleteInsumo(req, res, () => {});
  
  logger.info('Insumo eliminado exitosamente', { 
    insumoId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

router.patch('/:id/critico', validateInsumoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Toggle insumo crítico', { 
    insumoId: id, 
    critico: req.body.critico,
    usuario: req.user.id 
  });
  
  const resultado = await toggleCritico(req, res, () => {});
  return resultado;
}));

export default router;
