import type { MediaType } from '@/next/types/media';

export interface MediaModelConfig {
  model: string;
  provider: 'fal_ai' | 'openai' | 'elevenlabs' | 'runway' | 'mock';
  endpoint: string;
  maxTokens?: number;
}

export function normalizeMediaType(mediaType: MediaType): 'image' | 'audio' | 'video' {
  return mediaType === 'video_clip' ? 'video' : mediaType;
}

export function routeMediaModel(mediaType: MediaType, style?: string): MediaModelConfig {
  const normalized = normalizeMediaType(mediaType);
  if (process.env.TEST_MODE === 'true' || process.env.TEST_ALLOW_LIVE_PROVIDERS !== 'true') {
    return {
      model: `mock-${normalized}${style ? `-${style}` : ''}`,
      provider: 'mock',
      endpoint: 'mock://media-generation'
    };
  }

  if (normalized === 'image') {
    // Canonical per Phase A §5.8: default = Flux 2 Pro (best quality/cost balance).
    // Speed-priority style routes to Schnell. GPT Image 1.5 is an alternate.
    const env = process.env.MEDIA_IMAGE_MODEL;
    if (env) {
      return { model: env, provider: 'fal_ai', endpoint: 'https://fal.run/fal-ai/flux/dev' };
    }
    if (style === 'speed') {
      return { model: 'flux_2_schnell', provider: 'fal_ai', endpoint: 'https://fal.run/fal-ai/flux/schnell' };
    }
    if (style === 'text-legibility') {
      return { model: 'ideogram_v3', provider: 'fal_ai', endpoint: 'https://fal.run/fal-ai/ideogram/v3' };
    }
    if (style === 'gpt') {
      return { model: 'gpt_image_1_5', provider: 'openai', endpoint: 'https://api.openai.com/v1/images/generations' };
    }
    return { model: 'flux_2_pro', provider: 'fal_ai', endpoint: 'https://fal.run/fal-ai/flux/dev' };
  }

  if (normalized === 'audio') {
    return {
      model: 'eleven_multilingual_v2',
      provider: 'elevenlabs',
      endpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
    };
  }

  // Video — canonical default = Kling 3.0; Runway gen3a_turbo as alternate.
  if (process.env.MEDIA_VIDEO_MODEL === 'gen3a_turbo') {
    return { model: 'gen3a_turbo', provider: 'runway', endpoint: 'https://api.runwayml.com/v1/image_to_video' };
  }
  return {
    model: process.env.MEDIA_VIDEO_MODEL || 'kling_3_0',
    provider: 'fal_ai',
    endpoint: 'https://fal.run/fal-ai/kling-video/v1.6/standard/text-to-video'
  };
}
