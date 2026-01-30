/**
 * Deployment configuration loader
 * Loads configuration from deployment-config.json or environment variables
 */

export interface DeploymentConfig {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  text?: {
    siteName?: string
    tagline?: string
    description?: string
  }
  images?: {
    logo?: string
    hero?: string
  }
  videos?: {
    hero?: string
  }
}

let cachedConfig: DeploymentConfig | null = null

export async function getDeploymentConfig(): Promise<DeploymentConfig> {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Try to load from deployment-config.json
    const configModule = await import('@/config/deployment-config.json')
    cachedConfig = configModule.default || configModule
    return cachedConfig
  } catch (error) {
    // Fallback to default config
    console.warn('Could not load deployment config, using defaults')
    cachedConfig = {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
      },
      text: {
        siteName: 'My Site',
        tagline: 'Welcome',
        description: '',
      },
      images: {},
      videos: {},
    }
    return cachedConfig
  }
}

export function getConfigSync(): DeploymentConfig {
  if (cachedConfig) {
    return cachedConfig
  }
  // Return defaults if not loaded yet
  return {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#10b981',
    },
    text: {
      siteName: 'My Site',
      tagline: 'Welcome',
      description: '',
    },
    images: {},
    videos: {},
  }
}

