import { Router } from 'express';
import { getSucursales } from '../controllers/sucursalesController';

const router = Router();
router.get('/', getSucursales);
export default router;
