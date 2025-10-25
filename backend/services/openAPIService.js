import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

console.log(process.env);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getAIResponse(journal_text) {
  const prompt = `User Journal: ${journal_text}
You are a professional therapist.\n\n Respond as a therapist,
Your job is to make the user feel heard and understood.
Give them suggestions or advice on what they can do to feel better.
Be empathetic, supportive, and proactive in your suggestions.
But at the same time, you are their therapist so be professional and careful with your words.
  Instructions:
- Summarize the emotion.
- Guess the mood (e.g., happy, sad) unknown is not a mood be very specific with the mood.
- Provide one short tip.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
  });

  return resp.choices[0].message.content;
}

// Helper to format chat and journal context for the AI
function buildTherapistPrompt({ username, chatHistory, journalHistory }) {
  let chatContext = chatHistory.map(m => `${m.role === 'user' ? username : 'Therapist'}: ${m.content}`).join('\n');
  let journalContext = journalHistory && journalHistory.length
    ? '\n\nJournal Entries:\n' + journalHistory.map((j, i) => `Entry ${i + 1}: ${j}`).join('\n')
    : '';
  return `You are a professional therapist.\n\nHere is the user's chat history:\n${chatContext}${journalContext}\n\nRespond as a therapist, 
    referencing past chats and journals when appropriate. 
    Be empathetic, supportive, and proactive in follow-up questions.
    Understand user's mood and personality from their past interactions and journal.
    Respond with care and consideration for the user's feelings and experiences.\n`;
}

// Real-time chat with context
async function getAIChatResponse({ username, chatHistory, journalHistory }) {
  const prompt = buildTherapistPrompt({ username, chatHistory, journalHistory });
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a professional therapist. Remember the user and their past conversations and journals.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 300,
  });
  return resp.choices[0].message.content;
}

export default {
  getAIResponse,
  getAIChatResponse
};
