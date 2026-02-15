'use client'

/**
 * Magic Link Email Template Preview
 * Branded email template for magic link authentication
 */

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
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: '40px 20px',
    }}>
      {/* Container */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#18181b',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #27272a',
      }}>
        {/* Header with gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
            color: '#ffffff',
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
            color: '#ffffff',
          }}>
            Your Magic Link is Ready
          </h2>
          
          <p style={{
            margin: '0 0 24px',
            fontSize: '15px',
            color: '#a1a1aa',
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
              backgroundColor: '#f97316',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 8px 16px rgba(249, 115, 22, 0.3)',
            }}>
              Sign In to CubiQo
            </a>
          </div>

          {/* Fallback link */}
          <p style={{
            margin: '24px 0 0',
            fontSize: '13px',
            color: '#71717a',
            textAlign: 'center',
          }}>
            Or copy and paste this link in your browser:
          </p>
          <p style={{
            margin: '8px 0 0',
            fontSize: '12px',
            color: '#52525b',
            textAlign: 'center',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            backgroundColor: '#09090b',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #27272a',
          }}>
            {magicLink}
          </p>

          {/* Security note */}
          <div style={{
            margin: '32px 0 0',
            padding: '16px',
            backgroundColor: '#09090b',
            borderRadius: '8px',
            border: '1px solid #27272a',
          }}>
            <p style={{
              margin: '0',
              fontSize: '13px',
              color: '#a1a1aa',
            }}>
              <strong style={{ color: '#f97316' }}>🔒 Security Note:</strong> This link can only be used once and expires in 1 hour. If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px 32px',
          borderTop: '1px solid #27272a',
          textAlign: 'center',
        }}>
          <p style={{
            margin: '0 0 8px',
            fontSize: '12px',
            color: '#71717a',
          }}>
            CubiQo - Your Emotional AI Companion
          </p>
          <p style={{
            margin: '0',
            fontSize: '11px',
            color: '#52525b',
          }}>
            We'll remember everything. Forever.
          </p>
          <div style={{
            margin: '16px 0 0',
            fontSize: '11px',
            color: '#52525b',
          }}>
            <a href="https://cubiqo.ai" style={{ color: '#f97316', textDecoration: 'none', marginRight: '12px' }}>
              Website
            </a>
            <span style={{ color: '#27272a' }}>•</span>
            <a href="https://cubiqo.ai/privacy" style={{ color: '#f97316', textDecoration: 'none', margin: '0 12px' }}>
              Privacy
            </a>
            <span style={{ color: '#27272a' }}>•</span>
            <a href="mailto:support@cubiqo.ai" style={{ color: '#f97316', textDecoration: 'none', marginLeft: '12px' }}>
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
        color: '#52525b',
      }}>
        You received this email because you requested to sign in to CubiQo using {email}
      </div>
    </div>
  )
}
