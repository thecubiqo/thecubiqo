/**
 * Content Engine
 * Generates text, image prompts, and video scripts for social media posts.
 * 
 * Uses:
 * - Gemini / OpenAI for text generation
 * - DALL-E / Stability AI for image generation
 * - Brand Context for persona-aware content
 */

import fs from 'fs';
import path from 'path';

// Load Brand Context
const brandContext = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../config/brand-context.json'), 'utf-8')
);

// ─── Types ───────────────────────────────────────────────
interface GeneratedContent {
    caption: string;
    imagePrompt?: string;
    imageUrl?: string;
    contentType: 'text' | 'image' | 'video';
    persona: string;
    platform: string;
}

interface ContentRequest {
    campaignTopic: string;
    personaType: string;
    platform: string;
    contentType: 'text' | 'image' | 'video';
}

// ─── Text Generation ─────────────────────────────────────
async function generateText(request: ContentRequest): Promise<string> {
    const persona = brandContext.personas[request.personaType] || brandContext.personas.builder;
    const tone = brandContext.tone_guide;

    const systemPrompt = `You are a social media content creator for ${brandContext.brand.name} — ${brandContext.brand.tagline}.

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

    // ─── API Call ───
    // Try Gemini first, fall back to OpenAI
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
        return await callGemini(systemPrompt, geminiKey);
    } else if (openaiKey) {
        return await callOpenAI(systemPrompt, openaiKey);
    } else {
        // Fallback: Use template-based generation (no API key needed)
        return generateFromTemplate(request, persona);
    }
}

// ─── Gemini API ──────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<string> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Content generation failed.';
    } catch (err) {
        console.error('Gemini API error:', err);
        return 'Content generation failed.';
    }
}

// ─── OpenAI API ──────────────────────────────────────────
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 500
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'Content generation failed.';
    } catch (err) {
        console.error('OpenAI API error:', err);
        return 'Content generation failed.';
    }
}

// ─── Template Fallback (No API Key) ─────────────────────
function generateFromTemplate(request: ContentRequest, persona: any): string {
    const templates: Record<string, string[]> = {
        builder: [
            `🔧 Working on ${request.campaignTopic} at ${brandContext.brand.name}. The architecture behind this is fascinating. ${brandContext.brand.hashtags[0]}`,
            `Just shipped a new update to ${brandContext.brand.name}'s ${request.campaignTopic}. Clean code, solid performance. ${brandContext.brand.hashtags[0]} #BuildInPublic`,
            `Deep dive into how we built ${request.campaignTopic}. Spoiler: it involved a lot of coffee and TypeScript. ☕ ${brandContext.brand.hashtags[0]}`
        ],
        guru: [
            `The future of AI isn't about replacing humans — it's about augmenting human potential. That's why ${request.campaignTopic} matters. ${brandContext.brand.hashtags[0]}`,
            `${request.campaignTopic} is just the beginning. The real question is: how do we build AI that truly understands us? ${brandContext.brand.hashtags[0]} ${brandContext.brand.hashtags[3]}`,
        ],
        philosopher: [
            `What does it mean when AI can remember your conversations better than you can? Exploring ${request.campaignTopic}. ${brandContext.brand.hashtags[0]}`,
            `In a world of disposable technology, we're building something that grows with you. ${request.campaignTopic}. 🤔 ${brandContext.brand.hashtags[0]}`,
        ],
        artist: [
            `✨ New visual update for ${brandContext.brand.name}. ${request.campaignTopic} — every pixel matters. ${brandContext.brand.hashtags[0]}`,
            `The intersection of art and AI. ${request.campaignTopic} pushed our design language to new heights. ${brandContext.brand.hashtags[0]}`,
        ],
        memer: [
            `POV: You asked CubiQo about ${request.campaignTopic} and now you're 2 hours deep into a conversation 😅 ${brandContext.brand.hashtags[0]}`,
            `Nobody:\\nAbsolutely nobody:\\nMe at 3am: "Hey CubiQo, tell me about ${request.campaignTopic}" 🤖 ${brandContext.brand.hashtags[0]}`,
        ]
    };

    const personaTemplates = templates[request.personaType] || templates.builder;
    return personaTemplates[Math.floor(Math.random() * personaTemplates.length)];
}

// ─── Image Generation ────────────────────────────────────
async function generateImagePrompt(request: ContentRequest): Promise<string> {
    const basePrompts = brandContext.image_prompts;
    const promptTypes = Object.keys(basePrompts);
    const selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)];

    let prompt = basePrompts[selectedType as keyof typeof basePrompts];
    prompt = prompt.replace('{feature}', request.campaignTopic);

    return `${prompt}, related to ${request.campaignTopic}`;
}

async function generateImage(prompt: string): Promise<string | null> {
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
        console.log('   ⚠️  No OPENAI_API_KEY set. Skipping image generation.');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024',
                quality: 'hd'
            })
        });
        const data = await response.json();
        return data.data?.[0]?.url || null;
    } catch (err) {
        console.error('Image generation error:', err);
        return null;
    }
}

// ─── Main Export ─────────────────────────────────────────
export async function generateContent(request: ContentRequest): Promise<GeneratedContent> {
    console.log(`   🧠 Generating ${request.contentType} content as "${request.personaType}" for ${request.platform}...`);

    // 1. Generate text caption
    const caption = await generateText(request);

    // 2. Generate image if needed
    let imagePrompt: string | undefined;
    let imageUrl: string | undefined;

    if (request.contentType === 'image' || request.contentType === 'video') {
        imagePrompt = await generateImagePrompt(request);
        const url = await generateImage(imagePrompt);
        if (url) imageUrl = url;
    }

    return {
        caption,
        imagePrompt,
        imageUrl,
        contentType: request.contentType,
        persona: request.personaType,
        platform: request.platform
    };
}

export { brandContext };
