import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as equipamientosController from '../controllers/equipamientosController';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateAcuerdoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  // Permitir 0 para crear nuevos acuerdos, pero no negativos o NaN
  if (isNaN(id) || id < 0) {
    return res.status(400).json({ error: 'ID de acuerdo debe ser un número válido' });
  }
  next();
};

const validateEquipamientoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de equipamiento debe ser un número válido' });
  }
  next();
};

const validateFinanciadorId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de financiador debe ser un número válido' });
  }
  next();
};

const validatePresupuestoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de presupuesto debe ser un número válido' });
  }
  next();
};

const validateEquipamientoData = (req: Request, res: Response, next: NextFunction) => {
  const { nombre, tipo, precio_referencia } = req.body;
  
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre del equipamiento es requerido' });
  }
  
  if (!tipo?.trim()) {
    return res.status(400).json({ error: 'Tipo de equipamiento es requerido' });
  }
  
  if (!precio_referencia || isNaN(parseFloat(precio_referencia))) {
    return res.status(400).json({ error: 'Precio de referencia válido es requerido' });
  }
  
  next();
};

const router = Router();

// ============================================
// RUTAS ADMIN CRUD BASE
// ============================================

/**
 * @swagger
 * /api/equipamientos/admin:
 *   get:
 *     summary: Listar todos los equipamientos (Admin)
 *     description: Obtiene catálogo completo de equipamientos para administración
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipamientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   precio_referencia:
 *                     type: number
 *                   activo:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado - Solo admin
 *   post:
 *     summary: Crear nuevo equipamiento (Admin)
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *               - precio_referencia
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Cama Articulada Eléctrica"
 *               tipo:
 *                 type: string
 *                 example: "mobiliario"
 *               precio_referencia:
 *                 type: number
 *                 example: 15000.00
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Equipamiento creado
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/admin', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando equipamientos admin', { usuario: req.user.id });
  const resultado = await equipamientosController.getAllEquipamientos(req, res, () => {});
  return resultado;
}));

router.post('/admin', authenticateToken, requireAdmin, validateEquipamientoData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { nombre, tipo, precio_referencia } = req.body;
  
  logger.info('Creando equipamiento', { nombre, tipo, precio_referencia, usuario: req.user.id });
  const resultado = await equipamientosController.crearEquipamiento(req, res, () => {});
  
  logger.info('Equipamiento creado exitosamente', { 
    nombre, 
    tipo, 
    precio_referencia, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/equipamientos/admin/{id}:
 *   put:
 *     summary: Actualizar equipamiento (Admin)
 *     tags: [Equipamientos]
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
 *               tipo:
 *                 type: string
 *               precio_referencia:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Equipamiento actualizado
 *   delete:
 *     summary: Eliminar equipamiento (Admin)
 *     tags: [Equipamientos]
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
 *         description: Equipamiento eliminado
 */
