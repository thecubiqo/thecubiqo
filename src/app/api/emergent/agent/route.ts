/**
 * Emergent Coding Agent API
 *
 * A proper AI coding agent — NOT a chat endpoint.
 * It understands code generation requests, scaffolds entire projects,
 * writes files to the sandbox workspace, and returns structured results.
 *
 * POST /api/emergent/agent
 * Body: { message, workspaceId, history?, context? }
 * Returns: { reply, files_written: [{path, preview}], suggestions }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ensureWorkspace, validatePath } from '@/lib/code-execution/sandbox';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const CODING_SYSTEM_PROMPT = `You are Emergent, an elite AI coding agent embedded in the CubiQo Studio IDE. You build luxury digital products.

MISSION: Scaffold complete, production-ready code. But first — UNDERSTAND what to build.

═══ INTENT DETECTION — DO THIS FIRST ═══
If the user mentions ANY of these keywords without enough detail:
- "luxury brand", "clothing", "fashion", "store", "ecomm", "shop", "apparel", "brand site"

Then ask 3-5 SHORT, targeted questions to gather requirements before building:
Example questions for a luxury brand:
  "What's your brand name?"
  "Color palette? (e.g. all black, cream + black, etc.)"
  "Products? (hoodies, tees, caps, jewelry, accessories?)"
  "Do you have a hero image or logo to use?"
  "Style reference? (Volbak, Zara, Acne Studios, etc.)"

Once you have the answers, BUILD the full thing immediately — don't ask more questions.

═══ CODING RULES ═══
1. ALWAYS output complete file contents — never truncate with "..." or "// rest of code here"
2. Output MULTIPLE files when building apps (layout, page, components, styles, config)
3. Use fenced code blocks with the filename as the first line comment:
   \`\`\`tsx
   // app/page.tsx
   ...code...
   \`\`\`
4. For Next.js: always include app/page.tsx, app/layout.tsx, app/globals.css minimum
5. Use TypeScript + Tailwind CSS + React 19
6. Make designs PREMIUM — dark cinematic aesthetic, massive typography
7. Code must ACTUALLY WORK — no placeholder logic, no TODOs in critical paths
8. After building, give a 2-line summary of what was created and what to do next

═══ LUXURY ECOMM STACK (use when building stores) ═══
- Stripe Checkout for payments (via /api/checkout route)
- Apliiq or Printful for fulfillment (via /api/printful/order)
- Product variants: color + size selectors (XS-XXL)
- Cart: localStorage-persisted slide-out drawer
- Pages: /, /shop, /shop/[slug], /success

═══ DESIGN LANGUAGE ═══
- Background: near-black (#0a0a0a)
- Typography: massive, font-black, tracking-tighter (text-7xl+ for heroes)
- No generic Bootstrap — think Volbak, Acne Studios, A-Cold-Wall aesthetics
- Solid colors, soft luxurious fabric descriptions (not synthetic, not cheap)`;

interface FileWritten {
    path: string;
    content: string;
    preview: string;
}

async function writeFilesToWorkspace(
    files: FileWritten[],
    workspaceId: string,
): Promise<{ path: string; preview: string }[]> {
    const workspaceDir = await ensureWorkspace(workspaceId);
    const written: { path: string; preview: string }[] = [];

    for (const file of files) {
        const validation = validatePath(file.path, workspaceDir);
        if (!validation.allowed) continue;

        const resolvedPath = validation.sanitizedCommand as string;
        await mkdir(dirname(resolvedPath), { recursive: true });
        await writeFile(resolvedPath, file.content, 'utf-8');
        written.push({ path: file.path, preview: file.preview });
    }

    return written;
}

function extractFilesFromResponse(content: string): FileWritten[] {
    const files: FileWritten[] = [];

    // Match ```language\n// filename\n...content...```
    const pattern = /```(?:tsx?|jsx?|css|json|html|md|sh|py|yaml|toml|prisma|env)?\n(?:\/\/ |# )?([^\n]+\.[a-zA-Z]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        const rawPath = match[1].trim();
        const code = match[2].trim();

        // Sanitize path — strip leading slashes, ensure it's relative
        const cleanPath = rawPath.replace(/^\/+/, '').replace(/\.\.\//g, '');
        if (!cleanPath || cleanPath.includes('..')) continue;

        files.push({
            path: cleanPath,
            content: code,
            preview: code.slice(0, 120) + (code.length > 120 ? '…' : ''),
        });
    }

    return files;
}

export async function POST(request: NextRequest) {
    try {
        // Allow guest access — auth is optional for the coding agent
        let userId = 'guest';
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch { /* guest mode */ }

        const body = await request.json();
        const { message, workspaceId, history = [], context = 'studio' } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
        }

        // Build message history for the AI
        const historyMessages = (history as { role: string; content: string }[])
            .slice(-12)
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        // SCAN WORKSPACE - Give the agent "eyes"
        let workspaceContext = "";
        try {
            const workspaceDir = await ensureWorkspace(workspaceId);
            const entries = await readdir(workspaceDir, { recursive: true, withFileTypes: true });
            const files = entries
                .filter(e => e.isFile())
                .map(e => e.name); // Simplified, ideally relative path

            if (files.length > 0) {
                workspaceContext = `\n\n═══ CURRENT WORKSPACE FILES ═══\n${files.join('\n')}\n\nYou can see these files already exist. If the user asks to modify one, use its existing logic as a base.`;
            }
        } catch (err) {
            console.error('[Agent] Workspace scan failed:', err);
        }

        const allMessages = [
            ...historyMessages,
            { role: 'user' as const, content: message },
        ];

        const systemPromptWithContext = CODING_SYSTEM_PROMPT + workspaceContext;

        // Try Anthropic Claude (best for code)
        let aiResponse = '';
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        if (anthropicKey) {
            try {
                const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': anthropicKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 8192,
                        system: systemPromptWithContext,
                        messages: allMessages,
                    }),
                });

                if (resp.ok) {
                    const data = await resp.json();
                    aiResponse = data.content?.[0]?.text ?? '';
                }
            } catch (err) {
                console.error('[Agent] Anthropic failed:', err);
            }
        }

        // Fallback to OpenRouter (supports many models)
        if (!aiResponse) {
            const openrouterKey = process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY;
            if (openrouterKey) {
                try {
                    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openrouterKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://cubiqo.ai',
                        },
                        body: JSON.stringify({
                            model: 'anthropic/claude-3.5-sonnet',
                            max_tokens: 8192,
                            messages: [
                                { role: 'system', content: systemPromptWithContext },
                                ...allMessages,
                            ],
                        }),
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        aiResponse = data.choices?.[0]?.message?.content ?? '';
                    }
                } catch (err) {
                    console.error('[Agent] OpenRouter failed:', err);
                }
            }
        }

        // Final fallback — OpenAI
        if (!aiResponse) {
            const openaiKey = process.env.OPENAI_API_KEY;
            if (openaiKey) {
                try {
                    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openaiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            max_tokens: 8192,
                            messages: [
                                { role: 'system', content: systemPromptWithContext },
                                ...allMessages,
                            ],
                        }),
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        aiResponse = data.choices?.[0]?.message?.content ?? '';
                    }
                } catch (err) {
                    console.error('[Agent] OpenAI failed:', err);
                }
            }
        }

        if (!aiResponse) {
            return NextResponse.json(
                { error: 'All AI providers failed. Check API keys in Vercel environment variables.' },
                { status: 503 }
            );
        }

        // Extract and write files from response
        const extractedFiles = extractFilesFromResponse(aiResponse);
        let filesWritten: { path: string; preview: string }[] = [];

        if (extractedFiles.length > 0) {
            filesWritten = await writeFilesToWorkspace(extractedFiles, workspaceId);
        }

        return NextResponse.json({
            reply: aiResponse,
            files_written: filesWritten,
            model_used: anthropicKey ? 'claude-3-5-sonnet' : 'openai/gpt-4o',
        });

    } catch (error) {
        console.error('[Agent] Unexpected error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
