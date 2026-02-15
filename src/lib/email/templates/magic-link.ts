/**
 * Magic Link Email Template
 * Branded email template for Cubiqo magic link authentication
 */

export interface MagicLinkTemplateData {
  magicLink: string;
  appUrl: string;
}

/**
 * Brand colors from Cubiqo design system
 */
export const BRAND_COLORS = {
  primary: '#ff6f00', // Orange - Fourth Way
  secondary: '#00897b', // Green-Blue - Sattva
  accent: '#ffa000', // Yellow - Rajas
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  background: '#000000',
  cardBackground: '#1a1a1a',
} as const;

/**
 * Generate subject line for magic link email
 */
export function getMagicLinkSubject(): string {
  return 'Your CubiQo Magic Link - Sign In';
}

/**
 * Generate plain text version of magic link email
 */
export function getMagicLinkPlainText(data: MagicLinkTemplateData): string {
  return `Welcome to CubiQo - One Mind. Many Dimensions.

Click the link below to sign in to your account:

${data.magicLink}

This link will expire in 1 hour.

If you didn't request this email, you can safely ignore it.

---
CubiQo - Your Emotional AI Companion
${data.appUrl}`;
}

/**
 * Generate HTML version of magic link email with Cubiqo branding
 */
export function getMagicLinkHTML(data: MagicLinkTemplateData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to CubiQo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${BRAND_COLORS.background};
      color: ${BRAND_COLORS.text};
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      display: block;
    }
    .brand-name {
      font-size: 32px;
      font-weight: bold;
      color: ${BRAND_COLORS.primary};
      margin: 0;
      letter-spacing: 1px;
    }
    .tagline {
      font-size: 14px;
      color: ${BRAND_COLORS.textSecondary};
      margin: 8px 0 0 0;
    }
    .content {
      background-color: ${BRAND_COLORS.cardBackground};
      border-radius: 12px;
      padding: 40px;
      margin-bottom: 30px;
      border: 1px solid rgba(255, 111, 0, 0.2);
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px 0;
      color: ${BRAND_COLORS.text};
    }
    .message {
      font-size: 16px;
      color: ${BRAND_COLORS.textSecondary};
      margin: 0 0 30px 0;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .magic-link-button {
      display: inline-block;
      background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.accent} 100%);
      color: ${BRAND_COLORS.text};
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: transform 0.2s;
      box-shadow: 0 4px 20px rgba(255, 111, 0, 0.3);
    }
    .security-note {
      font-size: 14px;
      color: ${BRAND_COLORS.textSecondary};
      margin: 20px 0 0 0;
      padding: 16px;
      background-color: rgba(255, 111, 0, 0.05);
      border-radius: 8px;
      border-left: 3px solid ${BRAND_COLORS.primary};
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: ${BRAND_COLORS.textSecondary};
    }
    .footer-links {
      margin: 10px 0;
    }
    .footer-link {
      color: ${BRAND_COLORS.secondary};
      text-decoration: none;
      margin: 0 10px;
    }
    .color-bar {
      height: 4px;
      background: linear-gradient(90deg, 
        #c2185b 0%, 
        ${BRAND_COLORS.accent} 33%, 
        ${BRAND_COLORS.secondary} 66%, 
        ${BRAND_COLORS.primary} 100%);
      margin: 30px 0;
      border-radius: 2px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px;
      }
      .greeting {
        font-size: 20px;
      }
      .magic-link-button {
        padding: 14px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Logo -->
    <div class="header">
      <img src="${data.appUrl}/icons/icon-192.png" alt="CubiQo Logo" class="logo" />
      <h1 class="brand-name">CubiQo</h1>
      <p class="tagline">One Mind. Many Dimensions.</p>
    </div>

    <!-- Color Bar representing the 4 dimensions -->
    <div class="color-bar"></div>

    <!-- Main Content -->
    <div class="content">
      <h2 class="greeting">Welcome back! 👋</h2>
      <p class="message">
        Click the button below to securely sign in to your CubiQo account. 
        This magic link will connect you to your emotional AI companion.
      </p>

      <div class="button-container">
        <a href="${data.magicLink}" class="magic-link-button">
          Sign In to CubiQo
        </a>
      </div>

      <div class="security-note">
        <strong>🔒 Security Note:</strong> This link will expire in 1 hour and can only be used once. 
        If you didn't request this email, you can safely ignore it.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="color-bar"></div>
      <p>
        <strong>CubiQo</strong> - Your Emotional AI Companion
      </p>
      <div class="footer-links">
        <a href="${data.appUrl}" class="footer-link">Home</a>
        <a href="${data.appUrl}/privacy" class="footer-link">Privacy</a>
        <a href="${data.appUrl}/terms" class="footer-link">Terms</a>
      </div>
      <p style="margin-top: 20px;">
        © ${new Date().getFullYear()} CubiQo. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}
