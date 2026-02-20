'use client'

/**
 * Magic Link Email Template Preview
 * Branded email template for magic link authentication
 */

// Brand colors
const COLORS = {
  // Orange accent colors
  PRIMARY: '#f97316',
  PRIMARY_DARK: '#ea580c',

  // Background colors
  BG_BLACK: '#000000',
  BG_DARK: '#18181b',
  BG_DARKER: '#09090b',

  // Border colors
  BORDER: '#27272a',

  // Text colors
  TEXT_WHITE: '#ffffff',
  TEXT_GRAY: '#a1a1aa',
  TEXT_GRAY_LIGHT: '#71717a',
  TEXT_GRAY_DARK: '#52525b',
}

interface MagicLinkEmailTemplateProps {
  email?: string
  magicLink?: string
}

export function MagicLinkEmailTemplate({
  email = 'user@example.com',
  magicLink = '#'
}: MagicLinkEmailTemplateProps) {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: COLORS.TEXT_WHITE,
      backgroundColor: COLORS.BG_BLACK,
      padding: '40px 20px',
    }}>
      {/* Container */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: COLORS.BG_DARK,
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${COLORS.BORDER}`,
      }}>
        {/* Header with gradient */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY_DARK} 100%)`,
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          {/* Logo/Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
          }}>
            🟧
          </div>
          <h1 style={{
            margin: '0',
            fontSize: '24px',
            fontWeight: '600',
            color: COLORS.TEXT_WHITE,
          }}>
            CubiQo
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '300',
          }}>
            One Mind. Many Dimensions.
          </p>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px 32px',
        }}>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: '20px',
            fontWeight: '500',
            color: COLORS.TEXT_WHITE,
          }}>
            Your Magic Link is Ready
          </h2>

          <p style={{
            margin: '0 0 24px',
            fontSize: '15px',
            color: COLORS.TEXT_GRAY,
          }}>
            Hi there! Click the button below to sign in to CubiQo. This link will expire in 1 hour.
          </p>

          {/* CTA Button */}
          <div style={{
            textAlign: 'center',
            margin: '32px 0',
          }}>
            <a href={magicLink} style={{
              display: 'inline-block',
              padding: '16px 48px',
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.TEXT_WHITE,
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: `0 8px 16px rgba(249, 115, 22, 0.3)`,
            }}>
              Sign In to CubiQo
            </a>
          </div>

          {/* Fallback link */}
          <p style={{
            margin: '24px 0 0',
            fontSize: '13px',
            color: COLORS.TEXT_GRAY_LIGHT,
            textAlign: 'center',
          }}>
            Or copy and paste this link in your browser:
          </p>
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: COLORS.TEXT_GRAY_DARK,
            textAlign: 'center',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            backgroundColor: COLORS.BG_DARKER,
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.BORDER}`,
          }}>
            {magicLink}
          </p>

          {/* Security note */}
          <div style={{
            margin: '32px 0 0',
            padding: '16px',
            backgroundColor: COLORS.BG_DARKER,
            borderRadius: '8px',
            border: `1px solid ${COLORS.BORDER}`,
          }}>
            <p style={{
              margin: '0',
              fontSize: '13px',
              color: COLORS.TEXT_GRAY,
            }}>
              <strong style={{ color: COLORS.PRIMARY }}>🔒 Security Note:</strong> This link can only be used once and expires in 1 hour. If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: `1px solid ${COLORS.BORDER}`,
          textAlign: 'center',
        }}>
          <p style={{
            margin: '0 0 8px',
            fontSize: '12px',
            color: COLORS.TEXT_GRAY_LIGHT,
          }}>
            CubiQo — Your Private AI Secretary & Orchestrator
          </p>
          <p style={{
            margin: '0',
            fontSize: '11px',
            color: COLORS.TEXT_GRAY_DARK,
          }}>
            Zero-Retention. Private. Orchestrated by Intent.
          </p>
          <div style={{
            margin: '16px 0 0',
            fontSize: '11px',
            color: COLORS.TEXT_GRAY_DARK,
          }}>
            <a href="https://cubiqo.ai" style={{ color: COLORS.PRIMARY, textDecoration: 'none', marginRight: '12px' }}>
              Website
            </a>
            <span style={{ color: COLORS.BORDER }}>•</span>
            <a href="https://cubiqo.ai/privacy" style={{ color: COLORS.PRIMARY, textDecoration: 'none', margin: '0 12px' }}>
              Privacy
            </a>
            <span style={{ color: COLORS.BORDER }}>•</span>
            <a href="mailto:support@cubiqo.ai" style={{ color: COLORS.PRIMARY, textDecoration: 'none', marginLeft: '12px' }}>
              Support
            </a>
          </div>
        </div>
      </div>

      {/* Extra info */}
      <div style={{
        maxWidth: '600px',
        margin: '16px auto 0',
        textAlign: 'center',
        fontSize: '11px',
        color: COLORS.TEXT_GRAY_DARK,
      }}>
        You received this email because you requested to sign in to CubiQo using {email}
      </div>
    </div>
  )
}
