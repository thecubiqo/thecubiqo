/**
 * 🚀 Development Proxy Server
 *
 * Proxies API requests to Anthropic to avoid CORS issues
 * This is for local development only. In production, use Vercel Serverless Functions.
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for Claude API
app.post('/api/chat', async (req, res) => {
  try {
    const { apiKey, messages, systemPrompt } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    console.log('📡 Proxying request to Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    console.log('✅ Claude API response received');
    res.json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/chat`);
});
