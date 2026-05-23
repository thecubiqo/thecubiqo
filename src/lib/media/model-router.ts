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
    return {
      model: process.env.MEDIA_IMAGE_MODEL || 'flux_2_schnell',
      provider: 'fal_ai',
      endpoint: 'https://fal.run/fal-ai/flux/schnell'
    };
  }

  if (normalized === 'audio') {
    return {
      model: 'eleven_multilingual_v2',
      provider: 'elevenlabs',
      endpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
    };
  }

  return {
    model: process.env.MEDIA_VIDEO_MODEL || 'gen3a_turbo',
    provider: 'runway',
    endpoint: 'https://api.runwayml.com/v1/image_to_video'
  };
}
