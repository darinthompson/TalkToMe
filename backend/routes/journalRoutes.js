import express from 'express';
import journalController from '../controllers/journalController.js';

const router = express.Router();
router.post('/submit', journalController.submitJournal);

export default router;
