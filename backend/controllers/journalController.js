import openAIService from '../services/openAPIService.js';
import supabaseClient from '../services/supabaseClient.js';

function extractMood(text) {
  const lower = text.toLowerCase();
  if (lower.includes('happy') || lower.includes('joyful') || lower.includes('excited')) return 'happy';
  if (lower.includes('sad') || lower.includes('gloomy') || lower.includes('hurt')) return 'sad';
  if (lower.includes('anxious') || lower.includes('nervous') || lower.includes('tense')) return 'anxious';
  if (lower.includes('calm') || lower.includes('neutral') || lower.includes('blank')) return 'neutral';
  return 'unknown';
}

async function submitJournal(req, res) {
  const { user_id, journal_text } = req.body;
  if (!user_id || !journal_text) {
    return res.status(400).json({ error: 'Missing user_id or journal_text' });
  }
  try {
    // Get AI response
    const aiText = await openAIService.getAIResponse(journal_text);
    const mood = extractMood(aiText);
    // Save to Supabase
    const { error } = await supabaseClient.insertPrompt({
      user_journal: journal_text,
      user_response: aiText,
      user_mood: mood,
      user_id
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ ai_response: aiText, mood });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export const fetchMoodHistory = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid user id.' });
  }

  try {
    const { data, error } = await supabaseClient.fetchMoodHistoryByUserId(user_id);

    if (error) {
      return res.status(500).json({ error: error.message ?? 'Database error.' });
    }
    return res.status(200).json({ data: data });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
}

export default {
  fetchMoodHistory,
  submitJournal
};
