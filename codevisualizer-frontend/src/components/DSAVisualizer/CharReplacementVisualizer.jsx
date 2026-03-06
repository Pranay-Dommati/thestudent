/**
 * CharReplacementVisualizer
 *
 * Sliding-window visualizer for "Longest Repeating Character Replacement".
 * Layout mirrors InsertionSortSyncedVisualizer / BubbleSortSyncedVisualizer:
 *   - Left panel:  string visual + freq panel + annotation card  (vertically centered)
 *   - Right panel: VisualizerControls (top) + SyncedCodePanel (below)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import VisualizerControls from './VisualizerControls';
import PointerBadgeRow from './PointerBadgeRow';
import SyncedVisualizerShell from './SyncedVisualizerShell';
import { AnnotationCard, useVisualizerPlayback, makeGetDelay } from './visualizerShared';

// ─── Layout constants (matching InsertionSortSyncedVisualizer) ────────────────
const CELL_W   = 44;
const CELL_H   = 44;
const CELL_GAP = 6;
const STRIDE   = CELL_W + CELL_GAP;

// ─── Line numbers (1-indexed, matching the code template in DSAProblemPage) ──
const LINE = {
    FN_DEF:          1,
    FREQ_INIT:       2,
    LEFT_INIT:       3,
    MAX_LEN_INIT:    4,
    MAX_FREQ_INIT:   5,
    FOR_RIGHT:       7,
    CALC_INDEX:      8,
    UPDATE_FREQ:     9,
    UPDATE_MAX_FREQ: 10,
    CHECK_IF:        13,
    SHRINK_FREQ:     14,
    LEFT_INC:        15,
    UPDATE_MAX_LEN:  17,
    RETURN:          19,
    S_ASSIGN:        21,
    K_ASSIGN:        22,
    CALL:            23,
    PRINT:           24,
};

// ─── Char → Tailwind bg+border pairs ─────────────────────────────────────────
const CHAR_BG = [
    'bg-sky-500 border-sky-300',
    'bg-violet-500 border-violet-300',
    'bg-emerald-500 border-emerald-300',
    'bg-amber-500 border-amber-300',
    'bg-rose-500 border-rose-300',
    'bg-teal-500 border-teal-300',
    'bg-orange-500 border-orange-300',
    'bg-pink-500 border-pink-300',
    'bg-indigo-500 border-indigo-300',
    'bg-lime-600 border-lime-400',
    'bg-cyan-500 border-cyan-300',
    'bg-fuchsia-500 border-fuchsia-300',
    'bg-red-500 border-red-300',
    'bg-blue-600 border-blue-400',
    'bg-green-600 border-green-400',
    'bg-yellow-600 border-yellow-400',
    'bg-purple-600 border-purple-400',
    'bg-slate-500 border-slate-300',
    'bg-sky-700 border-sky-500',
    'bg-violet-700 border-violet-500',
    'bg-emerald-700 border-emerald-500',
    'bg-amber-700 border-amber-500',
    'bg-rose-700 border-rose-500',
    'bg-teal-700 border-teal-500',
    'bg-orange-700 border-orange-500',
    'bg-pink-700 border-pink-500',
];

// Single bg class used for freq pill colour dots
const CHAR_DOT = [
    'bg-sky-500','bg-violet-500','bg-emerald-500','bg-amber-500',
    'bg-rose-500','bg-teal-500','bg-orange-500','bg-pink-500',
    'bg-indigo-500','bg-lime-600','bg-cyan-500','bg-fuchsia-500',
    'bg-red-500','bg-blue-600','bg-green-600','bg-yellow-600',
    'bg-purple-600','bg-slate-500','bg-sky-700','bg-violet-700',
    'bg-emerald-700','bg-amber-700','bg-rose-700','bg-teal-700',
    'bg-orange-700','bg-pink-700',
];

const charBg  = (ch) => CHAR_BG [(ch.charCodeAt(0) - 65) % CHAR_BG.length]  ?? 'bg-slate-500 border-slate-300';
const charDot = (ch) => CHAR_DOT[(ch.charCodeAt(0) - 65) % CHAR_DOT.length] ?? 'bg-slate-500';

// ─── State-based cell colouring (mirrors BubbleSort / InsertionSort logic) ────
const getCellBg = (ch, idx, ev) => {
    const type  = ev?.type  ?? '';
    const right = ev?.right ?? -1;
    const left  = ev?.left  ?? 0;
    const inWindow  = right >= 0 && idx >= left && idx <= right;
    const isAdded   = type === 'update_freq' && idx === right;
    const isRemoved = type === 'shrink_left' && idx === left - 1;
    const isDone    = type === 'return_result';

    if (isAdded)            return `${charBg(ch)} ring-2 ring-yellow-300 shadow-lg shadow-yellow-400/50 text-white`;
    if (isRemoved)          return `${charBg(ch)} ring-2 ring-red-400 shadow-md shadow-red-500/40 text-white`;
    if (isDone && inWindow) return `${charBg(ch)} ring-2 ring-emerald-300 text-white`;
    if (inWindow)           return `${charBg(ch)} text-white`;
    return 'bg-slate-700 border-slate-500 text-slate-400';
};

// ─── Delays (ms at 1× speed) ─────────────────────────────────────────────────
const DELAY = {
    s_assign:        1600,
    k_assign:        1400,
    call_fn:         1800,
    fn_entry:        1600,
    init_freq:       1600,
    init_left:       1400,
    init_max_len:    1400,
    init_max_freq:   1400,
    for_right:       1400,
    calc_index:      1200,
    update_freq:     1600,
    update_max_freq: 1800,
    check_window:    2200,
    shrink_left:     2000,
    update_max_len:  1600,
    return_result:   2000,
};
const getDelay = makeGetDelay(DELAY, 1400);

// ─── Simulation ───────────────────────────────────────────────────────────────
function simulate(s, k) {
    const events = [];
    const emit = (type, extra) => events.push({ type, ...extra });

    // ── Preamble: start at the call-site lines (21-24) ──────────────────────
    const BLANK = { right: -1, left: 0, freq: Array(26).fill(0), maxFreq: 0, maxLen: 0, index: null };

    emit('s_assign', {
        ...BLANK,
        codeLine:   LINE.S_ASSIGN,
        annotation: `s = "${s}"`,
    });
    emit('k_assign', {
        ...BLANK,
        codeLine:   LINE.K_ASSIGN,
        annotation: `k = ${k}  (we may replace at most ${k} character${k !== 1 ? 's' : ''})`,
    });
    emit('call_fn', {
        ...BLANK,
        codeLine:   LINE.CALL,
        annotation: `Calling character_replacement(s, k)  →  entering function...`,
    });
    emit('fn_entry', {
        ...BLANK,
        codeLine:   LINE.FN_DEF,
        annotation: `Inside character_replacement — initialising variables`,
    });
    emit('init_freq', {
        ...BLANK,
        codeLine:   LINE.FREQ_INIT,
        annotation: 'freq = [0] * 26  →  a 26-slot array, all zeros',
    });
    emit('init_left', {
        ...BLANK,
        codeLine:   LINE.LEFT_INIT,
        annotation: 'left = 0  →  left pointer starts at index 0',
    });
    emit('init_max_len', {
        ...BLANK,
        codeLine:   LINE.MAX_LEN_INIT,
        annotation: 'max_len = 0  →  best window length so far',
    });
    emit('init_max_freq', {
        ...BLANK,
        codeLine:   LINE.MAX_FREQ_INIT,
        annotation: 'max_freq = 0  →  highest frequency of any char in window',
    });

    let freq = Array(26).fill(0);
    let left = 0, maxLen = 0, maxFreq = 0;

    for (let right = 0; right < s.length; right++) {
        emit('for_right', {
            right, left, freq: [...freq], maxFreq, maxLen, index: null,
            codeLine:   LINE.FOR_RIGHT,
            annotation: `Loop: right = ${right}  \u2192  s[${right}] = '${s[right]}'`,
        });

        const idx = s[right].charCodeAt(0) - 65;
        emit('calc_index', {
            right, left, freq: [...freq], maxFreq, maxLen, index: idx,
            codeLine:   LINE.CALC_INDEX,
            annotation: `index = ord('${s[right]}') - ord('A') = ${idx}`,
        });
        freq[idx] += 1;
        emit('update_freq', {
            right, left, freq: [...freq], maxFreq, maxLen, index: idx,
            codeLine:   LINE.UPDATE_FREQ,
            annotation: `freq['${s[right]}'] = ${freq[idx]}  (character added to window)`,
        });

        const prevMaxFreq = maxFreq;
        maxFreq = Math.max(maxFreq, freq[idx]);
        emit('update_max_freq', {
            right, left, freq: [...freq], maxFreq, maxLen, index: idx,
            codeLine:   LINE.UPDATE_MAX_FREQ,
            annotation: `max_freq = max(${prevMaxFreq}, ${freq[idx]}) = ${maxFreq}`,
        });

        const windowSize   = right - left + 1;
        const replacements = windowSize - maxFreq;
        const invalid      = replacements > k;
        emit('check_window', {
            right, left, freq: [...freq], maxFreq, maxLen, index: idx,
            windowSize, replacements, invalid,
            codeLine:   LINE.CHECK_IF,
            annotation: invalid
                ? `window(${windowSize}) \u2212 max_freq(${maxFreq}) = ${replacements} > k(${k})  \u2192  shrink!`
                : `window(${windowSize}) \u2212 max_freq(${maxFreq}) = ${replacements} \u2264 k(${k})  \u2192  valid \u2713`,
        });

        if (invalid) {
            freq[s[left].charCodeAt(0) - 65] -= 1;
            left += 1;
            emit('shrink_left', {
                right, left, freq: [...freq], maxFreq, maxLen, index: idx,
                codeLine:   LINE.LEFT_INC,
                annotation: `Shrink: drop s[${left - 1}]='${s[left - 1]}'  \u2192  left = ${left}`,
            });
        }

        const newWin = right - left + 1;
        maxLen = Math.max(maxLen, newWin);
        emit('update_max_len', {
            right, left, freq: [...freq], maxFreq, maxLen, index: idx,
            codeLine:   LINE.UPDATE_MAX_LEN,
            annotation: `max_len = max(prev, ${newWin}) = ${maxLen}`,
        });
    }

    emit('return_result', {
        right: s.length - 1, left, freq: [...freq], maxFreq, maxLen,
        codeLine:   LINE.RETURN,
        annotation: `Done! Longest window with \u2264 ${k} replacement${k !== 1 ? 's' : ''} = ${maxLen}`,
    });

    return { events };
}

// ─── WindowOverlay — spring-animated bracket behind the cell row ──────────────
const WindowOverlay = ({ left, right }) => {
    if (right < 0) return null;
    return (
        <motion.div
            className="absolute rounded-xl border-2 border-indigo-400 bg-indigo-500/10 pointer-events-none"
            animate={{
                x:     left * STRIDE - 5,
                width: (right - left + 1) * STRIDE - CELL_GAP + 10,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ top: -5, bottom: -5 }}
        />
    );
};

// ─── StringVisual — matches cell-in-bordered-box pattern of existing sorts ────
const StringVisual = ({ s, ev, showPointers, showL }) => {
    const n     = s.length;
    const right = ev?.right ?? -1;
    const left  = ev?.left  ?? 0;

    return (
        <div className="flex flex-col items-center gap-0">

            {/* Pointer badge row above cells — L badge from init_left, R badge added on loop start */}
            {(showL || showPointers) ? (
            <PointerBadgeRow
                cellW={CELL_W}
                cellGap={CELL_GAP}
                count={n}
                iRel={left}
                jRel={showPointers && right >= 0 ? right : null}
                iClass="bg-emerald-500"
                jClass="bg-indigo-500"
                iLabel="L"
                jLabel="R"
            />
            ) : <div style={{ height: 24 }} />}

            {/* Cell row inside the same bordered box as BubbleSort/InsertionSort */}
            <div
                className="relative"
                style={{ padding: '10px 16px' }}
            >
                <div className="flex items-center relative z-10" style={{ gap: CELL_GAP }}>
                    {s.split('').map((ch, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center justify-center rounded-lg border-2 text-base font-bold flex-shrink-0 select-none transition-colors duration-200 ${getCellBg(ch, idx, ev)}`}
                            style={{ width: CELL_W, height: CELL_H, minWidth: CELL_W }}
                        >
                            {ch}
                        </div>
                    ))}
                </div>
            </div>

            {/* Index row — separate below box */}
            <div className="flex items-center mt-1" style={{ gap: CELL_GAP }}>
                {s.split('').map((_, idx) => (
                    <div
                        key={idx}
                        style={{ width: CELL_W }}
                        className="flex justify-center text-[10px] text-slate-600 font-mono select-none"
                    >
                        {idx}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── IndexFormulaRow — animated breakdown of index = ord(s[right]) - ord('A') ─
const IndexFormulaRow = ({ s, ev, show }) => {
    if (!show) return null;
    const right = ev?.right ?? 0;
    const ch    = (s[right] ?? 'A');
    const ordCh = ch.charCodeAt(0);
    const result = ordCh - 65;
    const bgClass = charBg(ch); // e.g. 'bg-sky-500 border-sky-300'

    return (
        <motion.div
            key={`formula-${right}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="flex items-center gap-[6px] bg-slate-800/80 rounded-xl px-5 py-3 border border-slate-600 text-sm font-mono text-white"
        >
            {/* index = */}
            <span className="text-slate-300 mr-1">index</span>
            <span className="text-slate-400">=</span>

            {/* ord( */}
            <span className="text-orange-300 ml-1">ord(</span>

            {/* animated char cell dropping in with R badge */}
            <motion.div
                key={`ch-${right}`}
                initial={{ y: -28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.08 }}
                className="relative flex flex-col items-center"
            >
                {/* R badge above char */}
                <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 w-[18px] h-[18px] rounded-full bg-indigo-500 flex items-center justify-center text-[9px] text-white font-bold shadow">
                    R
                </div>
                {/* char cell */}
                <div
                    className={`flex items-center justify-center rounded-md font-bold text-white text-sm border-2 ${bgClass}`}
                    style={{ width: 26, height: 26 }}
                >
                    {ch}
                </div>
            </motion.div>

            {/* ) − ord('A') = */}
            <span className="text-orange-300">)</span>
            <span className="text-slate-400 mx-1">−</span>
            <span className="text-orange-300">ord(</span>
            <span className="text-slate-200">'A'</span>
            <span className="text-orange-300">)</span>
            <span className="text-slate-400 mx-2">=</span>

            {/* ordCh value */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="text-sky-300 font-bold"
            >{ordCh}</motion.span>

            <span className="text-slate-400 mx-1">−</span>

            {/* 65 */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="text-sky-300 font-bold"
            >65</motion.span>

            <span className="text-slate-400 mx-2">=</span>

            {/* result */}
            <motion.span
                key={`res-${result}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
                className="text-orange-400 font-bold text-base"
            >{result}</motion.span>
        </motion.div>
    );
};

// ─── CheckWindowVisual — rich animated formula for the if-check step ───────────
const CheckWindowVisual = ({ s, ev, k }) => {
    const right   = ev?.right   ?? 0;
    const left    = ev?.left    ?? 0;
    const maxFreq = ev?.maxFreq ?? 0;
    const freq    = ev?.freq    ?? Array(26).fill(0);
    const invalid = ev?.invalid ?? false;

    const windowChars = Array.from(s.slice(left, right + 1));
    const windowSize  = windowChars.length;
    const replacements = windowSize - maxFreq;

    // Find dominant char
    let domIdx = 0;
    for (let i = 1; i < 26; i++) { if (freq[i] > freq[domIdx]) domIdx = i; }
    const domChar = String.fromCharCode(65 + domIdx);

    // Tag each window char: is it one of the max-freq dominant chars?
    let domSeen = 0;
    const tagged = windowChars.map((ch, wi) => {
        const isDom = ch === domChar && domSeen < maxFreq;
        if (isDom) domSeen++;
        return { ch, isDom, wi };
    });

    const baseDelay = windowSize * 0.08;

    return (
        <motion.div
            key={`cw-${right}-${left}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            className="flex flex-col items-center gap-4 w-full"
        >
            {/* ── Window chars — fly down from array ── */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                    current window &nbsp;•&nbsp; right−left+1 = {windowSize}
                </span>
                <div className="flex items-center gap-[6px]">
                    {tagged.map(({ ch, isDom, wi }) => (
                        <div key={wi} className="flex flex-col items-center gap-[3px]">
                            <motion.div
                                initial={{ y: -72, opacity: 0, scale: 0.55 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 310, damping: 22, delay: wi * 0.09 }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 font-bold text-sm text-white select-none
                                    ${ isDom
                                        ? `${charBg(ch)} ring-[3px] ring-emerald-300 shadow-lg shadow-emerald-400/40`
                                        : `${charBg(ch)} ring-[3px] ring-red-400   shadow-lg shadow-red-500/30`
                                    }`}
                            >
                                {ch}
                            </motion.div>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: wi * 0.09 + 0.25 }}
                                className={`text-[11px] font-bold ${isDom ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {isDom ? '✓' : '✕'}
                            </motion.span>
                        </div>
                    ))}
                </div>
                {/* legend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: baseDelay + 0.1 }}
                    className="flex items-center gap-4 text-[10px] mt-1"
                >
                    <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        keep (max_freq = {maxFreq})
                    </span>
                    {replacements > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                        replace ({replacements})
                    </span>
                    )}
                </motion.div>
            </div>

            {/* ── Formula: size − max_freq = replacements > k ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: baseDelay + 0.3, type: 'spring', stiffness: 260, damping: 24 }}
                className="flex items-center gap-2 font-mono text-sm select-none"
            >
                {/* size group */}
                <div className="flex flex-col items-center">
                    <div className="bg-slate-800 border border-sky-500/50 rounded-xl px-3 py-[6px]">
                        <span className="text-slate-400">size = </span>
                        <span className="text-sky-300 font-bold">{windowSize}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1">right−left+1</span>
                </div>

                <span className="text-slate-400 font-bold text-base pb-4">−</span>

                {/* max_freq group */}
                <div className="flex flex-col items-center">
                    <div className="bg-slate-800 border border-yellow-500/50 rounded-xl px-3 py-[6px]">
                        <span className="text-slate-400">max_freq = </span>
                        <span className="text-yellow-300 font-bold">{maxFreq}</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 mt-1">{maxFreq}×‘{domChar}’ kept</span>
                </div>

                <span className="text-slate-400 font-bold pb-4">=</span>

                {/* replacements result */}
                <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: baseDelay + 0.55, type: 'spring', stiffness: 300, damping: 18 }}
                    className="flex flex-col items-center"
                >
                    <div className={`rounded-xl px-3 py-[6px] border font-bold text-base ${
                        invalid
                            ? 'bg-red-500/15 border-red-500/60 text-red-300'
                            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    }`}>{replacements}</div>
                    <span className="text-[9px] text-slate-500 mt-1">replacements</span>
                </motion.div>

                <span className="text-slate-400 pb-4"> &gt; </span>

                {/* k */}
                <div className="flex flex-col items-center">
                    <div className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-[6px]">
                        <span className="text-slate-400">k = </span>
                        <span className="text-white font-bold">{k}</span>
                    </div>
                </div>
            </motion.div>

            {/* ── Result verdict ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: baseDelay + 0.85, type: 'spring', stiffness: 280, damping: 20 }}
                className={`px-6 py-2 rounded-xl border font-mono text-sm font-semibold ${
                    invalid
                        ? 'bg-red-500/10 border-red-500/50 text-red-300'
                        : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                }`}
            >
                {replacements} &gt; {k} &nbsp;→&nbsp; {invalid ? '⚠️ shrink window' : '✓ valid window'}
            </motion.div>
        </motion.div>
    );
};

// ─── FreqPanel — frequency pills + stats row ──────────────────────────────────
const FreqPanel = ({ freq, maxFreq, windowSize, replacements, k, invalid, maxLen, right, index, showStats, showMaxLen, showMaxFreq, showIndex, showK, activeType }) => {
    const active = [];
    for (let i = 0; i < 26; i++) {
        if (freq[i] > 0) active.push({ ch: String.fromCharCode(65 + i), count: freq[i] });
    }

    const statItems = [
        showMaxFreq  && { label: 'max_freq', value: right >= 0 ? maxFreq   : '0', color: 'text-yellow-300', highlight: activeType === 'update_max_freq' },
        showIndex    && { label: 'index',    value: index !== null ? index  : '—', color: 'text-orange-300', highlight: false },
        showMaxLen   && { label: 'max_len',  value: maxLen > 0  ? maxLen   : '0', color: 'text-pink-300',   highlight: false },
        showK        && { label: 'k',        value: k,                            color: 'text-slate-200',   highlight: false },
    ].filter(Boolean);

    if (statItems.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">

            {/* Stats row */}
            <div className="flex gap-3 justify-center flex-nowrap">
                {statItems.map(({ label, value, color, highlight }) => (
                    <motion.div
                        key={label}
                        animate={highlight ? {
                            borderColor: ['#eab308','#fde047','#eab308'],
                            backgroundColor: ['rgba(234,179,8,0.18)','rgba(234,179,8,0.32)','rgba(234,179,8,0.18)'],
                            boxShadow: ['0 0 0px #eab30800','0 0 14px #eab308aa','0 0 0px #eab30800'],
                        } : { borderColor: 'rgb(51,65,85)', backgroundColor: 'rgba(30,41,59,0.8)', boxShadow: 'none' }}
                        transition={highlight ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                        className="flex flex-col items-center rounded-xl px-4 py-2 border min-w-[70px]"
                        style={{ border: '1px solid' }}
                    >
                        <span className="text-[9px] uppercase tracking-wide text-slate-500 whitespace-nowrap">{label}</span>
                        <motion.span
                            key={`${label}-${value}`}
                            initial={highlight ? { scale: 0.7, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                            className={`text-lg font-bold font-mono ${color}`}
                        >{value}</motion.span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ─── FreqArrayPanel — full 26-slot array displayed at top of canvas ─────────
const FreqArrayPanel = ({ freq, show }) => {
    if (!show) return null;
    return (
        <div className="flex flex-col items-center gap-[6px] w-full px-4">
            {/* label */}
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                freq[26]
            </span>

            {/* array row */}
            <div className="flex items-stretch">
                {/* cells — share borders, no gap */}
                {freq.map((count, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const active = count > 0;
                    const isLast = i === 25;
                    return (
                        <div key={i} className="flex flex-col items-center">
                            {/* value cell */}
                            <motion.div
                                animate={{ scale: active ? 1.12 : 1, y: active ? -2 : 0 }}
                                transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                                className={[
                                    'flex items-center justify-center w-[28px] h-[30px]',
                                    'border-t border-b border-l',
                                    isLast ? 'border-r' : '',
                                    active
                                        ? `${charBg(letter)} border-current text-white font-bold`
                                        : 'bg-slate-800/80 border-slate-600 text-slate-400',
                                ].join(' ')}
                            >
                                <span className="text-[12px] font-mono font-bold leading-none">
                                    {count}
                                </span>
                            </motion.div>
                            {/* letter label below cell */}
                            <span className={`text-[9px] font-semibold mt-[3px] leading-none tracking-wide ${
                                active ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                                {letter}
                            </span>
                            {/* numeric index below letter */}
                            <span className="text-[8px] leading-none mt-[2px] text-slate-600 font-mono">
                                {i}
                            </span>
                        </div>
                    );
                })}

            </div>
        </div>
    );
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_S = 'AABABBAC';
const DEFAULT_K = 2;

// ─── Main component ───────────────────────────────────────────────────────────
const CharReplacementVisualizer = ({
    customArray    = 'AABABBAC,2',
    code           = '',
    onProgress,
    seekRef,
    showCode       = true,
    onCloseCode,
    drawerState    = 'peek',
    setDrawerState,
}) => {
    const [s, k] = useMemo(() => {
        try {
            const parts = String(customArray ?? '').split(',');
            const str   = (parts[0]?.trim() || DEFAULT_S).toUpperCase().replace(/[^A-Z]/g, '') || DEFAULT_S;
            const kVal  = parseInt(parts[1]?.trim(), 10);
            return [str, isNaN(kVal) ? DEFAULT_K : Math.max(0, kVal)];
        } catch {
            return [DEFAULT_S, DEFAULT_K];
        }
    }, [customArray]);

    const { events } = useMemo(() => simulate(s, k), [s, k]);

    const { eventIdx, finished, speed, setSpeed,
            handlePlay, handlePause, handleReset, handleBack, handleNext,
            currentEv, activeLine, executedLines } =
        useVisualizerPlayback({ events, getDelay, inputArr: s, seekRef, onProgress });

    const ev           = currentEv;
    const right        = ev?.right  ?? -1;
    const left         = ev?.left   ?? 0;
    const freq         = ev?.freq   ?? Array(26).fill(0);
    const maxFreq      = ev?.maxFreq ?? 0;
    const maxLen       = ev?.maxLen  ?? 0;
    const index        = ev?.index  ?? null;
    const windowSize   = right >= 0 ? right - left + 1  : 0;
    const replacements = right >= 0 ? windowSize - maxFreq : 0;
    const invalid      = ev?.invalid ?? false;

    // Progressive reveal helpers
    const LOOP_TYPES  = new Set(['for_right','calc_index','update_freq','update_max_freq','check_window','shrink_left','update_max_len','return_result']);
    const INIT_TYPES  = new Set(['init_freq','init_left','init_max_len','init_max_freq']);
    const FREQ_TYPES  = new Set([...INIT_TYPES, ...LOOP_TYPES]);
    const type = ev?.type ?? '';

    const showS       = eventIdx >= 0;
    const showK       = !['s_assign'].includes(type) && eventIdx >= 0;
    const showFreq    = FREQ_TYPES.has(type);
    const showString  = eventIdx >= 0;
    const showL       = ['init_left','init_max_len','init_max_freq',...LOOP_TYPES].includes(type);
    const showStats   = LOOP_TYPES.has(type);

    // Per-stat progressive reveal
    const AFTER_MAX_LEN  = new Set(['init_max_len','init_max_freq',...LOOP_TYPES]);
    const AFTER_MAX_FREQ = new Set(['init_max_freq',...LOOP_TYPES]);
    const AFTER_INDEX    = new Set(['calc_index','update_freq','update_max_freq','check_window','shrink_left','update_max_len','return_result']);
    const showMaxLen  = AFTER_MAX_LEN.has(type);
    const showMaxFreq = AFTER_MAX_FREQ.has(type);
    const showIndex   = AFTER_INDEX.has(type);
    const controls = (
        <VisualizerControls
            speed={speed} setSpeed={setSpeed}
            eventIdx={eventIdx} playing={false} finished={finished}
            onPlay={handlePlay} onPause={handlePause}
            onReset={handleReset} onBack={handleBack} onNext={handleNext}
        />
    );

    return (
        <SyncedVisualizerShell
            code={code}
            activeLine={activeLine}
            executedLines={executedLines}
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            controls={controls}
            scrollClass="flex-1 flex flex-col items-center justify-start overflow-y-auto overscroll-contain touch-pan-y px-3 pt-4 pb-3 gap-4 md:px-8 md:pt-6 md:pb-4 md:gap-5"
        >
                        {/* Stats row — TOP of canvas, revealed progressively */}
                        <FreqPanel
                            freq={freq}
                            maxFreq={maxFreq}
                            windowSize={windowSize}
                            replacements={replacements}
                            k={k}
                            invalid={invalid}
                            maxLen={maxLen}
                            right={right}
                            index={index}
                            showStats={showStats}
                            showMaxLen={showMaxLen}
                            showMaxFreq={showMaxFreq}
                            showIndex={showIndex}
                            showK={showK}
                            activeType={type}
                        />

                        {/* freq[26] array — always shown once revealed */}
                        {showFreq && (
                        <FreqArrayPanel
                            freq={freq}
                            show={true}
                        />
                        )}

                        {/* String cells + pointer badges — shown once first step fires */}
                        {showString && <StringVisual s={s} ev={ev} showPointers={showStats} showL={showL} />}

                        {/* index formula — shown only at calc_index step */}
                        <IndexFormulaRow s={s} ev={ev} show={type === 'calc_index'} />

                        {/* check window visual — shown only at check_window step */}
                        {type === 'check_window' && <CheckWindowVisual s={s} ev={ev} k={k} />}

                        {/* Step annotation — hidden at check_window */}
                        {eventIdx >= 0 && type !== 'check_window' && <AnnotationCard text={ev?.annotation} />}
        </SyncedVisualizerShell>
    );
};

export default CharReplacementVisualizer;
