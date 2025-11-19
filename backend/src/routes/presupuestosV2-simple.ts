import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

// Ruta simple de prueba
router.get('/test', auth, (req, res) => {
  res.json({ message: 'V2 routes working' });
});

export default router;