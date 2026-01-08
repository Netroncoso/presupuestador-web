import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { getAllFinanciadores, updateFinanciador, getAcuerdos } from '../../controllers/admin/adminFinanciadoresController';
import { asyncHandler } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateFinanciadorId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de financiador debe ser un número válido' });
  }
  next();
};

const validateFinanciadorData = (req: Request, res: Response, next: NextFunction) => {
  const { Financiador, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real } = req.body;
  
  if (Financiador !== undefined && !Financiador?.trim()) {
    return res.status(400).json({ error: 'Nombre del financiador no puede estar vacío' });
  }
  
  if (tasa_mensual !== undefined && (isNaN(parseFloat(tasa_mensual)) || parseFloat(tasa_mensual) < 0)) {
    return res.status(400).json({ error: 'Tasa mensual debe ser un número válido' });
  }
  
  if (dias_cobranza_teorico !== undefined && (isNaN(parseInt(dias_cobranza_teorico)) || parseInt(dias_cobranza_teorico) < 0)) {
    return res.status(400).json({ error: 'Días cobranza teórico debe ser un número entero válido' });
  }
  
  if (dias_cobranza_real !== undefined && (isNaN(parseInt(dias_cobranza_real)) || parseInt(dias_cobranza_real) < 0)) {
    return res.status(400).json({ error: 'Días cobranza real debe ser un número entero válido' });
  }
  
  next();
};

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/prestadores:
 *   get:
 *     summary: Listar todos los financiadores (Admin)
 *     description: Obtiene lista completa de financiadores/obras sociales
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de financiadores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idobra_social:
 *                     type: integer
 *                   Financiador:
 *                     type: string
 *                   tasa_mensual:
 *                     type: number
 *                   dias_cobranza_teorico:
 *                     type: integer
 *                   dias_cobranza_real:
 *                     type: integer
 *                   acuerdo_asignado:
 *                     type: string
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  logger.info('Listando financiadores admin', { usuario: (req as AuthenticatedRequest).user.id });
  getAllFinanciadores(req, res, next);
});

/**
 * @swagger
 * /api/admin/prestadores/acuerdos:
 *   get:
 *     summary: Obtener tipos de acuerdos disponibles
 *     description: Lista los tipos de acuerdos que se pueden asignar a financiadores
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de acuerdos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["80%", "90%", "100%", "110%", "120%"]
 */
router.get('/acuerdos', (req: Request, res: Response, next: NextFunction) => {
  logger.info('Obteniendo acuerdos disponibles', { usuario: (req as AuthenticatedRequest).user.id });
  getAcuerdos(req, res, next);
});

/**
 * @swagger
 * /api/admin/prestadores/{id}:
 *   put:
 *     summary: Actualizar financiador (Admin)
 *     description: Actualiza datos de un financiador/obra social
 *     tags: [Admin - Financiadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del financiador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Financiador:
 *                 type: string
 *                 example: "OSDE"
 *               tasa_mensual:
 *                 type: number
 *                 example: 3.5
 *                 description: Tasa de interés mensual (%)
 *               dias_cobranza_teorico:
 *                 type: integer
 *                 example: 30
 *               dias_cobranza_real:
 *                 type: integer
 *                 example: 45
 *               acuerdo_asignado:
 *                 type: string
 *                 example: "100%"
 *     responses:
 *       200:
 *         description: Financiador actualizado
 *       403:
 *         description: Acceso denegado - Solo admin
 *       404:
 *         description: Financiador no encontrado
 */
router.put('/:id', validateFinanciadorId, validateFinanciadorData, (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  const { Financiador, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, acuerdo_asignado } = req.body;
  
  logger.info('Actualizando financiador', { 
    financiadorId: id, 
    Financiador, 
    tasa_mensual, 
    dias_cobranza_teorico, 
    dias_cobranza_real, 
    acuerdo_asignado,
    usuario: (req as AuthenticatedRequest).user.id 
  });
  
  updateFinanciador(req, res, next);
  
  logger.info('Financiador actualizado exitosamente', { 
    financiadorId: id, 
    usuario: (req as AuthenticatedRequest).user.id 
  });
});

export default router;
