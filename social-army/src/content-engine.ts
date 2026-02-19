/**
 * Content Engine v2 — GFXToolz-Powered
 * 
 * Generation priority:
 *   1. GFXToolz.ai (Primary — uses your subscription to 100+ premium tools)
 *   2. Direct API fallback (Gemini/OpenAI if GFXToolz is unavailable)
 *   3. Template engine (Always works, no API needed)
 * 
 * GFXToolz handles: Image generation, video generation, caption writing.
 * The Brand Context file provides persona voice and CubiQo knowledge.
 */

import fs from 'fs';
import path from 'path';

// Load Brand Context
const brandContext = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../config/brand-context.json'), 'utf-8')
);

// Import GFXToolz (CommonJS module)
const GFXToolz = require('./gfxtoolz');

// Singleton GFXToolz instance
let gfxInstance: any = null;

function getGFX(): any {
    if (!gfxInstance) {
        const user = process.env.GFX_TOOLZ_USER;
        const pass = process.env.GFX_TOOLZ_PASS;
        if (user && pass) {
            gfxInstance = new GFXToolz(user, pass);
        }
    }
    return gfxInstance;
}

// ─── Types ───────────────────────────────────────────────
interface GeneratedContent {
    caption: string;
    imagePrompt?: string;
    imageUrl?: string;
    videoUrl?: string;
    contentType: 'text' | 'image' | 'video';
    persona: string;
    platform: string;
    source: 'gfxtoolz' | 'gemini' | 'openai' | 'template';
}

interface ContentRequest {
    campaignTopic: string;
    personaType: string;
    platform: string;
    contentType: 'text' | 'image' | 'video';
}

// ─── Main Generation Pipeline ────────────────────────────
export async function generateContent(request: ContentRequest): Promise<GeneratedContent> {
    console.log(`   🧠 Generating ${request.contentType} content as "${request.personaType}" for ${request.platform}...`);

    const persona = brandContext.personas[request.personaType] || brandContext.personas.builder;

    // Build the full context prompt for any generator
    const contextPrompt = buildContextPrompt(request, persona);

    // ─── Try GFXToolz First (Primary) ──────────────────
    const gfx = getGFX();
    if (gfx) {
        console.log(`   🔧 Using GFXToolz.ai (Primary)`);
        try {
            const result = await generateWithGFXToolz(gfx, request, contextPrompt);
            if (result) return result;
        } catch (err: any) {
            console.log(`   ⚠️  GFXToolz error: ${err.message}. Falling back...`);
        }
    }

    // ─── Fallback: Direct API (Gemini/OpenAI) ──────────
    console.log(`   🔄 Falling back to direct API...`);
    const caption = await generateTextFallback(contextPrompt);
    let imageUrl: string | undefined;

    if (request.contentType === 'image') {
        const imagePrompt = buildImagePrompt(request);
        imageUrl = await generateImageFallback(imagePrompt) || undefined;
    }

    const source = process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'template';

    return {
        caption,
        imageUrl,
        contentType: request.contentType,
        persona: request.personaType,
        platform: request.platform,
        source
    };
}

// ─── GFXToolz Generation ─────────────────────────────────
async function generateWithGFXToolz(
    gfx: any,
    request: ContentRequest,
    contextPrompt: string
): Promise<GeneratedContent | null> {

    // Ensure we're logged in
    const loggedIn = await gfx.login();
    if (!loggedIn) return null;

    // 1. Generate caption using GFXToolz content writer
    const caption = await gfx.generateCaption(request.campaignTopic, request.platform);

    // 2. Generate visual assets based on content type
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;

    if (request.contentType === 'image') {
        const imagePrompt = buildImagePrompt(request);
        const imagePath = await gfx.generateImage(imagePrompt);
        if (imagePath) imageUrl = imagePath; // Local file path
    }

    if (request.contentType === 'video') {
        // Two paths for video:
        // A) AI-generated video from prompt
        // B) Screen-recorded CubiQo interaction + post-processing (commander pipeline)
        const videoPrompt = `${request.campaignTopic} - ${brandContext.brand.name} AI assistant demo, premium dark UI, futuristic`;
        const videoPath = await gfx.generateVideo(videoPrompt);
        if (videoPath) videoUrl = videoPath;
    }

    return {
        caption,
        imageUrl,
        videoUrl,
        contentType: request.contentType,
        persona: request.personaType,
        platform: request.platform,
        source: 'gfxtoolz'
    };
}

// ─── Context Prompt Builder ──────────────────────────────
function buildContextPrompt(request: ContentRequest, persona: any): string {
    const tone = brandContext.tone_guide;

    return `You are a social media content creator for ${brandContext.brand.name} — ${brandContext.brand.tagline}.

BRAND CONTEXT:
${brandContext.brand.description}

KEY FEATURES:
${brandContext.features.map((f: string) => `• ${f}`).join('\n')}

YOUR PERSONA: "${request.personaType}"
VOICE: ${persona.voice}
TOPICS YOU COVER: ${persona.topics.join(', ')}

TONE RULES:
DO: ${tone.do.join(', ')}
DON'T: ${tone.dont.join(', ')}

PLATFORM: ${request.platform} (adjust length and style accordingly)
- Twitter: Max 280 chars, punchy, use 1-2 hashtags
- LinkedIn: Professional, 100-200 words, thought leadership
- TikTok: Casual, hook in first line, trending format
- Instagram: Visual-first caption, use emojis, 5-10 hashtags
- YouTube: Title + description format

EXAMPLE POST IN YOUR VOICE:
"${persona.example_post}"

Generate a single ${request.platform} post about: "${request.campaignTopic}"
Return ONLY the post text, nothing else.`;
}

// ─── Image Prompt Builder ────────────────────────────────
function buildImagePrompt(request: ContentRequest): string {
    const basePrompts = brandContext.image_prompts;
    const promptTypes = Object.keys(basePrompts);
    const selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)];

    let prompt = basePrompts[selectedType as keyof typeof basePrompts];
    prompt = prompt.replace('{feature}', request.campaignTopic);

    return `${prompt}, related to ${request.campaignTopic}`;
}

// ─── Fallback: Direct API Text Generation ────────────────
async function generateTextFallback(prompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
                    })
                }
            );
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || generateTemplate(prompt);
        } catch { return generateTemplate(prompt); }
    }

    if (openaiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8,
                    max_tokens: 500
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || generateTemplate(prompt);
        } catch { return generateTemplate(prompt); }
    }

    return generateTemplate(prompt);
}

// ─── Fallback: Direct API Image Generation ───────────────
async function generateImageFallback(prompt: string): Promise<string | null> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt, n: 1, size: '1024x1024', quality: 'hd'
            })
        });
        const data = await response.json();
        return data.data?.[0]?.url || null;
    } catch { return null; }
}

// ─── Template Engine (Always works) ──────────────────────
function generateTemplate(prompt: string): string {
    const templates = [
        `Building something incredible with ${brandContext.brand.name}. The future of AI is personal. ${brandContext.brand.hashtags[0]}`,
        `${brandContext.brand.name}: ${brandContext.brand.tagline}. Every interaction makes it smarter. ${brandContext.brand.hashtags[0]}`,
        `What if your AI actually understood you? That's what we're building. ${brandContext.brand.hashtags[0]} ${brandContext.brand.hashtags[3]}`,
        `Privacy-first AI that grows with you. No data harvesting, just pure intelligence. ${brandContext.brand.hashtags[0]} ${brandContext.brand.hashtags[4]}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

export { brandContext };
