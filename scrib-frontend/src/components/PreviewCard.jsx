import { useMemo } from 'react'

const themes = [
  { bg: '#eef5fb', pattern: '#d0e3f5', badgeBg: '#d0e3f5', badgeText: '#4a78a6' }, // Blue
  { bg: '#eefbf5', pattern: '#d0f5e3', badgeBg: '#d0f5e3', badgeText: '#4aa678' }, // Green
  { bg: '#f5eefb', pattern: '#e3d0f5', badgeBg: '#e3d0f5', badgeText: '#784aa6' }, // Purple
  { bg: '#fbeee6', pattern: '#f5d0ba', badgeBg: '#f5d0ba', badgeText: '#a6784a' }, // Orange
  { bg: '#fbeeee', pattern: '#f5d0d0', badgeBg: '#f5d0d0', badgeText: '#a64a4a' }, // Red
  { bg: '#f4f5ee', pattern: '#e3e6d0', badgeBg: '#e3e6d0', badgeText: '#7a824a' }, // Olive
]

const getTheme = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return themes[Math.abs(hash) % themes.length]
}

const PreviewCard = ({ title, subject }) => {
  const theme = useMemo(() => getTheme(title || ''), [title])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#e2dbd2] bg-white">
      {/* Top Section with Diagonal Pattern */}
      <div 
        className="relative flex h-32 flex-col justify-between p-4"
        style={{
          backgroundColor: theme.bg,
          backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, ${theme.pattern} 4px, ${theme.pattern} 5px)`,
        }}
      >
        <div className="flex justify-end">
          <span 
            className="rounded-full px-3 py-1 text-[10px] font-bold tracking-wider"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
          >
            PDF NOTE
          </span>
        </div>
        <div className="flex">
          {/* Document icon */}
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={theme.badgeText} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="opacity-60"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9a9289]">
          {subject || 'PREVIEW'}
        </p>
        <h3 className="mb-4 text-base font-bold leading-snug text-[#1f1f1f] line-clamp-2">
          {title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between border-t border-[#f4f1ea] pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#7b756d]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Notes
          </div>
          <span className="rounded-full bg-[#eef7df] px-3 py-1 text-[10px] font-bold text-[#557a3f]">
            Free
          </span>
        </div>
      </div>
    </div>
  )
}

export default PreviewCard
