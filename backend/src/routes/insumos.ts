import { Router } from 'express';
import { getInsumos } from '../controllers/insumosController';
const router = Router();
router.get('/', getInsumos);
export default router;
