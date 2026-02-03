// ============================================================================
// ROUTES: ZONAS TARIFARIO
// ============================================================================

import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import * as zonasController from '../controllers/zonasController';

const router = express.Router();

// Listar todas las zonas
router.get('/tarifario-zonas', authenticateToken, zonasController.listarZonas);

// Crear zona (solo super admin)
router.post('/tarifario-zonas', authenticateToken, requireSuperAdmin, zonasController.crearZona);

// Actualizar zona (solo super admin)
router.put('/tarifario-zonas/:id', authenticateToken, requireSuperAdmin, zonasController.actualizarZona);

// Gestión de zonas por sucursal
router.get('/sucursales/:id/zonas', authenticateToken, zonasController.obtenerZonasPorSucursal);
router.post('/sucursales/:id/zonas/:zonaId', authenticateToken, requireSuperAdmin, zonasController.asignarZonaASucursal);
router.delete('/sucursales/:id/zonas/:zonaId', authenticateToken, requireSuperAdmin, zonasController.desasignarZonaDeSucursal);

export default router;
