import { Router, Request, Response } from 'express';
import { authenticateToken, requireGerenciaAdministrativa, requireGerenciaPrestacional, requireGerenciaGeneral, requireAnyGerencia } from '../middleware/auth';
import { auditoriaMultiService } from '../services/auditoriaMultiService';
import { AppError } from '../middleware/errorHandler';
import { csrfProtection } from '../middleware/csrf';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar protección CSRF a todas las rutas PUT
router.use((req, res, next) => {
  if (req.method === 'PUT') {
    return csrfProtection(req, res, next);
  }
  next();
});

// ============================================================================
// ENDPOINTS COMUNES (TODAS LAS GERENCIAS)
// ============================================================================

/**
 * @swagger
 * /api/auditoria-multi/pendientes:
 *   get:
 *     summary: Obtener casos pendientes
 *     description: Lista presupuestos pendientes de auditoría para la gerencia del usuario
 *     tags: [Auditoría Multi-Gerencial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de casos pendientes
 *       403:
 *         description: Acceso denegado - Solo gerencias
 */
/**
 * GET /api/auditoria-multi/pendientes
 * Obtiene casos pendientes para la gerencia del usuario
 */
router.get('/pendientes', requireAnyGerencia, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const rol = req.user.rol;
    const usuarioId = req.user.id;
    
    // Mapear rol a estado pendiente
    const estadoMap: Record<string, string> = {
      'gerencia_administrativa': 'pendiente_administrativa',
      'gerencia_prestacional': 'pendiente_prestacional',
      'gerencia_general': 'pendiente_general',
      'admin': 'pendiente_administrativa' // Admin ve todos
    };
    
    const estado = estadoMap[rol];
    if (!estado) {
      throw new AppError(403, 'Rol no autorizado para auditoría');
    }
    
    // Obtener casos disponibles O asignados a mí
    const [casos] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        s.Sucursales_mh as sucursal_nombre,
        f.Financiador as financiador_nombre,
        u.username as usuario_creador,
        revisor.username as revisor_nombre,
        DATEDIFF(NOW(), p.created_at) as dias_pendiente
      FROM presupuestos p
      LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
      LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN usuarios revisor ON p.revisor_id = revisor.id
      WHERE p.estado = ?
        AND p.es_ultima_version = 1
        AND (p.revisor_id IS NULL OR p.revisor_id = ?)
      ORDER BY p.created_at ASC
    `, [estado, usuarioId]);
    
    res.json(casos);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auditoria-multi/mis-casos:
 *   get:
 *     summary: Obtener mis casos asignados
 *     description: Lista casos actualmente asignados al usuario (FCFS)
 *     tags: [Auditoría Multi-Gerencial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de casos asignados
 */
/**
 * GET /api/auditoria-multi/mis-casos
 * Obtiene casos actualmente asignados al usuario
 */
router.get('/mis-casos', requireAnyGerencia, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const usuarioId = req.user.id;
    
    const [casos] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        s.Sucursales_mh as sucursal_nombre,
        f.Financiador as financiador_nombre,
        u.username as usuario_creador,
        TIMESTAMPDIFF(MINUTE, p.revisor_asignado_at, NOW()) as minutos_asignado
      FROM presupuestos p
      LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
      LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.revisor_id = ?
        AND p.estado IN ('en_revision_administrativa', 'en_revision_prestacional', 'en_revision_general')
        AND p.es_ultima_version = 1
      ORDER BY p.revisor_asignado_at DESC
    `, [usuarioId]);
    
    res.json(casos);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auditoria-multi/mis-auditorias
 * Obtiene presupuestos auditados por el usuario (historial)
 */
