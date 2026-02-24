/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers following OWASP best practices.
 */

/**
 * Get security headers for all responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable browser XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()',

    // Force HTTPS (31536000 = 1 year)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Content Security Policy
    'Content-Security-Policy': getContentSecurityPolicy(),
  };
}

/**
 * Get Content Security Policy header value
 */
export function getContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https: https://raw.githack.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.elevenlabs.io wss://*.supabase.co https://raw.githack.com",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://vercel.live",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Get CORS headers for API responses
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://cubiqo.ai',
    'https://www.cubiqo.ai',
    'https://cubiqo.com',
    'https://www.cubiqo.com',
  ];

  // Check if origin is allowed
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Validate request origin
 */
export function validateOrigin(origin: string | null, referer: string | null): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://cubiqo.ai',
    'https://www.cubiqo.ai',
    'https://cubiqo.com',
    'https://www.cubiqo.com',
  ];

  // Check origin header
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  // Check referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (allowedOrigins.includes(refererOrigin)) {
        return true;
      }
    } catch {
      // Invalid referer URL
      return false;
    }
  }

  // Allow requests without origin/referer (e.g., server-to-server)
  return !origin && !referer;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; sanitized: string; threats: string[] } {
  const threats: string[] = [];

  try {
    const parsed = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      threats.push('Invalid protocol');
      return { valid: false, sanitized: '', threats };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /onerror=/i,
      /onclick=/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        threats.push('Suspicious pattern detected');
        return { valid: false, sanitized: '', threats };
      }
    }

    // Check for common phishing indicators
    const phishingIndicators = [
      /(?:login|signin|verify|update|secure).*(?:account|password|billing)/i,
      /(?:paypal|amazon|microsoft|google|apple).*(?:verify|update|login)/i,
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,  // IP address in hostname
    ];

    for (const indicator of phishingIndicators) {
      if (indicator.test(url)) {
        threats.push('Potential phishing URL');
      }
    }

    return {
      valid: threats.length === 0,
      sanitized: parsed.toString(),
      threats,
    };
  } catch {
    threats.push('Invalid URL format');
    return { valid: false, sanitized: '', threats };
  }
}

/**
 * Check if request is from a bot
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /^$/,  // Empty user agent
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Generate security nonce for CSP
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
