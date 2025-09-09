import express from 'express';
import journalController from '../controllers/journalController.js';

const router = express.Router();
router.post('/submit', journalController.submitJournal);
router.get('/fetch-mood-history/:user_id', journalController.fetchMoodHistory);

export default router;
