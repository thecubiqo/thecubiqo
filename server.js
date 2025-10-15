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

// Proxy endpoint for Claude API with Prompt Caching
app.post('/api/chat', async (req, res) => {
  try {
    const { apiKey, messages, systemPrompt } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    console.log('📡 Proxying request to Claude API with prompt caching...');

    // Build request with prompt caching
    // System prompt cached for 1 hour, last message cached for 5 minutes
    const systemCached = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }  // Cache for 5 minutes (default)
      }
    ];

    // Transform messages to content blocks format with caching
    const structuredMessages = messages.map((msg, index) => {
      const contentBlocks = [
        {
          type: 'text',
          text: msg.content
        }
      ];

      // Cache last message for 5 minutes
      if (index === messages.length - 1 && messages.length > 1) {
        contentBlocks[0].cache_control = { type: 'ephemeral' };
      }

      return {
        role: msg.role,
        content: contentBlocks
      };
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'  // Enable prompt caching
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',  // Updated to latest Sonnet 4.5
        max_tokens: 200,
        system: systemCached,
        messages: structuredMessages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Claude API error:', error);
      return res.status(response.status).json(error);
    }

    const data = await response.json();

    // Log cache usage statistics
    const usage = data.usage || {};
    console.log('✅ Claude API response received');
    console.log(`📊 Tokens: input=${usage.input_tokens || 0}, output=${usage.output_tokens || 0}`);
    console.log(`💾 Cache: read=${usage.cache_read_input_tokens || 0}, created=${usage.cache_creation_input_tokens || 0}`);

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
