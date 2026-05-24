import { Link } from 'react-router-dom'

/**
 * Breadcrumb component
 * @param {Array} crumbs - Array of { label, to? } objects. Last item is active (no link).
 * Example: [{ label: 'Home', to: '/' }, { label: 'Generate' }]
 */
const Breadcrumb = ({ crumbs = [] }) => {
  if (!crumbs.length) return null

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#c5bfb8] flex-shrink-0"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            {isLast ? (
              <span className="font-semibold text-[#1f1f1f]">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className="text-[#9a9289] hover:text-[#1f1f1f] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
