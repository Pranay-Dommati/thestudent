/**
 * HeaderAuthSkeleton
 *
 * Shown in the header right-side slot while the auth check is still running.
 * Mimics the exact width/height of the logged-in pill + avatar buttons so
 * there is zero layout shift once auth resolves.
 */
const HeaderAuthSkeleton = () => (
  <div className="flex items-center gap-2 animate-pulse" aria-hidden="true">
    {/* Simulates the credits pill */}
    <div className="h-6 w-20 rounded-full bg-[#e8e2d9]" />
    {/* Simulates the avatar circle */}
    <div className="h-8 w-8 rounded-full bg-[#e8e2d9]" />
    {/* Simulates the hamburger / mobile menu icon */}
    <div className="h-8 w-8 rounded-lg bg-[#e8e2d9] md:hidden" />
  </div>
)

export default HeaderAuthSkeleton
