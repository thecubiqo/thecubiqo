/**
 * Template configuration schema definitions
 */

export interface ColorConfig {
  primary?: string
  secondary?: string
  accent?: string
  [key: string]: string | undefined
}

export interface TextConfig {
  siteName?: string
  tagline?: string
  description?: string
  [key: string]: string | undefined
}

export interface ImageConfig {
  logo?: string
  hero?: string
  [key: string]: string | undefined
}

export interface VideoConfig {
  hero?: string
  [key: string]: string | undefined
}

export interface TemplateConfig {
  colors?: ColorConfig
  text?: TextConfig
  images?: ImageConfig
  videos?: VideoConfig
  [key: string]: any
}

export const defaultConfig: TemplateConfig = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#10b981',
  },
  text: {
    siteName: '',
    tagline: '',
    description: '',
  },
  images: {
    logo: '',
    hero: '',
  },
  videos: {
    hero: '',
  },
}

export function validateConfig(config: any): TemplateConfig {
  return {
    colors: config.colors || defaultConfig.colors,
    text: config.text || defaultConfig.text,
    images: config.images || defaultConfig.images,
    videos: config.videos || defaultConfig.videos,
    ...config,
  }
}

export function mergeConfig(base: TemplateConfig, override: Partial<TemplateConfig>): TemplateConfig {
  return {
    ...base,
    ...override,
    colors: { ...base.colors, ...override.colors },
    text: { ...base.text, ...override.text },
    images: { ...base.images, ...override.images },
    videos: { ...base.videos, ...override.videos },
  }
}

