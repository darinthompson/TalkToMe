import { Router } from 'express';
import { generateResponse, chatWithTherapist } from '../controllers/openAPIController.js';

const router = Router();

// POST /api/ai/prompt
router.post('/prompt', generateResponse);

// POST /api/ai/chat
router.post('/chat', chatWithTherapist);

export default router;