router.put('/admin/:id', authenticateToken, requireAdmin, validateEquipamientoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Actualizando equipamiento', { equipamientoId: id, usuario: req.user.id });
  const resultado = await equipamientosController.actualizarEquipamiento(req, res, () => {});
  
  logger.info('Equipamiento actualizado exitosamente', { 
    equipamientoId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

router.delete('/admin/:id', authenticateToken, requireAdmin, validateEquipamientoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Eliminando equipamiento', { equipamientoId: id, usuario: req.user.id });
  const resultado = await equipamientosController.eliminarEquipamiento(req, res, () => {});
  
  logger.info('Equipamiento eliminado exitosamente', { 
    equipamientoId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

// ============================================
// RUTAS TIPOS
// ============================================

/**
 * @swagger
 * /api/equipamientos/tipos:
 *   get:
 *     summary: Listar tipos de equipamiento
 *     description: Obtiene catálogo de tipos (oxigenoterapia, mobiliario, etc.)
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   cantidad_maxima:
 *                     type: integer
 *                   mensaje_alerta:
 *                     type: string
 *                   activo_alerta:
 *                     type: boolean
 *   post:
 *     summary: Crear tipo de equipamiento (Admin)
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "ventilacion"
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tipo creado
 */
router.get('/tipos', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando tipos de equipamiento', { usuario: req.user.id });
  const resultado = await equipamientosController.getTiposEquipamiento(req, res, () => {});
  return resultado;
}));

router.post('/tipos', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { nombre } = req.body;
  
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre del tipo es requerido' });
  }
  
  logger.info('Creando tipo de equipamiento', { nombre, usuario: req.user.id });
  const resultado = await equipamientosController.crearTipoEquipamiento(req, res, () => {});
  
  logger.info('Tipo de equipamiento creado exitosamente', { 
    nombre, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

// ============================================
// RUTAS ADMIN ACUERDOS
// ============================================

/**
 * @swagger
 * /api/equipamientos/admin/financiador/{id}:
 *   get:
 *     summary: Equipamientos por financiador (Admin)
 *     description: Lista equipamientos con valores vigentes para gestión de acuerdos
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *     responses:
 *       200:
 *         description: Lista de equipamientos con acuerdos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   precio_referencia:
 *                     type: number
 *                   id_financiador_equipamiento:
 *                     type: integer
 *                   valor_asignado_vigente:
 *                     type: number
 *                   count_valores_vigentes:
 *                     type: integer
 */
router.get('/admin/financiador/:id', authenticateToken, requireAdmin, validateFinanciadorId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const financiadorId = parseInt(req.params.id);
  
  logger.info('Listando equipamientos por financiador (admin)', { 
    financiadorId, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.getEquipamientosPorFinanciadorAdmin(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/equipamientos/admin/acuerdo/{id}:
 *   put:
 *     summary: Actualizar estado de acuerdo (Admin)
 *     description: Activa o desactiva acuerdo de equipamiento con financiador
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del acuerdo (financiador_equipamiento)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/admin/acuerdo/:id', authenticateToken, requireAdmin, validateAcuerdoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const acuerdoId = parseInt(req.params.id);
  const { activo } = req.body;
  
  if (typeof activo !== 'boolean' && activo !== 0 && activo !== 1) {
    return res.status(400).json({ error: 'Estado activo debe ser boolean o 0/1' });
  }
  
  logger.info('Actualizando acuerdo equipamiento', { 
    acuerdoId, 
    activo, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.actualizarAcuerdoEquipamiento(req, res, () => {});
  
  logger.info('Acuerdo equipamiento actualizado exitosamente', { 
    acuerdoId, 
    activo, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/equipamientos/admin/{id}/valores:
 *   post:
 *     summary: Agregar valor histórico (Admin)
 *     description: Agrega nuevo valor con fecha de vigencia para equipamiento
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipamiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valor_asignado
 *               - valor_facturar
 *               - fecha_inicio
 *               - financiador_id
 *             properties:
 *               valor_asignado:
 *                 type: number
 *                 example: 12000.00
 *               valor_facturar:
 *                 type: number
 *                 example: 15000.00
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               sucursal_id:
 *                 type: integer
 *                 nullable: true
 *                 description: NULL para todas las sucursales
 *               financiador_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Valor agregado
 *   get:
 *     summary: Obtener valores históricos (Admin)
 *     tags: [Equipamientos]
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
 *         description: Historial de valores
 */
router.post('/admin/:id/valores', authenticateToken, requireAdmin, validateEquipamientoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const equipamientoId = parseInt(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio, financiador_id } = req.body;
  
  if (!valor_asignado || isNaN(parseFloat(valor_asignado))) {
    return res.status(400).json({ error: 'Valor asignado válido es requerido' });
  }
  
  if (!valor_facturar || isNaN(parseFloat(valor_facturar))) {
    return res.status(400).json({ error: 'Valor facturar válido es requerido' });
  }
  
  if (!fecha_inicio) {
    return res.status(400).json({ error: 'Fecha de inicio es requerida' });
  }
  
  if (!financiador_id || isNaN(parseInt(financiador_id))) {
    return res.status(400).json({ error: 'ID de financiador válido es requerido' });
  }
  
  logger.info('Agregando valor histórico equipamiento', { 
    equipamientoId, 
    valor_asignado, 
    valor_facturar, 
    fecha_inicio, 
    financiador_id, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.agregarValorEquipamientoAdmin(req, res, () => {});
  
  logger.info('Valor histórico equipamiento agregado exitosamente', { 
    equipamientoId, 
    financiador_id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

router.get('/admin/:id/valores', authenticateToken, requireAdmin, validateEquipamientoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const equipamientoId = parseInt(req.params.id);
  
  logger.info('Obteniendo valores históricos equipamiento', { 
    equipamientoId, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.getValoresEquipamientoAdmin(req, res, () => {});
  return resultado;
}));

// ============================================
// RUTAS PÚBLICAS (requieren autenticación)
// ============================================

/**
 * @swagger
 * /api/equipamientos:
 *   get:
 *     summary: Listar equipamientos activos
 *     description: Obtiene catálogo de equipamientos activos
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipamientos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   precio_referencia:
 *                     type: number
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Listando equipamientos activos', { usuario: req.user.id });
  const resultado = await equipamientosController.getEquipamientos(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/equipamientos/financiador/{id}:
 *   get:
 *     summary: Equipamientos por financiador
 *     description: Obtiene equipamientos con valores vigentes para un financiador
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para valores vigentes (default hoy)
 *       - in: query
 *         name: sucursal_id
 *         schema:
 *           type: integer
 *         description: ID de sucursal para valores específicos
 *     responses:
 *       200:
 *         description: Equipamientos con valores vigentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   valor_asignado:
 *                     type: number
 *                     description: Valor acuerdo o precio_referencia
 *                   valor_facturar:
 *                     type: number
 *                   tiene_acuerdo:
 *                     type: boolean
 *                   dias_sin_actualizar:
 *                     type: integer
 */
router.get('/financiador/:id', authenticateToken, validateFinanciadorId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const financiadorId = parseInt(req.params.id);
  const { fecha, sucursal_id } = req.query;
  
  logger.info('Obteniendo equipamientos por financiador', { 
    financiadorId, 
    fecha, 
    sucursal_id, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.getEquipamientosPorFinanciador(req, res, () => {});
  return resultado;
}));

// ============================================
// RUTAS DE VALORES HISTÓRICOS
// ============================================

/**
 * @swagger
 * /api/equipamientos/acuerdo/{id}/valores:
 *   get:
 *     summary: Obtener valores históricos de acuerdo
 *     description: Lista todos los períodos de vigencia de un acuerdo
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del acuerdo (financiador_equipamiento)
 *     responses:
 *       200:
 *         description: Historial de valores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   valor_asignado:
 *                     type: number
 *                   valor_facturar:
 *                     type: number
 *                   fecha_inicio:
 *                     type: string
 *                   fecha_fin:
 *                     type: string
 *                     nullable: true
 *                   sucursal_id:
 *                     type: integer
 *                     nullable: true
 *   post:
 *     summary: Guardar valor histórico
 *     description: Agrega nuevo valor con cierre automático de anteriores
 *     tags: [Equipamientos]
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
 *             required:
 *               - valor_asignado
 *               - valor_facturar
 *               - fecha_inicio
 *             properties:
 *               valor_asignado:
 *                 type: number
 *               valor_facturar:
 *                 type: number
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               sucursal_id:
 *                 type: integer
 *                 nullable: true
 *               id_equipamiento:
 *                 type: integer
 *               idobra_social:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Valor guardado
 */
router.get('/acuerdo/:id/valores', authenticateToken, validateAcuerdoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const acuerdoId = parseInt(req.params.id);
  
  logger.info('Obteniendo valores históricos de acuerdo', { 
    acuerdoId, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.getValoresEquipamiento(req, res, () => {});
  return resultado;
}));

router.post('/acuerdo/:id/valores', authenticateToken, requireAdmin, validateAcuerdoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const acuerdoId = parseInt(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio } = req.body;
  
  if (!valor_asignado || isNaN(parseFloat(valor_asignado))) {
    return res.status(400).json({ error: 'Valor asignado válido es requerido' });
  }
  
  if (!valor_facturar || isNaN(parseFloat(valor_facturar))) {
    return res.status(400).json({ error: 'Valor facturar válido es requerido' });
  }
  
  if (!fecha_inicio) {
    return res.status(400).json({ error: 'Fecha de inicio es requerida' });
  }
  
  logger.info('Guardando valor histórico de acuerdo', { 
    acuerdoId, 
    valor_asignado, 
    valor_facturar, 
    fecha_inicio, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.guardarValorEquipamiento(req, res, () => {});
  
  logger.info('Valor histórico de acuerdo guardado exitosamente', { 
    acuerdoId, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

// ============================================
// RUTAS DE PRESUPUESTO
// ============================================

/**
 * @swagger
 * /api/equipamientos/presupuesto/{id}:
 *   get:
 *     summary: Obtener equipamientos de presupuesto
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: soloLectura
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de equipamientos
 *   post:
 *     summary: Agregar equipamiento a presupuesto
 *     tags: [Equipamientos]
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
 *             required:
 *               - id_equipamiento
 *               - nombre
 *               - cantidad
 *               - costo
 *               - precio_facturar
 *             properties:
 *               id_equipamiento:
 *                 type: integer
 *               nombre:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               costo:
 *                 type: number
 *               precio_facturar:
 *                 type: number
 *               tiene_acuerdo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Equipamiento agregado
 */
router.post('/presupuesto/:id', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id_equipamiento, nombre, cantidad, costo, precio_facturar } = req.body;
  
  if (!id_equipamiento || isNaN(parseInt(id_equipamiento))) {
    return res.status(400).json({ error: 'ID de equipamiento válido es requerido' });
  }
  
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre del equipamiento es requerido' });
  }
  
  if (!cantidad || isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) {
    return res.status(400).json({ error: 'Cantidad válida es requerida' });
  }
  
  if (costo === undefined || isNaN(parseFloat(costo))) {
    return res.status(400).json({ error: 'Costo válido es requerido' });
  }
  
  if (precio_facturar === undefined || isNaN(parseFloat(precio_facturar))) {
    return res.status(400).json({ error: 'Precio facturar válido es requerido' });
  }
  
  logger.info('Agregando equipamiento a presupuesto', { 
    presupuestoId, 
    id_equipamiento, 
    nombre, 
    cantidad, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.agregarEquipamientoPresupuesto(req, res, () => {});
  
  logger.info('Equipamiento agregado a presupuesto exitosamente', { 
    presupuestoId, 
    id_equipamiento, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

router.get('/presupuesto/:id', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { soloLectura } = req.query;
  
  logger.info('Obteniendo equipamientos de presupuesto', { 
    presupuestoId, 
    soloLectura, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.getEquipamientosPresupuesto(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/equipamientos/presupuesto/{id}/{equipamientoId}:
 *   delete:
 *     summary: Eliminar equipamiento de presupuesto
 *     tags: [Equipamientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: equipamientoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipamiento eliminado
 */
router.delete('/presupuesto/:id/:equipamientoId', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const equipamientoId = parseInt(req.params.equipamientoId);
  
  if (isNaN(equipamientoId) || equipamientoId <= 0) {
    return res.status(400).json({ error: 'ID de equipamiento debe ser un número válido' });
  }
  
  logger.info('Eliminando equipamiento de presupuesto', { 
    presupuestoId, 
    equipamientoId, 
    usuario: req.user.id 
  });
  
  const resultado = await equipamientosController.eliminarEquipamientoPresupuesto(req, res, () => {});
  
  logger.info('Equipamiento eliminado de presupuesto exitosamente', { 
    presupuestoId, 
    equipamientoId, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
