/**
 * dsa-viz / ui / CodePanel — the one code panel. Syntax via ui/highlight
 * (prismjs). Active line highlighted; previously executed lines dimmed with an
 * emerald rail; auto-scrolls the active line into view. Semantic <pre>/<ol> so
 * screen readers and copy/paste behave.
 *
 * Props: code {string}, activeLine {number|null}, executedLines {number[]}
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { highlightLine } from './highlight';

export default function CodePanel({ code = '', activeLine = null, executedLines = [] }) {
    const lines = useMemo(() => code.split('\n'), [code]);
    const html = useMemo(() => lines.map(highlightLine), [lines]);
    const executed = useMemo(() => new Set(executedLines), [executedLines]);
    const rowRefs = useRef({});

    useEffect(() => {
        const el = activeLine && rowRefs.current[activeLine];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeLine]);

    return (
        <pre className="flex-1 overflow-y-auto py-2 m-0 font-mono text-[13px] leading-[1.7] bg-transparent">
            <ol className="list-none m-0 p-0">
                {lines.map((_, i) => {
                    const n = i + 1;
                    const isCur = n === activeLine;
                    const wasRun = executed.has(n);
                    return (
                        <li
                            key={i}
                            ref={(el) => (rowRefs.current[n] = el)}
                            aria-current={isCur ? 'step' : undefined}
                            className={`flex transition-colors duration-200 ${
                                isCur
                                    ? 'bg-blue-500/20 border-l-2 border-blue-400'
                                    : wasRun
                                    ? 'bg-slate-800/30 border-l-2 border-emerald-500/30'
                                    : 'border-l-2 border-transparent'
                            }`}
                        >
                            <span
                                className={`w-10 text-right pr-3 select-none shrink-0 ${
                                    isCur ? 'text-blue-300 font-bold' : wasRun ? 'text-emerald-500/70' : 'text-slate-600'
                                }`}
                            >
                                {n}
                            </span>
                            <code
                                className={`pr-4 whitespace-pre ${isCur ? 'brightness-125' : wasRun ? 'opacity-80' : 'opacity-60'}`}
                                dangerouslySetInnerHTML={{ __html: html[i] }}
                            />
                        </li>
                    );
                })}
            </ol>
        </pre>
    );
}
