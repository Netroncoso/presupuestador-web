import { Router } from 'express';
import { tarifarioValoresController } from '../controllers/tarifarioValoresController';

const router = Router();

// GET /api/tarifario/zonas/:zonaId/servicios
router.get('/zonas/:zonaId/servicios', tarifarioValoresController.obtenerServiciosPorZona);

// POST /api/admin/tarifario/valores
router.post('/valores', tarifarioValoresController.crearOActualizarValores);

// GET /api/admin/tarifario/servicios/:servicioId/zonas/:zonaId/historial
router.get('/servicios/:servicioId/zonas/:zonaId/historial', tarifarioValoresController.obtenerHistorialValores);

export default router;