import express, { Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { cargaService } from '../services/cargaService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/carga/pendientes:
 *   get:
 *     summary: Obtener presupuestos pendientes de carga
 *     tags: [Carga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos pendientes
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos de operador de carga
 */
router.get('/pendientes',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const casos = await cargaService.obtenerCasosPendientes(req.user.sucursal_id);
    
    logger.info('Casos pendientes consultados', { 
      operador: req.user.id, 
      cantidad: casos.length 
    });
    
    res.json({
      success: true,
      data: casos,
      total: casos.length
    });
  })
);

/**
 * @swagger
 * /api/carga/en-proceso:
 *   get:
 *     summary: Obtener presupuestos en proceso por el operador
 *     tags: [Carga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos en proceso
 */
router.get('/en-proceso',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const casos = await cargaService.obtenerCasosEnProceso(req.user.id);
    
    res.json({
      success: true,
      data: casos,
      total: casos.length
    });
  })
);

/**
 * @swagger
 * /api/carga/{id}/tomar:
 *   post:
 *     summary: Tomar un caso para carga (FCFS)
 *     tags: [Carga]
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
 *         description: Caso tomado exitosamente
 *       409:
 *         description: Caso ya asignado a otro operador
 */
router.post('/:id/tomar',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const presupuestoId = parseInt(req.params.id);
    
    if (isNaN(presupuestoId) || presupuestoId <= 0) {
      throw new AppError(400, 'ID de presupuesto inválido');
    }
    
    const resultado = await cargaService.tomarCasoParaCarga(presupuestoId, req.user.id);
    
    logger.info('Caso tomado para carga', { 
      presupuestoId, 
      operador: req.user.id,
      yaAsignado: resultado.yaAsignado
    });
    
    res.json(resultado);
  })
);

/**
 * @swagger
 * /api/carga/{id}/marcar-cargado:
 *   post:
 *     summary: Marcar presupuesto como cargado en sistema externo
 *     tags: [Carga]
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
 *               - referencia_externa
 *             properties:
 *               referencia_externa:
 *                 type: string
 *                 description: Referencia/ID en sistema externo
 *                 example: "SIST-2025-001234"
 *     responses:
 *       200:
 *         description: Presupuesto marcado como cargado
 *       400:
 *         description: Referencia externa requerida
 *       409:
 *         description: Referencia externa duplicada
 */
router.post('/:id/marcar-cargado',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const presupuestoId = parseInt(req.params.id);
    const { referencia_externa } = req.body;
    
    if (isNaN(presupuestoId) || presupuestoId <= 0) {
      throw new AppError(400, 'ID de presupuesto inválido');
    }
    
    const resultado = await cargaService.marcarComoCargado(
      presupuestoId, 
      req.user.id, 
      referencia_externa
    );
    
    logger.info('Presupuesto marcado como cargado', { 
      presupuestoId, 
      operador: req.user.id,
      referencia: referencia_externa
    });
    
    res.json(resultado);
  })
);

/**
 * @swagger
 * /api/carga/{id}/devolver:
 *   post:
 *     summary: Devolver presupuesto a usuario o gerencia
 *     tags: [Carga]
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
 *               - destino
 *               - motivo
 *             properties:
 *               destino:
 *                 type: string
 *                 enum: [usuario, administrativa, prestacional, general]
 *                 description: Destino de la devolución
 *               motivo:
 *                 type: string
 *                 description: Motivo de la devolución (mínimo 10 caracteres)
 *                 example: "Datos del paciente incompletos"
 *     responses:
 *       200:
 *         description: Presupuesto devuelto exitosamente
 *       400:
 *         description: Destino o motivo inválido
 */
router.post('/:id/devolver',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const presupuestoId = parseInt(req.params.id);
    const { destino, motivo } = req.body;
    
    if (isNaN(presupuestoId) || presupuestoId <= 0) {
      throw new AppError(400, 'ID de presupuesto inválido');
    }
    
    const destinosValidos = ['usuario', 'administrativa', 'prestacional', 'general'];
    if (!destinosValidos.includes(destino)) {
      throw new AppError(400, 'Destino de devolución inválido');
    }
    
    const resultado = await cargaService.devolverPresupuesto(
      presupuestoId, 
      req.user.id, 
      destino,
      motivo
    );
    
    logger.info('Presupuesto devuelto desde carga', { 
      presupuestoId, 
      operador: req.user.id,
      destino,
      motivo
    });
    
    res.json(resultado);
  })
);

/**
 * @swagger
 * /api/carga/historial:
 *   get:
 *     summary: Obtener historial de carga del operador
 *     tags: [Carga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de casos procesados
 */
router.get('/historial',
  authenticateToken,
  requireRole(['operador_carga', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pool } = require('../db');
    
    const [historial] = await pool.query(
      `SELECT 
        p.idPresupuestos,
        p.Nombre_Apellido,
        p.DNI,
        p.estado,
        p.resultado_auditoria,
        p.total_facturar,
        p.referencia_externa,
        p.created_at,
        p.updated_at,
        s.Sucursales_mh as Sucursal,
        f.Financiador as Financiador,
        u_carga.username as operador_carga
      FROM presupuestos p
      LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
      LEFT JOIN financiador f ON p.financiador_id = f.id
      LEFT JOIN usuarios u_carga ON p.revisor_id = u_carga.id
      WHERE p.estado IN ('pendiente_carga', 'en_carga', 'cargado', 'aprobado', 'rechazado')
      AND p.es_ultima_version = 1
      ORDER BY p.updated_at DESC
      LIMIT 200`,
      []
    );
    
    res.json(historial);
  })
);

/**
 * @swagger
 * /api/carga/auto-liberar:
 *   post:
 *     summary: Auto-liberar casos inactivos (CRON)
 *     tags: [Carga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Casos liberados exitosamente
 */
router.post('/auto-liberar',
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const casosLiberados = await cargaService.autoLiberarCasosInactivos();
    
    logger.info('Auto-liberación ejecutada', { 
      casosLiberados,
      ejecutadoPor: req.user.id
    });
    
    res.json({
      success: true,
      casosLiberados
    });
  })
);

export default router;
