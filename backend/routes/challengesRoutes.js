import express from 'express';
import challengesController from '../controllers/challengesController.js';

const router = express.Router();

// Daily Challenges Routes
router.get('/daily/:user_id', challengesController.getTodaysChallenges);
router.post('/daily/:user_id/tasks', challengesController.addUserTask);
router.put('/daily/:user_id/tasks/:task_id/complete', challengesController.completeTask);

// Achievements Routes
router.get('/achievements/:user_id', challengesController.getUserAchievements);
router.get('/achievements/:user_id/newly-unlocked', challengesController.getNewlyUnlockedAchievements);

export default router;