router.get('/mis-auditorias', requireAnyGerencia, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const usuarioId = req.user.id;
    
    const [presupuestos] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT
        p.*,
        s.Sucursales_mh as Sucursal,
        f.Financiador as financiador_nombre,
        u.username as usuario_creador
      FROM presupuestos p
      INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
      LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
      LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.auditor_id = ?
        AND p.es_ultima_version = 1
      ORDER BY p.created_at DESC
    `, [usuarioId]);
    
    res.json(presupuestos);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auditoria-multi/tomar/{id}:
 *   put:
 *     summary: Tomar caso para revisión (FCFS)
 *     description: Asigna un caso pendiente al usuario (First Come First Served)
 *     tags: [Auditoría Multi-Gerencial]
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
 *         description: Caso asignado exitosamente
 *       409:
 *         description: Caso ya asignado a otro usuario
 */
/**
 * PUT /api/auditoria-multi/tomar/:id
 * Toma un caso para revisión (First Come, First Served)
 */
router.put('/tomar/:id', requireAnyGerencia, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new AppError(400, 'ID de presupuesto inválido');
    }
    
    const usuarioId = req.user.id;
    const resultado = await auditoriaMultiService.tomarCaso(id, usuarioId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GERENCIA ADMINISTRATIVA
// ============================================================================

/**
 * @swagger
 * /api/auditoria-multi/administrativa/aprobar/{id}:
 *   put:
 *     summary: Aprobar presupuesto (G. Administrativa)
 *     tags: [Auditoría Multi-Gerencial]
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
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presupuesto aprobado
 * /api/auditoria-multi/administrativa/derivar/{id}:
 *   put:
 *     summary: Derivar a G. Prestacional
 *     tags: [Auditoría Multi-Gerencial]
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
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Derivado a G. Prestacional
 * /api/auditoria-multi/administrativa/rechazar/{id}:
 *   put:
 *     summary: Rechazar presupuesto (G. Administrativa)
 *     tags: [Auditoría Multi-Gerencial]
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
 *               - comentario
 *             properties:
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presupuesto rechazado
 */

router.put('/administrativa/aprobar/:id', requireGerenciaAdministrativa, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    const resultado = await auditoriaMultiService.aprobarAdministrativa(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/administrativa/aprobar-condicional/:id', requireGerenciaAdministrativa, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo) {
      throw new AppError(400, 'El motivo es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.aprobarCondicionalAdministrativa(id, req.user.id, motivo);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/administrativa/rechazar/:id', requireGerenciaAdministrativa, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    if (!comentario) {
      throw new AppError(400, 'El comentario es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.rechazarAdministrativa(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/administrativa/derivar/:id', requireGerenciaAdministrativa, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    const resultado = await auditoriaMultiService.derivarAPrestacional(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GERENCIA PRESTACIONAL
// ============================================================================

router.put('/prestacional/aprobar/:id', requireGerenciaPrestacional, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    const resultado = await auditoriaMultiService.aprobarPrestacional(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/prestacional/aprobar-condicional/:id', requireGerenciaPrestacional, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo) {
      throw new AppError(400, 'El motivo es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.aprobarCondicionalPrestacional(id, req.user.id, motivo);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/prestacional/rechazar/:id', requireGerenciaPrestacional, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    if (!comentario) {
      throw new AppError(400, 'El comentario es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.rechazarPrestacional(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/prestacional/observar/:id', requireGerenciaPrestacional, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    if (!comentario) {
      throw new AppError(400, 'El comentario es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.observarPresupuesto(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/prestacional/escalar/:id', requireGerenciaPrestacional, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo) {
      throw new AppError(400, 'El motivo es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.escalarAGeneral(id, req.user.id, motivo);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GERENCIA GENERAL
// ============================================================================

router.put('/general/aprobar/:id', requireGerenciaGeneral, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    const resultado = await auditoriaMultiService.aprobarGeneral(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/general/aprobar-condicional/:id', requireGerenciaGeneral, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    
    if (!motivo) {
      throw new AppError(400, 'El motivo es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.aprobarCondicionalGeneral(id, req.user.id, motivo);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/general/rechazar/:id', requireGerenciaGeneral, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { comentario } = req.body;
    
    if (!comentario) {
      throw new AppError(400, 'El comentario es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.rechazarGeneral(id, req.user.id, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

router.put('/general/devolver/:id', requireGerenciaGeneral, async (req: Request & { user?: any }, res: Response, next) => {
  try {
    const id = parseInt(req.params.id);
    const { gerenciaDestino, comentario } = req.body;
    
    if (!gerenciaDestino || !['administrativa', 'prestacional'].includes(gerenciaDestino)) {
      throw new AppError(400, 'Gerencia destino inválida');
    }
    
    if (!comentario) {
      throw new AppError(400, 'El comentario es obligatorio');
    }
    
    const resultado = await auditoriaMultiService.devolverAGerencia(id, req.user.id, gerenciaDestino, comentario);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

export default router;
