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

// Real-time chat with AI therapist
export async function chatWithTherapist(req, res, next) {
  try {
    const { username, user_id, chatHistory, journalHistory } = req.body;
    // Accept either username or user_id for backward compatibility
    const user = username || user_id;
    if (!user || !Array.isArray(chatHistory) || !Array.isArray(journalHistory)) {
      return res.status(400).json({ error: 'Missing user (username or user_id), chatHistory, or journalHistory' });
    }
    const reply = await openAPIService.getAIChatResponse({ username: user, chatHistory, journalHistory });
    return res.json({ reply });
  } catch (err) {
    return next(err);
  }
}