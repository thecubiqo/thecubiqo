/**
 * Vercel Serverless Function for Claude API
 * Replaces development proxy server (server.js)
 *
 * Endpoint: /api/chat
 * Method: POST
 * Body: { apiKey, systemPrompt, messages }
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, messages } = req.body;

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Validate inputs
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: API key not configured'
      });
    }

    if (!systemPrompt || !messages) {
      return res.status(400).json({
        error: 'Missing required fields: systemPrompt, messages'
      });
    }

    console.log('📡 Proxying request to Claude API...');

    // Structure system prompt with cache control (first block cached)
    const systemCached = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' } // Cache for 5 minutes
      }
    ];

    // Structure messages with cache control (last message cached)
    const structuredMessages = messages.map((msg, index) => {
      const contentBlocks = [
        {
          type: 'text',
          text: msg.content
        }
      ];

      // Cache the last message for 5 minutes (if there's more than 1 message)
      if (index === messages.length - 1 && messages.length > 1) {
        contentBlocks[0].cache_control = { type: 'ephemeral' };
      }

      return {
        role: msg.role,
        content: contentBlocks
      };
    });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 200,
        system: systemCached,
        messages: structuredMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Claude API error:', errorData);
      return res.status(response.status).json({
        error: errorData
      });
    }

    const data = await response.json();

    // Log cache usage for debugging
    const usage = data.usage;
    if (usage) {
      console.log('📊 Token usage:', {
        input: usage.input_tokens,
        output: usage.output_tokens,
        cacheCreation: usage.cache_creation_input_tokens || 0,
        cacheRead: usage.cache_read_input_tokens || 0
      });

      if (usage.cache_read_input_tokens > 0) {
        console.log('✅ Cache hit! Saved', usage.cache_read_input_tokens, 'tokens');
      }
    }

    console.log('✅ Claude API response received');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error'
      }
    });
  }
}
