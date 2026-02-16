// Founders Pass: Preview mode helpers

import { cookies } from 'next/headers';
import type { FeatureFlag } from './types';

const PREVIEW_COOKIE = 'fp_preview';
const PREVIEW_PARAM = 'fp_preview';

export interface PreviewContext {
  isPreview: boolean;
  overrides: Record<string, boolean>;
}

/**
 * Parse preview overrides from URL search params.
 * Format: ?fp_preview=flag1:1,flag2:0
 */
export function parsePreviewParams(searchParams: URLSearchParams): Record<string, boolean> {
  const raw = searchParams.get(PREVIEW_PARAM);
  if (!raw) return {};
  const overrides: Record<string, boolean> = {};
  for (const pair of raw.split(',')) {
    const [key, val] = pair.split(':');
    if (key) overrides[key] = val !== '0';
  }
  return overrides;
}

/**
 * Build a preview URL for a site with specific flag overrides.
 */
export function buildPreviewUrl(
  baseUrl: string,
  overrides: Record<string, boolean>,
): string {
  const pairs = Object.entries(overrides)
    .map(([k, v]) => `${k}:${v ? '1' : '0'}`)
    .join(',');
  const url = new URL(baseUrl);
  url.searchParams.set(PREVIEW_PARAM, pairs);
  return url.toString();
}

/**
 * Get preview context from cookies (server component).
 */
export async function getPreviewFromCookies(): Promise<Record<string, boolean>> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(PREVIEW_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Apply preview overrides on top of resolved flags.
 */
export function applyPreviewOverrides(
  resolved: Record<string, boolean>,
  preview: Record<string, boolean>,
): Record<string, boolean> {
  return { ...resolved, ...preview };
}

/**
 * Serialize flags into a preview cookie value.
 */
export function serializePreviewCookie(overrides: Record<string, boolean>): string {
  return JSON.stringify(overrides);
}

/**
 * Generate a shareable preview link for admin use.
 */
export function generatePreviewLink(
  siteSlug: string,
  flags: FeatureFlag[],
  enabledKeys: string[],
): string {
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sites/${siteSlug}`;
  const overrides: Record<string, boolean> = {};
  for (const flag of flags) {
    overrides[flag.key] = enabledKeys.includes(flag.key);
  }
  return buildPreviewUrl(baseUrl, overrides);
}
