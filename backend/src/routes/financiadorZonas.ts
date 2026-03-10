import { Router, Request, Response } from 'express';
import { financiadorZonasController } from '../controllers/financiadorZonasController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/financiador/zonas - Obtener todas las zonas de financiador
router.get('/zonas', authenticateToken, asyncHandler(financiadorZonasController.obtenerTodasZonas.bind(financiadorZonasController)));

// GET /api/financiador/:id/zonas
router.get('/:id/zonas', authenticateToken, asyncHandler(financiadorZonasController.obtenerZonasPorFinanciador.bind(financiadorZonasController)));

// GET /api/financiador/:id/servicios?zona_financiador_id=1
router.get('/:id/servicios', authenticateToken, async (req, res) => {
  try {
    const financiadorId = parseInt(req.params.id);
    const zonaFinanciadorId = parseInt(req.query.zona_financiador_id as string);

    if (!req.query.zona_financiador_id) {
      return res.status(400).json({ error: 'zona_financiador_id es requerido' });
    }

    if (isNaN(financiadorId) || isNaN(zonaFinanciadorId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const { financiadorZonasService } = await import('../services/financiadorZonasService');
    const servicios = await financiadorZonasService.obtenerServiciosConvenio(financiadorId, zonaFinanciadorId);

    res.json({ servicios });
  } catch (error) {
    console.error('Error obteniendo servicios financiador:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/financiador/:id/valores-vigentes - Obtener valores vigentes por zona
router.get('/:id/valores-vigentes', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { servicio_nombre } = req.query;

  const valoresVigentes = await financiadorZonasController.obtenerValoresVigentes(
    { ...req, params: { financiadorId: id }, query: { servicio_nombre } } as any,
    res
  );

  if (!res.headersSent) {
    res.json(valoresVigentes);
  }
}));

export default router;