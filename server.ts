import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // API Route: AI Maraki Cultural Assistant Chat
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { prompt, language = 'en' } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getGenAI();
      const systemInstruction = `You are Maraki (ማራኪ), a warm, eloquent, culturally rich Ethiopian AI guide and coffee ambassador.
Your mission is to share the vibrant beauty of Ethiopian culture, traditional coffee ceremony, Ge'ez language/script, music, recipes (like Doro Wat, Shiro, Injera), history (Kaffa coffee discovery, Axum, Lalibela, Gondar), and hospitality.
Tone: Welcoming, warm, respectful, culturally accurate, and poetic.
When answering in English, include brief Amharic words with translation (e.g., "Selam (ሰላም)", "Tena Yistilign (ጤና ይስጥልኝ)", "Ameseginalehu (አመሰግናለሁ)").
If user asks in Amharic or requested language is Amharic, reply in fluent Amharic script (አማርኛ) alongside English transliteration/translation.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate response from Maraki AI.' });
    }
  });

  // API Route: Coffee Roast & Origin Matcher
  app.post('/api/gemini/coffee-match', async (req, res) => {
    try {
      const { preference, flavorNotes } = req.body;
      const ai = getGenAI();

      const prompt = `Recommend the perfect Ethiopian coffee bean origin (such as Yirgacheffe, Sidama, Harar, Guji, Kaffa) for someone who likes: "${preference}" with notes like "${flavorNotes.join(', ')}". 
Explain in 3 short bullet points:
1. Recommended Region & Roast Level
2. Flavor profile description
3. Traditional Jebena brewing tip for this bean.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an Ethiopian Master Coffee Roaster and Sommelier.',
          temperature: 0.6,
        }
      });

      res.json({ recommendation: response.text });
    } catch (err: any) {
      console.error('Gemini coffee match error:', err);
      res.status(500).json({ error: err.message || 'Failed to match coffee profile.' });
    }
  });

  // API Route: Proverb & Wisdom Generator
  app.post('/api/gemini/proverb', async (req, res) => {
    try {
      const { theme } = req.body;
      const ai = getGenAI();

      const prompt = `Provide an authentic Ethiopian proverb (ምሳሌያዊ አነጋገር) related to "${theme || 'friendship and wisdom'}".
Return JSON with the exact format:
{
  "amharicScript": "Amharic script here",
  "phonetic": "Latin phonetic pronunciation",
  "englishTranslation": "Literal English translation",
  "culturalMeaning": "Deep cultural explanation of its wisdom"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.error('Gemini proverb error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate proverb.' });
    }
  });

  // Simple authentication endpoint
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Default credentials (admin / maraki2026)
    if (username === 'admin' && password === 'maraki2026') {
      // Generate a simple token (could be JWT in real app)
      const token = Math.random().toString(36).substring(2);
      // For simplicity, send token back
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maraki server running at http://localhost:${PORT}`);
  });
}

startServer();
