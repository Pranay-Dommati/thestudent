/**
 * VisualizerControls — shared playback controls bar
 *
 * Used as the top bar inside the code panel for any algorithm visualizer.
 * Matches the Merge Sort "compact controls bar" style exactly.
 */

// Speed pill group + Reset / Prev / Play-Pause / Next icons
const VisualizerControls = ({
    speed,
    setSpeed,
    eventIdx,
    playing,
    finished,
    onPlay,       // start / resume / replay
    onPause,
    onReset,
    onBack,
    onNext,
}) => (
    <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-slate-700/60 bg-slate-800/80">
        {/* Speed selector */}
        <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-1">
            {[0.5, 1, 1.5, 2, 3].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${
                        speed === s ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}>
                    {s}×
                </button>
            ))}
        </div>

        {/* Navigation + playback */}
        <div className="flex items-center gap-1.5">
            {/* Reset */}
            <button onClick={onReset} disabled={eventIdx < 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all"
                title="Reset">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                </svg>
            </button>

            <div className="w-px h-5 bg-slate-700" />

            {/* Previous */}
            <button onClick={onBack} disabled={eventIdx < 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all"
                title="Previous step">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
                </svg>
            </button>

            {/* Play / Pause / Resume / Replay — icon-only square buttons */}
            {!playing && !finished && eventIdx < 0 && (
                <button onClick={onPlay}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow shadow-indigo-900/40 transition-all"
                    title="Start">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                        <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"/>
                    </svg>
                </button>
            )}
            {playing && (
                <button onClick={onPause}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 active:scale-95 text-white transition-all"
                    title="Pause">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" clipRule="evenodd"/>
                    </svg>
                </button>
            )}
            {!playing && eventIdx >= 0 && !finished && (
                <button onClick={onPlay}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all"
                    title="Resume">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 translate-x-px">
                        <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"/>
                    </svg>
                </button>
            )}
            {finished && (
                <button onClick={onPlay}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all"
                    title="Replay">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd"/>
                    </svg>
                </button>
            )}

            {/* Next */}
            <button onClick={onNext} disabled={finished}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/80 hover:bg-slate-600 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all"
                title="Next step">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/>
                </svg>
            </button>
        </div>
    </div>
);

export default VisualizerControls;
