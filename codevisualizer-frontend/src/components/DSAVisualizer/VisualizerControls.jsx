/**
 * VisualizerControls — step-by-step navigation bar (Reset / Prev / Next)
 */

const VisualizerControls = ({
    speed,
    setSpeed,
    eventIdx,
    playing,
    finished,
    onPlay,
    onPause,
    onReset,
    onBack,
    onNext,
}) => (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/80 gap-3">

        {/* Reset — left */}
        <button onClick={onReset} disabled={eventIdx < 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white text-xs font-semibold transition-all"
            title="Reset">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
            </svg>
            Reset
        </button>

        {/* Prev + Next — right, equal width */}
        <div className="flex items-center gap-2">
            <button onClick={onBack} disabled={eventIdx < 0}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-200 hover:text-white text-sm font-semibold transition-all"
                title="Previous step">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd"/>
                </svg>
                Prev
            </button>

            <button onClick={onNext} disabled={finished}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-md shadow-indigo-900/40"
                title="Next step">
                Next
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                </svg>
            </button>
        </div>
    </div>
);

export default VisualizerControls;

