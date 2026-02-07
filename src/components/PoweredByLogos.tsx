'use client'

/**
 * PoweredByLogos - Displays "Powered by Claude" and "Powered by OpenAI" badges
 * Requirement: BRAND SYSTEM GAPS (P1, 1 point)
 * Per requirements-doc-1.docx: "LOGO POWERED BY CLAUDE AND OPEN AI (per the claude and open AI policy review pending)"
 */

interface PoweredByLogosProps {
  isDark?: boolean
  position?: 'footer' | 'corner'
}

export function PoweredByLogos({ isDark = true, position = 'footer' }: PoweredByLogosProps) {
  // Positioning styles based on placement
  const positionClasses = position === 'corner' 
    ? 'fixed bottom-6 right-6'
    : 'inline-flex'

  return (
    <div 
      className={`${positionClasses} z-[40] flex items-center gap-4`}
      data-testid="powered-by-logos"
    >
      {/* Powered by Claude */}
      <a
        href="https://www.anthropic.com/claude"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
          isDark 
            ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05]' 
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
        }`}
        aria-label="Powered by Claude AI"
      >
        <span className={`text-[10px] font-medium tracking-wide ${
          isDark ? 'text-white/40' : 'text-gray-500'
        }`}>
          Powered by
        </span>
        <svg 
          className={`h-4 ${isDark ? 'text-white/70' : 'text-gray-700'}`}
          viewBox="0 0 100 24" 
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Claude logo - simplified wordmark */}
          <text 
            x="0" 
            y="18" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            fontSize="16" 
            fontWeight="600"
            letterSpacing="0.5"
          >
            Claude
          </text>
        </svg>
      </a>

      {/* Powered by OpenAI */}
      <a
        href="https://openai.com"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
          isDark 
            ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05]' 
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
        }`}
        aria-label="Powered by OpenAI"
      >
        <span className={`text-[10px] font-medium tracking-wide ${
          isDark ? 'text-white/40' : 'text-gray-500'
        }`}>
          Powered by
        </span>
        <svg 
          className={`h-4 ${isDark ? 'text-white/70' : 'text-gray-700'}`}
          viewBox="0 0 100 24" 
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* OpenAI logo - simplified wordmark */}
          <text 
            x="0" 
            y="18" 
            fontFamily="system-ui, -apple-system, sans-serif" 
            fontSize="16" 
            fontWeight="600"
            letterSpacing="0.5"
          >
            OpenAI
          </text>
        </svg>
      </a>
    </div>
  )
}

/**
 * Alternative: Compact stacked version for tight spaces
 */
export function PoweredByLogosCompact({ isDark = true }: { isDark?: boolean }) {
  return (
    <div 
      className="flex flex-col gap-1.5"
      data-testid="powered-by-logos-compact"
    >
      <div className={`flex items-center gap-1.5 text-[9px] ${
        isDark ? 'text-white/30' : 'text-gray-400'
      }`}>
        <span>Powered by</span>
        <a 
          href="https://www.anthropic.com/claude"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium transition-colors ${
            isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Claude
        </a>
      </div>
      <div className={`flex items-center gap-1.5 text-[9px] ${
        isDark ? 'text-white/30' : 'text-gray-400'
      }`}>
        <span>Powered by</span>
        <a 
          href="https://openai.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium transition-colors ${
            isDark ? 'text-white/50 hover:text-white/70' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          OpenAI
        </a>
      </div>
    </div>
  )
}
