import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllServicios, createServicio, updateServicio, deleteServicio } from '../../controllers/admin/adminServiciosCrudController';
import { asyncHandler } from '../../utils/asyncHandler';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateServicioId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de servicio debe ser un número válido' });
  }
  next();
};

const validateServicioData = (req: Request, res: Response, next: NextFunction) => {
  const { nombre, tipo_unidad_id } = req.body;
  
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre es requerido' });
  }
  
  if (!tipo_unidad_id || isNaN(parseInt(tipo_unidad_id))) {
    return res.status(400).json({ error: 'Tipo de unidad válido es requerido' });
  }
  
  next();
};

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/admin/servicios-crud:
 *   get:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Listar todos los servicios (catálogo base)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de servicios
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando servicios CRUD', { usuario: req.user.id });
  
  const resultado = await getAllServicios(req, res);
  return resultado;
}));

/**
 * @swagger
 * /api/admin/servicios-crud:
 *   post:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Crear nuevo servicio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, tipo_unidad_id]
 *             properties:
 *               nombre:
 *                 type: string
 *               tipo_unidad_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Servicio creado
 */
router.post('/', requireAdmin, validateServicioData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { nombre, tipo_unidad_id } = req.body;
  
  logger.info('Creando servicio', { 
    nombre, 
    tipo_unidad_id, 
    usuario: req.user.id 
  });
  
  const resultado = await createServicio(req, res);
  
  logger.info('Servicio creado exitosamente', { 
    nombre, 
    tipo_unidad_id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/servicios-crud/{id}:
 *   put:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Actualizar servicio
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
 *               nombre:
 *                 type: string
 *               tipo_unidad_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Servicio actualizado
 */
router.put('/:id', requireAdmin, validateServicioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { nombre, tipo_unidad_id } = req.body;
  
  logger.info('Actualizando servicio', { 
    servicioId: id, 
    nombre, 
    tipo_unidad_id, 
    usuario: req.user.id 
  });
  
  const resultado = await updateServicio(req, res);
  
  logger.info('Servicio actualizado exitosamente', { 
    servicioId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/admin/servicios-crud/{id}:
 *   delete:
 *     tags: [Admin - Servicios CRUD]
 *     summary: Eliminar servicio
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
 *         description: Servicio eliminado
 */
router.delete('/:id', requireAdmin, validateServicioId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Eliminando servicio', { 
    servicioId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await deleteServicio(req, res);
  
  logger.info('Servicio eliminado exitosamente', { 
    servicioId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
