import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '200mb' }));

const openai = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: 'https://models.github.ai/inference'
});

function splitText(text, maxChunkSize = 12000) {
  const chunks = [];
  let i = 0;

  while (i < text.length) {
    let chunk = text.slice(i, i + maxChunkSize);
    const lastPeriod = chunk.lastIndexOf(".");
    if (lastPeriod > 1000) {
      chunk = chunk.slice(0, lastPeriod + 1);
    }
    chunks.push(chunk);
    i += chunk.length;
  }

  return chunks;
}

app.post('/analyze', async (req, res) => {
  const policyText = req.body.text;
  const chunks = splitText(policyText);

  try {
    const summaries = [];
    for (const chunk of chunks) {
      const response = await openai.chat.completions.create({
        model: 'openai/gpt-4.1',
        messages: [
          {
            role: 'system',
            content: `You are a privacy policy analyzer. Extract:
A 2-line summary

What data is collected

Who it is shared with

Retention period

Any red flags (biometric, marketing sharing, arbitration, tracking, etc.)`
          },
          { role: 'user', content: chunk }
        ],
        temperature: 0.3
      });
      summaries.push(response.choices[0].message.content);
    }

    const finalSummary = summaries.join('\n\n---\n\n');
    res.json({ result: finalSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI model error: ' + err.message });
  }
});

// ✅ This is the required export for Vercel
export const handler = serverless(app);
