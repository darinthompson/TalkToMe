import { Router } from 'express';
import { generateResponse } from '../Controllers/openAPIController.js';

const router = Router();

// POST /api/ai/prompt
router.post('/prompt', generateResponse);

export default router;