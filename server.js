const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const { GoogleGenAI } = require('@google/genai'); // Not used with AQ token

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize official Google Gen AI SDK Client
// Initialize Gemini via direct HTTP call using Bearer token (AQ token)
// Using built-in fetch (Node >=18)
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

app.post('/api/generate-dispatch', async (req, res) => {
  try {
    const { make, model, year } = req.body;

    if (!make) {
      return res.status(400).json({ error: 'Missing vehicle parameters.' });
    }

    // 1. Generate text logs using Gemini 2.5 Flash (Free Tier)
    let scriptText;
    try {
      const geminiPayload = {
          contents: [{
            role: 'user',
            parts: [{ text: `Write a dramatic, 60-word SCPD police dispatch log for a ${year || ''} ${make} ${model || ''} suspected of high-speed street racing in Seacrest County. Start with 'All units' or 'Dispatch to active units'. Use tactical racing game terminology.` }]
          }],
          generationConfig: { temperature: 0.85 }
        };
        const url = `${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`;
        const geminiResp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });
        if (!geminiResp.ok) {
          const err = await geminiResp.text();
          console.error('Gemini API Error:', err);
          return res.status(500).json({ error: 'Gemini Failure: ' + err });
        }
        const geminiData = await geminiResp.json();
        scriptText = geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts[0].text ?
          geminiData.candidates[0].content.parts[0].text : '';
    } catch (geminiErr) {
      console.error('Gemini API Error:', geminiErr.message);
      return res.status(500).json({ error: `Gemini Failure: ${geminiErr.message}` });
    }

    // 2. Transmit transcript over to ElevenLabs TTS Engine
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: scriptText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.75, similarity_boost: 0.85 }
      })
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('ElevenLabs Network Fault:', errText);
      throw new Error('Voice serialization failure.');
    }

    // 3. Convert streaming data into base64 audio format
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    res.json({
      script: scriptText,
      audio: `data:audio/mpeg;base64,${base64Audio}`
    });

  } catch (error) {
    console.error('Server Runtime Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Defect.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SCPD SYSTEM RUNNING]: Active via http://localhost:${PORT}`);
});