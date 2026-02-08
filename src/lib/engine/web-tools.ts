import { Tool, ToolContext, ToolResult } from '@/types/tool';

export const webSearchTool: Tool = {
  id: 'web_search',
  name: 'Web Search',
  description: 'Search the web using Brave Search API. Returns titles, URLs, and snippets.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      count: { type: 'number', description: 'Number of results (1-10, default: 5)' },
    },
    required: ['query'],
  },
  execute: async (params, context) => {
    try {
      const { query, count = 5 } = params;
      const apiKey = process.env.BRAVE_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          output: '',
          error: 'BRAVE_API_KEY not configured',
        };
      }

      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': apiKey,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          output: '',
          error: `Search API error: ${response.status}`,
        };
      }

      const data = await response.json();
      const results = data.web?.results || [];

      const formatted = results.map((r: any, i: number) => ({
        index: i + 1,
        title: r.title,
        url: r.url,
        snippet: r.description,
      }));

      return {
        success: true,
        output: JSON.stringify(formatted, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
};

export const webFetchTool: Tool = {
  id: 'web_fetch',
  name: 'Fetch Web Page',
  description: 'Fetch and extract readable content from a URL (HTML → markdown).',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'HTTP/HTTPS URL to fetch' },
      maxChars: { type: 'number', description: 'Max characters to return (default: 50000)' },
    },
    required: ['url'],
  },
  execute: async (params, context) => {
    try {
      const { url, maxChars = 50000 } = params;

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          success: false,
          output: '',
          error: 'URL must start with http:// or https://',
        };
      }

      // Use Jina AI Reader for clean markdown extraction
      const jinaUrl = `https://r.jina.ai/${url}`;
      
      const response = await fetch(jinaUrl, {
        headers: {
          'Accept': 'text/markdown',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          output: '',
          error: `Failed to fetch: ${response.status}`,
        };
      }

      let content = await response.text();

      // Truncate if needed
      if (content.length > maxChars) {
        content = content.slice(0, maxChars) + '\n\n[Content truncated...]';
      }

      return {
        success: true,
        output: content,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Fetch failed',
      };
    }
  },
};
