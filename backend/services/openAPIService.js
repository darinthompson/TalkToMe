import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getAIResponse(journal_text) {
  const prompt = `User Journal: ${journal_text}
Instructions:
- Summarize the emotion.
- Guess the mood (e.g., happy, sad).
- Provide one short tip.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
  });

  return resp.choices[0].message.content;
}

export default {
  getAIResponse
};
