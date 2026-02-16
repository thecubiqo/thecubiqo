/**
 * Generate provider-specific URLs for magic-link quick access
 */

/**
 * Get Gmail URL to open compose window for magic-link email
 */
export function getGmailMagicLinkUrl(email?: string): string {
  // Gmail compose URL - opens in a new tab
  const baseUrl = 'https://mail.google.com/mail'
  
  // If email is provided, we can add it as a query parameter for search
  if (email) {
    // Open Gmail with search for the email address
    return `${baseUrl}/u/0/#search/from%3A${encodeURIComponent(email)}`
  }
  
  // Just open Gmail inbox
  return `${baseUrl}/u/0/#inbox`
}

/**
 * Get Outlook URL to open inbox for magic-link email
 */
export function getOutlookMagicLinkUrl(email?: string): string {
  // Outlook web URL - opens in a new tab
  const baseUrl = 'https://outlook.live.com/mail/0'
  
  // If email is provided, search for it
  if (email) {
    // Open Outlook with search for the email address
    return `${baseUrl}/search?q=from%3A${encodeURIComponent(email)}`
  }
  
  // Just open Outlook inbox
  return baseUrl
}

/**
 * Open provider URL in a new tab
 */
export function openProviderUrl(provider: 'gmail' | 'outlook', email?: string): void {
  const url = provider === 'gmail' 
    ? getGmailMagicLinkUrl(email)
    : getOutlookMagicLinkUrl(email)
  
  window.open(url, '_blank', 'noopener,noreferrer')
}
