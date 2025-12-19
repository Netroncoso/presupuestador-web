import { Router } from 'express';
import { getInsumos } from '../controllers/insumosController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getInsumos);

export default router;
