import { Router } from 'express';
import { auth } from '../middleware/auth';
import * as notificacionesController from '../controllers/notificacionesController';

const router = Router();

// Todas las rutas requieren autenticación
router.get('/', auth, notificacionesController.obtenerNotificaciones);
router.get('/count', auth, notificacionesController.contarNoLeidas);
router.put('/:id/leer', auth, notificacionesController.marcarComoLeida);
router.put('/leer-todas', auth, notificacionesController.marcarTodasLeidas);

export default router;