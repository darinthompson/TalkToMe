import { Router } from 'express';
import { generateResponse } from '../controllers/openAPIController.js';

const router = Router();

// POST /api/ai/prompt
router.post('/prompt', generateResponse);

export default router;