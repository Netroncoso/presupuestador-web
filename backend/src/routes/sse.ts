import { Router } from 'express';
import { streamUpdates } from '../controllers/sseController';

const router = Router();

// SSE endpoint for real-time updates (handles auth internally)
router.get('/updates', streamUpdates);

export default router;