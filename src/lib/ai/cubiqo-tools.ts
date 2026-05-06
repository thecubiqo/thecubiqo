import { tool } from 'ai';
import { z } from 'zod';

const goalTerms = ['linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume'];
const casualTerms = ['instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood'];
const gatedTerms = ['grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'];

function hits(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

export const cubiqoTools = {
  runtimeStatus: tool({
    description: 'Report the current CubiQo QA runtime stack and major enabled capabilities.',
    inputSchema: z.object({}),
    execute: async () => ({
      app: 'cq.ai / CubiQo QA',
      stack: 'Next.js App Router + TypeScript + Supabase client + Vercel route handlers',
      aiLayer: 'Vercel AI SDK tool layer with legacy /api/converse retained for regression',
      currentLegacyModules: ['daily-journal-cta', 'rgy-keywords', 'voice-cue', 'supabase-auth-client'],
      migrationBranch: 'QA/lagacy_feature_branch'
    })
  }),
  classifyRGY: tool({
    description: 'Classify text into CubiQo RGY operational keyword bands.',
    inputSchema: z.object({
      text: z.string().describe('User text or assistant text to classify')
    }),
    execute: async ({ text }) => ({
      green: hits(text, goalTerms),
      yellow: hits(text, casualTerms),
      red: hits(text, gatedTerms)
    })
  })
};
