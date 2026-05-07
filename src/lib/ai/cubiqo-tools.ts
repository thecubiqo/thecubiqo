import { tool } from 'ai';
import { z } from 'zod';
import { repoListRoutes, repoReadFile, repoSearch, repoStackSummary, runtimeStatus } from './repo-inspection';

const goalTerms = ['linkedin', 'career', 'yoga', 'wellness', 'build', 'ship', 'launch', 'job', 'resume'];
const casualTerms = ['instagram', 'facebook', 'fb', 'insta', 'comfort', 'chat', 'friends', 'mood'];
const gatedTerms = ['grindr', 'tinder', 'adult', 'explicit', 'nsfw', 'hookup'];

function hits(input: string, terms: string[]) {
  const lower = input.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

export const cubiqoTools = {
  runtimeStatus: tool({
    description: 'Inspect the current CubiQo runtime stack and major enabled capabilities without exposing secrets.',
    inputSchema: z.object({}),
    execute: async () => runtimeStatus()
  }),
  repoStackSummary: tool({
    description: 'Inspect package.json, framework dependencies, scripts, and actual Next.js routes.',
    inputSchema: z.object({}),
    execute: async () => repoStackSummary()
  }),
  repoListRoutes: tool({
    description: 'List actual Next.js page and API routes from src/app.',
    inputSchema: z.object({}),
    execute: async () => repoListRoutes()
  }),
  repoSearch: tool({
    description: 'Search readable repo files. Secret-like files and build artifacts are excluded.',
    inputSchema: z.object({
      query: z.string().min(2).max(80)
    }),
    execute: async ({ query }) => repoSearch(query)
  }),
  repoReadFile: tool({
    description: 'Read one non-secret repo file by relative path.',
    inputSchema: z.object({
      path: z.string().min(1).max(180)
    }),
    execute: async ({ path }) => repoReadFile(path)
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
