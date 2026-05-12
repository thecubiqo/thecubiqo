import https from 'https';
import { NextRequest, NextResponse } from 'next/server';
import { getModel } from '@/next/lib/config/llm';

const cleanEnv = (...values: Array<string | undefined>) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

function httpsPost(url: string, headers: Record<string, string>, body: string) {
  return new Promise<string>((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
      },
      res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 240)}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const fallbackQuestions = [
  'What is most present for you right now?',
  'Where do you feel energy, pressure, or resistance today?',
  'What is one thing you want to understand about this moment?',
  'What would make the next 24 hours feel cleaner or more complete?'
];

function compact(value: unknown) {
  return String(value || '').trim();
}

function detectColor(text: string) {
  const lower = text.toLowerCase();
  if (/(adult|explicit|grindr|tinder|hookup|nsfw|private dating)/.test(lower)) return 'red';
  if (/(career|build|ship|learn|health|focus|work|plan|train|wellness|grow|launch|study|interview|journal)/.test(lower)) {
    return 'green';
  }
  return 'yellow';
}

function extractTags(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !['this', 'that', 'with', 'from', 'what', 'when', 'where', 'want', 'feel'].includes(word));
  return [...new Set(['guided-journal', ...words])].slice(0, 8);
}

function fallbackSummary(intake: string, answers: string[]) {
  const text = [intake, ...answers].map(compact).filter(Boolean).join('\n');
  const color = detectColor(text);
  const first = answers.find(Boolean) || intake || 'Daily Journal';
  const title = first.split(/[.!?]/)[0].slice(0, 82) || 'Guided Journal';
  const summary = answers
    .map((answer, index) => `Q${index + 1}: ${answer}`)
    .join('\n');

  return {
    title,
    summary: summary || text,
    content: [
      intake ? `Quick intake: ${intake}` : '',
      summary ? `Guided notes:\n${summary}` : '',
      'Closing note: choose one grounded next move and keep it small enough to begin.'
    ].filter(Boolean).join('\n\n'),
    mood: intake.slice(0, 80) || null,
    tags: extractTags(text),
    rgyColor: color,
    modelUsed: 'local-guided-journal'
  };
}

async function llmSummary(intake: string, answers: string[]) {
  const key = cleanEnv(process.env.OPENAI_API_KEY, process.env.OPENAI_KEY, process.env.AI_API_KEY);
  if (!key) return null;

  const model = getModel('rgy');
  const raw = await httpsPost(
    'https://api.openai.com/v1/chat/completions',
    {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    JSON.stringify({
      model,
      max_completion_tokens: 650,
      messages: [
        {
          role: 'system',
          content:
            'You summarize a guided CubiQo journal session. Return strict JSON only with title, summary, content, mood, tags, and rgyColor. rgyColor must be green, yellow, or red. Do not add therapy claims.'
        },
        {
          role: 'user',
          content: JSON.stringify({ intake, answers })
        }
      ]
    })
  );

  const text = JSON.parse(raw).choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: compact(parsed.title).slice(0, 120) || 'Guided Journal',
    summary: compact(parsed.summary),
    content: compact(parsed.content || parsed.summary),
    mood: parsed.mood ? compact(parsed.mood).slice(0, 80) : null,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(compact).filter(Boolean).slice(0, 8) : [],
    rgyColor: ['green', 'yellow', 'red'].includes(parsed.rgyColor) ? parsed.rgyColor : detectColor(`${intake} ${answers.join(' ')}`),
    modelUsed: model
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const mode = compact(body.mode || 'next');
  const intake = compact(body.intake);
  const answers = Array.isArray(body.answers)
    ? body.answers
      .map((item: unknown) => {
        if (item && typeof item === 'object' && 'answer' in item) {
          return compact((item as { answer?: unknown }).answer);
        }
        return compact(item);
      })
      .filter(Boolean)
      .slice(0, 8)
    : [];

  if (mode === 'summary') {
    const fallback = fallbackSummary(intake, answers);
    try {
      const llm = await llmSummary(intake, answers);
      return NextResponse.json({ summary: llm || fallback, llmAvailable: Boolean(llm) });
    } catch (error) {
      return NextResponse.json({
        summary: fallback,
        llmAvailable: false,
        warning: String(error instanceof Error ? error.message : error).slice(0, 180)
      });
    }
  }

  const nextIndex = Math.min(answers.length, fallbackQuestions.length - 1);
  return NextResponse.json({
    question: fallbackQuestions[nextIndex],
    questionIndex: nextIndex,
    totalQuestions: fallbackQuestions.length,
    done: answers.length >= fallbackQuestions.length
  });
}
