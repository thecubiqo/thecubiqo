import { Tool, ToolContext, ToolResult } from '@/types/tool';

// Browser relay configuration
const BROWSER_RELAY_URL = process.env.BROWSER_RELAY_URL || 'http://127.0.0.1:18791';
const BROWSER_RELAY_TOKEN = process.env.BROWSER_RELAY_TOKEN || '';

interface BrowserParams {
  action: 'list_tabs' | 'navigate' | 'click' | 'type' | 'screenshot' | 'get_content' | 'close_tab';
  tabId?: number;
  url?: string;
  selector?: string;
  text?: string;
  waitAfter?: number;
}

/**
 * Browser Tool - Control Chrome tabs via browser relay
 * 
 * This tool enables the agent to interact with web browsers through the browser relay service.
 * It supports tab management, navigation, element interaction, and content extraction.
 */
export const browserTool: Tool = {
  id: 'browser',
  name: 'Browser Control',
  description: 'Control Chrome browser tabs via relay: list tabs, navigate, click elements, type text, take screenshots, get page content, close tabs. Use for web automation and research tasks.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list_tabs', 'navigate', 'click', 'type', 'screenshot', 'get_content', 'close_tab'],
        description: 'Browser action to perform',
      },
      tabId: {
        type: 'number',
        description: 'Tab ID (required for navigate, click, type, screenshot, get_content, close_tab)',
      },
      url: {
        type: 'string',
        description: 'URL to navigate to (required for navigate action)',
      },
      selector: {
        type: 'string',
        description: 'CSS selector for element (required for click, type actions)',
      },
      text: {
        type: 'string',
        description: 'Text to type (required for type action)',
      },
      waitAfter: {
        type: 'number',
        description: 'Milliseconds to wait after action (optional, default: 1000 for navigate/click)',
      },
    },
    required: ['action'],
  },
  execute: async (params: BrowserParams, context: ToolContext): Promise<ToolResult> => {
    const { action, tabId, url, selector, text, waitAfter } = params;

    // Helper to make API requests to the relay
    async function relayRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        if (BROWSER_RELAY_TOKEN) {
          headers['Authorization'] = `Bearer ${BROWSER_RELAY_TOKEN}`;
        }

        const response = await fetch(`${BROWSER_RELAY_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Browser relay error: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        
        // For binary data (screenshots)
        if (contentType?.includes('image/')) {
          const blob = await response.blob();
          const buffer = await blob.arrayBuffer();
          return Buffer.from(buffer).toString('base64');
        }

        return await response.text();
      } catch (error) {
        throw new Error(`Failed to connect to browser relay: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      switch (action) {
        case 'list_tabs': {
          const response = await relayRequest('/tabs');
          // Handle both array and object responses
          const tabs = Array.isArray(response) ? response : (response.tabs || []);
          const running = typeof response === 'object' && 'running' in response ? response.running : true;
          
          return {
            success: true,
            output: JSON.stringify({
              tabs,
              count: tabs.length,
              running,
              message: `Found ${tabs.length} open tab(s)${running ? '' : ' (relay not connected to browser)'}`,
            }, null, 2),
          };
        }

        case 'navigate': {
          if (!tabId || !url) {
            return {
              success: false,
              output: '',
              error: 'navigate action requires tabId and url parameters',
            };
          }
          
          await relayRequest(`/tabs/${tabId}/navigate`, 'POST', { url });
          
          // Default wait for page load
          const wait = waitAfter ?? 2000;
          await new Promise(resolve => setTimeout(resolve, wait));
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Navigated tab ${tabId} to ${url}`,
              tabId,
              url,
            }, null, 2),
          };
        }

        case 'click': {
          if (!tabId || !selector) {
            return {
              success: false,
              output: '',
              error: 'click action requires tabId and selector parameters',
            };
          }
          
          await relayRequest(`/tabs/${tabId}/click`, 'POST', { selector });
          
          // Default wait for action to complete
          const wait = waitAfter ?? 1000;
          await new Promise(resolve => setTimeout(resolve, wait));
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Clicked element "${selector}" in tab ${tabId}`,
              tabId,
              selector,
            }, null, 2),
          };
        }

        case 'type': {
          if (!tabId || !selector || text === undefined) {
            return {
              success: false,
              output: '',
              error: 'type action requires tabId, selector, and text parameters',
            };
          }
          
          await relayRequest(`/tabs/${tabId}/type`, 'POST', { selector, text });
          
          // Optional wait after typing
          if (waitAfter) {
            await new Promise(resolve => setTimeout(resolve, waitAfter));
          }
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Typed text into element "${selector}" in tab ${tabId}`,
              tabId,
              selector,
              textLength: text.length,
            }, null, 2),
          };
        }

        case 'screenshot': {
          if (!tabId) {
            return {
              success: false,
              output: '',
              error: 'screenshot action requires tabId parameter',
            };
          }
          
          const base64Image = await relayRequest(`/tabs/${tabId}/screenshot`);
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Screenshot captured for tab ${tabId}`,
              tabId,
              screenshot: `data:image/png;base64,${base64Image}`,
              note: 'Screenshot data is base64-encoded PNG',
            }, null, 2),
          };
        }

        case 'get_content': {
          if (!tabId) {
            return {
              success: false,
              output: '',
              error: 'get_content action requires tabId parameter',
            };
          }
          
          const content = await relayRequest(`/tabs/${tabId}/content`);
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Retrieved content from tab ${tabId}`,
              tabId,
              content,
              contentLength: typeof content === 'string' ? content.length : 0,
            }, null, 2),
          };
        }

        case 'close_tab': {
          if (!tabId) {
            return {
              success: false,
              output: '',
              error: 'close_tab action requires tabId parameter',
            };
          }
          
          await relayRequest(`/tabs/${tabId}/close`, 'POST');
          
          return {
            success: true,
            output: JSON.stringify({
              message: `Closed tab ${tabId}`,
              tabId,
            }, null, 2),
          };
        }

        default:
          return {
            success: false,
            output: '',
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
