/**
 * Settings management - system-wide configuration
 */

import { prisma } from './db'

export interface Settings {
  certbotEmail: string
  [key: string]: string
}

const DEFAULT_SETTINGS: Record<string, string> = {
  certbotEmail: 'admin@example.com',
  serverIp: '',
}

/**
 * Get a setting value
 */
export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  })

  if (setting) {
    return setting.value
  }

  // Return default if exists
  if (key in DEFAULT_SETTINGS) {
    return DEFAULT_SETTINGS[key]
  }

  // Fallback to environment variable for backward compatibility
  const envKey = key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '')
  return process.env[envKey] || ''
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany()
  const result: Record<string, string> = {}

  // Start with defaults
  Object.assign(result, DEFAULT_SETTINGS)

  // Override with database values
  for (const setting of settings) {
    result[setting.key] = setting.value
  }

  // Fill in from environment variables if not in DB
  for (const key in DEFAULT_SETTINGS) {
    if (!(key in result) || !result[key]) {
      const envKey = key.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '')
      if (process.env[envKey]) {
        result[key] = process.env[envKey]
      }
    }
  }

  return result
}

/**
 * Get Certbot email (with fallback to env)
 */
export async function getCertbotEmail(): Promise<string> {
  const email = await getSetting('certbotEmail')
  if (email) {
    return email
  }
  // Fallback to environment variable
  return process.env.CERTBOT_EMAIL || 'admin@example.com'
}

/**
 * Get server IP (with fallback to env)
 */
export async function getServerIp(): Promise<string> {
  const ip = await getSetting('serverIp')
  if (ip) {
    return ip
  }
  // Fallback to environment variable
  return process.env.SERVER_IP || ''
}

/**
 * Get Google Analytics Service Account credentials (with fallback to env)
 */
export async function getGoogleAnalyticsServiceAccount(): Promise<string> {
  // Check for the key used in settings page first
  let credentials = await getSetting('GOOGLE_ANALYTICS_CREDENTIALS')
  if (credentials) {
    return credentials
  }
  // Also check for the camelCase version
  credentials = await getSetting('googleAnalyticsServiceAccount')
  if (credentials) {
    return credentials
  }
  // Fallback to environment variable
  return process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT || process.env.GOOGLE_ANALYTICS_CREDENTIALS || ''
}

/**
 * Generate DNS instructions dynamically based on server IP
 */
export async function generateDnsInstructions(domainName?: string): Promise<string> {
  const serverIp = await getServerIp()
  
  if (!serverIp) {
    return `Add an A record pointing to your server IP:\nA @ YOUR_SERVER_IP\n\nNote: Configure your server IP in Settings.`
  }

  const instructions = `Add an A record pointing to your server IP:\nA @ ${serverIp}`
  
  return instructions
}

