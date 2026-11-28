import express from 'express';
import rateLimit from 'express-rate-limit';
import { handleChat } from '../controllers/chatbot.js';

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 messages per 15 minutes per IP
  message: { reply: 'You are sending messages too quickly. Please wait a few moments before trying again.' }
});

router.post('/chat', chatLimiter, handleChat);

export default router;
