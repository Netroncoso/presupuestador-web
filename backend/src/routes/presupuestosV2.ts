import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as presupuestosController from '../controllers/presupuestosControllerV2';
import * as equipamientosController from '../controllers/equipamientosController';

const router = Router();

// Middleware para verificar rol gerencias/admin
const requireAuditor = (req: any, res: any, next: any) => {
  const rolesPermitidos = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general', 'admin'];
  if (!rolesPermitidos.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: Solo gerencias o admins' });
  }
  next();
};

// ============================================
// RUTAS DE AUDITORÍA (específicas primero)
// ============================================

/**
 * @swagger
 * /api/presupuestos/auditor/pendientes:
 *   get:
 *     summary: Obtener presupuestos pendientes de auditoría
 *     description: Lista presupuestos que requieren revisión por gerencias
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idPresupuestos:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   dni:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   costo_total:
 *                     type: number
 *                   rentabilidad:
 *                     type: number
 *       403:
 *         description: Acceso denegado - Solo gerencias
 */
router.get('/auditor/pendientes', auth, requireAuditor, presupuestosController.obtenerPendientes);

// ============================================
// RUTAS DE VERIFICACIÓN DNI (específicas)
// ============================================

/**
 * @swagger
 * /api/presupuestos/dni/{dni}:
 *   get:
 *     summary: Verificar si existe presupuesto con DNI
 *     description: Busca presupuestos existentes por DNI del paciente
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dni
 *         required: true
 *         schema:
 *           type: string
 *         description: DNI del paciente (7-8 dígitos)
 *         example: "12345678"
 *     responses:
 *       200:
 *         description: Presupuestos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 existe:
 *                   type: boolean
 *                 presupuestos:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/dni/:dni', auth, presupuestosController.verificarDNI);

/**
 * @swagger
 * /api/presupuestos/verificar-dni/{dni}:
 *   get:
 *     summary: Verificar DNI (alias)
 *     description: Alias de /api/presupuestos/dni/{dni}
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dni
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de verificación
 */
router.get('/verificar-dni/:dni', auth, presupuestosController.verificarDNI);

// ============================================
// RUTAS GENERALES DE PRESUPUESTOS
// ============================================

/**
 * @swagger
 * /api/presupuestos:
 *   get:
 *     summary: Listar todos los presupuestos
 *     description: Obtiene lista de presupuestos del usuario autenticado
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idPresupuestos:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   dni:
 *                     type: string
 *                   sucursal:
 *                     type: string
 *                   estado:
 *                     type: string
 *                   costo_total:
 *                     type: number
 *                   total_facturar:
 *                     type: number
 *                   rentabilidad:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get('/', auth, presupuestosController.listarPresupuestos);

/**
 * @swagger
 * /api/presupuestos:
 *   post:
 *     summary: Crear nuevo presupuesto
 *     description: Crea un presupuesto en estado borrador
 *     tags: [Presupuestos]
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
 *               - dni
 *               - sucursal
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               sucursal:
 *                 type: string
 *                 example: "CABA"
 *               dificil_acceso:
 *                 type: string
 *                 enum: ["SI", "NO"]
 *                 example: "NO"
 *     responses:
 *       201:
 *         description: Presupuesto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idPresupuestos:
 *                   type: integer
 *                 message:
 *                   type: string
 */
router.post('/', auth, presupuestosController.crearPresupuesto);

// ============================================
// RUTAS CON ID DE PRESUPUESTO
// ============================================

/**
 * @swagger
 * /api/presupuestos/{id}:
 *   get:
 *     summary: Obtener presupuesto por ID
 *     description: Obtiene detalle completo de un presupuesto
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del presupuesto
 *     responses:
 *       200:
 *         description: Detalle del presupuesto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idPresupuestos:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 dni:
 *                   type: string
 *                 sucursal:
 *                   type: string
 *                 estado:
 *                   type: string
 *                 costo_total:
 *                   type: number
 *                 total_facturar:
 *                   type: number
 *                 rentabilidad:
 *                   type: number
 *                 version:
 *                   type: integer
 *       404:
 *         description: Presupuesto no encontrado
 */
router.get('/:id', auth, presupuestosController.obtenerPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/versiones:
 *   get:
 *     summary: Obtener historial de versiones
 *     description: Lista todas las versiones de un presupuesto
 *     tags: [Presupuestos]
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
 *         description: Historial de versiones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idPresupuestos:
 *                     type: integer
 *                   version:
 *                     type: integer
 *                   estado:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   es_ultima_version:
 *                     type: boolean
 */
router.get('/:id/versiones', auth, presupuestosController.obtenerHistorial);

/**
 * @swagger
 * /api/presupuestos/{id}/finalizar:
 *   post:
 *     summary: Finalizar presupuesto
 *     description: Finaliza presupuesto y evalúa reglas de auditoría automática
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totales:
 *                 type: object
 *     responses:
 *       200:
 *         description: Presupuesto finalizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 estado:
 *                   type: string
 *                 requiere_auditoria:
 *                   type: boolean
 */
router.post('/:id/finalizar', auth, presupuestosController.finalizarPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/version/editar:
 *   post:
 *     summary: Crear versión para edición
 *     description: Crea nueva versión de presupuesto finalizado para editar
 *     tags: [Presupuestos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmar:
 *                 type: boolean
 *                 description: Confirmar creación de nueva versión
 *     responses:
 *       200:
 *         description: Nueva versión creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nueva_version:
 *                   type: integer
 *                 message:
 *                   type: string
 */
router.post('/:id/version/editar', auth, presupuestosController.crearVersionParaEdicion);

/**
 * @swagger
 * /api/presupuestos/{id}/prestador:
 *   put:
 *     summary: Actualizar financiador del presupuesto
 *     description: Cambia el financiador/obra social del presupuesto
 *     tags: [Presupuestos]
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
 *               - idobra_social
 *             properties:
 *               idobra_social:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Financiador actualizado
 */
router.put('/:id/prestador', auth, presupuestosController.actualizarPrestador);

/**
 * @swagger
 * /api/presupuestos/{id}/estado:
 *   put:
 *     summary: Cambiar estado del presupuesto (Gerencias)
 *     description: Permite a gerencias aprobar, rechazar, derivar u observar presupuestos
 *     tags: [Presupuestos]
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
 *               - accion
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [aprobar, rechazar, derivar, observar, escalar]
 *                 example: "aprobar"
 *               comentario:
 *                 type: string
 *                 example: "Presupuesto aprobado"
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       403:
 *         description: Acceso denegado - Solo gerencias
 */
router.put('/:id/estado', auth, requireAuditor, presupuestosController.cambiarEstado);

/**
 * @swagger
 * /api/presupuestos/{id}/equipamientos:
 *   get:
 *     summary: Obtener equipamientos del presupuesto
 *     tags: [Presupuestos]
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
 *         description: Modo solo lectura (valores históricos)
 *     responses:
 *       200:
 *         description: Lista de equipamientos
 *   post:
 *     summary: Agregar equipamiento al presupuesto
 *     tags: [Presupuestos]
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
router.get('/:id/equipamientos', auth, equipamientosController.getEquipamientosPresupuesto);
router.post('/:id/equipamientos', auth, equipamientosController.agregarEquipamientoPresupuesto);

/**
 * @swagger
 * /api/presupuestos/{id}/equipamientos/{equipamientoId}:
 *   delete:
 *     summary: Eliminar equipamiento del presupuesto
 *     tags: [Presupuestos]
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
router.delete('/:id/equipamientos/:equipamientoId', auth, equipamientosController.eliminarEquipamientoPresupuesto);

export default router;
