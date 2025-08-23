import openAPIService from '../services/openAPIService.js';

export async function generateResponse(req, res, next) {
  try {
    const { prompt } = req.body;

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid "prompt" (string required)' });
    }

    const text = await openAPIService.getAIResponse(prompt.trim());
    return res.json({ text });
  } catch (err) {
    return next(err);
  }
}