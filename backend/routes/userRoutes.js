import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();
router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);
router.post('/reset-password', userController.resetUserPassword);

export default router;
