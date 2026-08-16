import { Link } from 'react-router-dom'

// Same palette as PreviewCard so a paid pack sits in the same visual language
// as the free notes around it. Keyed by ContentPack.theme.
const THEMES = {
  blue:   { bg: '#eef5fb', pattern: '#d0e3f5', badgeBg: '#d0e3f5', badgeText: '#4a78a6' },
  green:  { bg: '#eefbf5', pattern: '#d0f5e3', badgeBg: '#d0f5e3', badgeText: '#4aa678' },
  purple: { bg: '#f5eefb', pattern: '#e3d0f5', badgeBg: '#e3d0f5', badgeText: '#784aa6' },
  orange: { bg: '#fbeee6', pattern: '#f5d0ba', badgeBg: '#f5d0ba', badgeText: '#a6784a' },
  red:    { bg: '#fbeeee', pattern: '#f5d0d0', badgeBg: '#f5d0d0', badgeText: '#a64a4a' },
  olive:  { bg: '#f4f5ee', pattern: '#e3e6d0', badgeBg: '#e3e6d0', badgeText: '#7a824a' },
}

const InterviewPackCard = ({ pack }) => {
  const theme = THEMES[pack.theme] || THEMES.blue

  return (
    <Link
      to={`/interview-prep/${pack.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white shadow-[0_1px_2px_rgba(31,31,31,0.04),0_10px_24px_-18px_rgba(31,31,31,0.28)] transition-all duration-200 hover:-translate-y-1 hover:border-[#cfc7bd] hover:shadow-[0_2px_4px_rgba(31,31,31,0.05),0_20px_34px_-18px_rgba(31,31,31,0.34)]"
    >
      <div
        className="relative flex h-[118px] flex-col justify-between p-4"
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
            PDF + QUIZ
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a9289]">
          {pack.category}
        </p>
        <h3 className="text-base font-bold leading-snug text-[#1f1f1f] line-clamp-2">
          {pack.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#7b756d]">
          {pack.page_count > 0 && (
            <>
              <span>{pack.page_count} pages</span>
              <span className="text-[#e2dbd2]">·</span>
            </>
          )}
          <span>{pack.quiz_count} quizzes</span>
          <span className="text-[#e2dbd2]">·</span>
          <span>{pack.question_count} Qs</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#f4f1ea] pt-3">
          {pack.owned ? (
            <span className="rounded-full bg-[#eef7df] px-3 py-1 text-[10.5px] font-bold text-[#557a3f]">
              ✓ Owned
            </span>
          ) : (
            <span className="font-semibold text-[17px] text-[#1f1f1f]" style={{ fontFamily: 'Sora, sans-serif' }}>
              ₹{pack.price}
            </span>
          )}
          <span className="rounded-[9px] border border-[#e2dbd2] bg-white px-3.5 py-2 text-xs font-bold text-[#1f1f1f]">
            {pack.owned ? 'Open →' : 'Preview →'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default InterviewPackCard
