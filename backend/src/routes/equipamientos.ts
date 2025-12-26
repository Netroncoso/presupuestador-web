import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as equipamientosController from '../controllers/equipamientosController';

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
router.get('/admin', authenticateToken, requireAdmin, equipamientosController.getAllEquipamientos);
router.post('/admin', authenticateToken, requireAdmin, equipamientosController.crearEquipamiento);

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
router.put('/admin/:id', authenticateToken, requireAdmin, equipamientosController.actualizarEquipamiento);
router.delete('/admin/:id', authenticateToken, requireAdmin, equipamientosController.eliminarEquipamiento);

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
router.get('/tipos', authenticateToken, equipamientosController.getTiposEquipamiento);
router.post('/tipos', authenticateToken, requireAdmin, equipamientosController.crearTipoEquipamiento);

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
router.get('/admin/financiador/:id', authenticateToken, requireAdmin, equipamientosController.getEquipamientosPorFinanciadorAdmin);

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
router.put('/admin/acuerdo/:id', authenticateToken, requireAdmin, equipamientosController.actualizarAcuerdoEquipamiento);

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
router.post('/admin/:id/valores', authenticateToken, requireAdmin, equipamientosController.agregarValorEquipamientoAdmin);
router.get('/admin/:id/valores', authenticateToken, requireAdmin, equipamientosController.getValoresEquipamientoAdmin);

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
router.get('/', authenticateToken, equipamientosController.getEquipamientos);

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
router.get('/financiador/:id', authenticateToken, equipamientosController.getEquipamientosPorFinanciador);

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
router.get('/acuerdo/:id/valores', authenticateToken, equipamientosController.getValoresEquipamiento);
router.post('/acuerdo/:id/valores', authenticateToken, requireAdmin, equipamientosController.guardarValorEquipamiento);

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
router.post('/presupuesto/:id', authenticateToken, equipamientosController.agregarEquipamientoPresupuesto);
router.get('/presupuesto/:id', authenticateToken, equipamientosController.getEquipamientosPresupuesto);

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
router.delete('/presupuesto/:id/:equipamientoId', authenticateToken, equipamientosController.eliminarEquipamientoPresupuesto);

export default router;
