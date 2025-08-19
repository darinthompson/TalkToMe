import dotenv from 'dotenv';
import openAPI from 'openai'

dotenv.config();

const client = new openAPI({apiKey: process.env.OPENAPI_KEY});

export const askOpenAI = async (prompt) => {
  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt
  });

  return response.output?.[0]?.content?.[0]?.text ?? '';
};
