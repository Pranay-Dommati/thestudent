/**
 * dsa-viz / ui / Controls — Reset · Prev · Play/Pause · Next · Speed.
 *
 * Renders full on desktop, icon-only when `compactMobile` (MobileCodeDrawer
 * injects that via cloneElement). All buttons have aria-labels.
 */
import React from 'react';

const Btn = ({ label, onClick, disabled, primary, children, compact }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center gap-1.5 rounded-lg active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
            compact ? 'w-8 h-7' : 'px-3 py-1.5 text-sm font-semibold'
        } ${
            primary
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40'
                : 'bg-slate-700/70 hover:bg-slate-600 text-slate-200 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const I = {
    reset: <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" /></svg>,
    prev: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>,
    next: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>,
    play: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.3 2.8A1 1 0 0 0 5 3.7v12.6a1 1 0 0 0 1.5.9l10-6.3a1 1 0 0 0 0-1.7l-10-6.4Z" /></svg>,
    pause: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6 3.5A1.5 1.5 0 0 1 7.5 5v10a1.5 1.5 0 0 1-3 0V5A1.5 1.5 0 0 1 6 3.5Zm8 0A1.5 1.5 0 0 1 15.5 5v10a1.5 1.5 0 0 1-3 0V5A1.5 1.5 0 0 1 14 3.5Z" /></svg>,
};

export default function Controls({
    idx = -1, playing = false, atEnd = false,
    speed = 1, onReset, onBack, onPlay, onPause, onNext, onCycleSpeed,
    compactMobile = false,
}) {
    const compact = compactMobile;
    return (
        <div className={`flex items-center ${compact ? 'gap-1.5' : 'justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/80 gap-3'}`}>
            <div className="flex items-center gap-1.5 md:gap-2">
                <Btn label="Reset" onClick={onReset} disabled={idx < 0} compact={compact}>
                    {I.reset}{!compact && <span className="hidden md:inline">Reset</span>}
                </Btn>
                <Btn label="Previous step" onClick={onBack} disabled={idx < 0} compact={compact}>
                    {I.prev}{!compact && <span className="hidden md:inline">Prev</span>}
                </Btn>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
                <Btn label={playing ? 'Pause' : 'Play'} onClick={playing ? onPause : onPlay} disabled={atEnd && !playing} compact={compact}>
                    {playing ? I.pause : I.play}
                </Btn>
                <Btn label="Next step" onClick={onNext} disabled={atEnd} primary compact={compact}>
                    {!compact && <span className="hidden md:inline">Next</span>}{I.next}
                </Btn>
                <button
                    type="button"
                    onClick={onCycleSpeed}
                    aria-label={`Playback speed ${speed}×`}
                    title={`Speed ${speed}×`}
                    className={`rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-300 hover:text-white font-mono font-semibold transition-all ${compact ? 'h-7 px-1.5 text-[11px]' : 'px-2 py-1.5 text-xs'}`}
                >
                    {speed}×
                </button>
            </div>
        </div>
    );
}
