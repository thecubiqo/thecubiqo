/**
 * Link Scanner and Phishing Detection
 * 
 * Detects malicious URLs, phishing attempts, and scams.
 */

export interface LinkScanResult {
  url: string;
  safe: boolean;
  category: 'safe' | 'suspicious' | 'malicious';
  threats: string[];
  confidence: number; // 0-100
  details: {
    protocol: string;
    domain: string;
    hasIPAddress: boolean;
    hasSubdomains: number;
    pathLength: number;
    hasUrlShortener: boolean;
    hasSuspiciousKeywords: boolean;
  };
}

/**
 * Known URL shorteners (potential phishing vector)
 */
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee',
  'su.pr', 'tiny.cc', 'tr.im', 'x.co', 'youtu.be',
];

/**
 * Suspicious keywords often used in phishing
 */
const PHISHING_KEYWORDS = [
  'verify', 'urgent', 'suspended', 'locked', 'confirm',
  'update', 'secure', 'billing', 'payment', 'account',
  'login', 'signin', 'password', 'reset', 'expired',
  'click', 'here', 'immediately', 'action', 'required',
  'prize', 'winner', 'congratulations', 'claim', 'free',
];

/**
 * Trusted domains (whitelist)
 */
const TRUSTED_DOMAINS = [
  'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
  'facebook.com', 'twitter.com', 'linkedin.com', 'github.com',
  'stackoverflow.com', 'wikipedia.org', 'youtube.com',
  'cubiqo.ai', 'cubiqo.com', 'supabase.co', 'vercel.com',
];

/**
 * Scan a URL for potential threats
 */
export async function scanUrl(url: string): Promise<LinkScanResult> {
  const threats: string[] = [];
  let category: 'safe' | 'suspicious' | 'malicious' = 'safe';
  let confidence = 100;

  try {
    const parsed = new URL(url);
    
    // Extract details
    const details = {
      protocol: parsed.protocol,
      domain: parsed.hostname,
      hasIPAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname),
      hasSubdomains: parsed.hostname.split('.').length - 2,
      pathLength: parsed.pathname.length,
      hasUrlShortener: URL_SHORTENERS.includes(parsed.hostname),
      hasSuspiciousKeywords: PHISHING_KEYWORDS.some(keyword => 
        url.toLowerCase().includes(keyword)
      ),
    };

    // Check protocol
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      threats.push('Invalid or suspicious protocol');
      category = 'malicious';
      confidence -= 50;
    }

    // Check for IP address instead of domain
    if (details.hasIPAddress) {
      threats.push('URL uses IP address instead of domain name');
      category = 'suspicious';
      confidence -= 30;
    }

    // Check if domain is trusted
    const isTrusted = TRUSTED_DOMAINS.some(trusted => 
      parsed.hostname === trusted || parsed.hostname.endsWith('.' + trusted)
    );

    if (isTrusted) {
      return {
        url,
        safe: true,
        category: 'safe',
        threats: [],
        confidence: 100,
        details,
      };
    }

    // Check for URL shortener (potential redirect)
    if (details.hasUrlShortener) {
      threats.push('URL uses a shortening service');
      category = 'suspicious';
      confidence -= 20;
    }

    // Check for excessive subdomains
    if (details.hasSubdomains > 3) {
      threats.push('Excessive subdomains detected');
      category = 'suspicious';
      confidence -= 15;
    }

    // Check for suspicious keywords
    if (details.hasSuspiciousKeywords) {
      threats.push('Contains phishing-related keywords');
      category = 'suspicious';
      confidence -= 25;
    }

    // Check for very long URLs (often used in phishing)
    if (url.length > 200) {
      threats.push('Unusually long URL');
      category = 'suspicious';
      confidence -= 10;
    }

    // Check for @ symbol (can hide actual domain)
    if (url.includes('@')) {
      threats.push('URL contains @ symbol (potential domain masking)');
      category = 'malicious';
      confidence -= 40;
    }

    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    if (suspiciousTlds.some(tld => parsed.hostname.endsWith(tld))) {
      threats.push('Uses suspicious top-level domain');
      category = 'suspicious';
      confidence -= 20;
    }

    // Check for unicode/punycode (homograph attacks)
    if (parsed.hostname.includes('xn--') || /[^\x00-\x7F]/.test(parsed.hostname)) {
      threats.push('Contains international characters (potential homograph attack)');
      category = 'suspicious';
      confidence -= 25;
    }

    // Determine final safety
    const safe = category === 'safe' && threats.length === 0;

    return {
      url,
      safe,
      category,
      threats,
      confidence: Math.max(0, confidence),
      details,
    };
  } catch (error) {
    return {
      url,
      safe: false,
      category: 'malicious',
      threats: ['Invalid URL format'],
      confidence: 0,
      details: {
        protocol: 'unknown',
        domain: 'unknown',
        hasIPAddress: false,
        hasSubdomains: 0,
        pathLength: 0,
        hasUrlShortener: false,
        hasSuspiciousKeywords: false,
      },
    };
  }
}

/**
 * Scan multiple URLs in batch
 */
export async function scanUrls(urls: string[]): Promise<LinkScanResult[]> {
  return Promise.all(urls.map(url => scanUrl(url)));
}

/**
 * Extract URLs from text content
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Scan text content for malicious links
 */
export async function scanTextForLinks(text: string): Promise<{
  clean: boolean;
  urls: string[];
  threats: LinkScanResult[];
}> {
  const urls = extractUrls(text);
  
  if (urls.length === 0) {
    return { clean: true, urls: [], threats: [] };
  }

  const results = await scanUrls(urls);
  const threats = results.filter(r => !r.safe);

  return {
    clean: threats.length === 0,
    urls,
    threats,
  };
}

/**
 * Check if a domain is typosquatting a known brand
 */
export function checkTyposquatting(domain: string): {
  suspicious: boolean;
  possibleTarget?: string;
} {
  const popularBrands = [
    'google', 'facebook', 'microsoft', 'apple', 'amazon',
    'paypal', 'netflix', 'instagram', 'twitter', 'linkedin',
    'github', 'stripe', 'shopify', 'zoom',
  ];

  const normalized = domain.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const brand of popularBrands) {
    // Check for common typosquatting techniques
    const techniques = [
      brand.replace(/l/g, '1'),  // l -> 1
      brand.replace(/o/g, '0'),  // o -> 0
      brand.replace(/i/g, '1'),  // i -> 1
      brand + brand[brand.length - 1],  // double last letter
      brand.slice(0, -1),  // remove last letter
      brand.split('').reverse().join(''),  // reverse
    ];

    if (techniques.some(variant => normalized.includes(variant))) {
      return {
        suspicious: true,
        possibleTarget: brand,
      };
    }

    // Check Levenshtein distance (simple version)
    if (levenshteinDistance(normalized, brand) <= 2 && normalized !== brand) {
      return {
        suspicious: true,
        possibleTarget: brand,
      };
    }
  }

  return { suspicious: false };
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}
