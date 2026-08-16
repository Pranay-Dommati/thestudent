// Matches InterviewPackCard's exact shape (same heights, same top/body split)
// so the grid doesn't jump when real cards replace these on load.
const InterviewPackCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#e2dbd2] bg-white">
    <div className="h-[118px] animate-pulse bg-[#e8e2d9]" />
    <div className="flex flex-1 flex-col gap-2.5 p-5">
      <div className="h-2.5 w-1/3 animate-pulse rounded bg-[#e8e2d9]" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-[#e8e2d9]" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-[#e8e2d9]" />
      <div className="mt-auto flex items-center justify-between border-t border-[#f4f1ea] pt-3">
        <div className="h-4 w-10 animate-pulse rounded bg-[#e8e2d9]" />
        <div className="h-7 w-16 animate-pulse rounded-[9px] bg-[#e8e2d9]" />
      </div>
    </div>
  </div>
)

export default InterviewPackCardSkeleton
