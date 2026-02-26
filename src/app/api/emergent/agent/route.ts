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
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ensureWorkspace, validatePath } from '@/lib/code-execution/sandbox';
import { ENV } from '@/lib/config/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const CODING_SYSTEM_PROMPT = `You are Emergent, an elite AI coding agent embedded in the CubiQo Studio IDE.

MISSION: When asked to build something, you SCAFFOLD ENTIRE PROJECTS — real, working code with proper file structure.

RULES:
1. ALWAYS output complete file contents, never truncate with "..." or "// rest of code here"
2. Output MULTIPLE files when building apps (layout, page, components, styles, config)
3. Use fenced code blocks with the filename as the first line comment: \`\`\`tsx\n// app/page.tsx\n...\`\`\`
4. For Next.js projects: always include app/page.tsx, app/layout.tsx, app/globals.css minimum
5. Use TypeScript, Tailwind CSS, and modern React 19 patterns
6. Make designs PREMIUM — dark themes, cinematic typography, bold aesthetics
7. Code must ACTUALLY WORK — no placeholders, no TODOs in critical logic
8. After writing files, give a brief 1-2 sentence summary of what was built

DESIGN LANGUAGE for premium/luxury builds:
- Background: near-black (#0a0a0a or similar)
- Typography: massive, bold, tracking-tight headlines
- Animations: subtle but impactful (framer-motion or CSS)
- No generic Bootstrap look — think Volbak, Vercel, Linear aesthetics

When the user asks to "build X like Y", you fully scaffold a production-ready version.`;

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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        // Allow unauthenticated for now (guest mode)
        const userId = user?.id ?? 'guest';

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

        const allMessages = [
            ...historyMessages,
            { role: 'user' as const, content: message },
        ];

        // Try Anthropic Claude (best for code)
        let aiResponse = '';
        const anthropicKey = ENV.anthropic?.apiKey;

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
                        system: CODING_SYSTEM_PROMPT,
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
                                { role: 'system', content: CODING_SYSTEM_PROMPT },
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
                                { role: 'system', content: CODING_SYSTEM_PROMPT },
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
