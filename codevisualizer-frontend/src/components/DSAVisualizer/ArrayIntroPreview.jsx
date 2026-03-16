import React from 'react';

/**
 * ArrayIntroPreview
 *
 * Reusable centered intro strip for array-based problems.
 * Supports configurable separators and optional index row.
 */
const ArrayIntroPreview = ({
    values = [],
    separator = 'comma', // 'comma' | 'arrow' | 'none'
    showIndices = true,
    cellW = 44,
    cellH = 44,
    sepW = 20,
    noneGap = 6,
    fill = true,
    pointerIndex = null,
    pointerLabel = 'i',
    pointerClassName = 'bg-sky-500 text-white',
    stackGap = 16,
    indexTextClassName = 'flex justify-center text-[9px] font-mono select-none text-slate-500',
}) => {
    const sepGlyph = separator === 'arrow' ? '→' : separator === 'comma' ? ',' : '';
    const hasPointer = Number.isInteger(pointerIndex) && pointerIndex >= 0 && pointerIndex < values.length;
    const rootClass = fill
        ? 'flex-1 flex items-center justify-center px-4 pb-4'
        : 'flex items-center justify-center px-4 pb-3 flex-shrink-0';

    return (
        <div className={rootClass}>
            <div className="flex flex-col items-center" style={{ gap: stackGap }}>
                {hasPointer && (
                    <div className="flex items-center" style={{ gap: 0, minHeight: 24 }}>
                        {values.map((_, i) => (
                            <React.Fragment key={`ptr-${i}`}>
                                <div style={{ width: cellW }} className="flex justify-center">
                                    {i === pointerIndex && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono shadow-md ${pointerClassName}`}
                                        >
                                            {pointerLabel}
                                        </span>
                                    )}
                                </div>
                                {i < values.length - 1 && <div style={{ width: separator === 'none' ? noneGap : sepW }} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                <div className="flex items-center rounded-xl border-2 border-slate-600 bg-slate-800/60 px-4 py-2.5">
                    {values.map((v, i) => (
                        <React.Fragment key={i}>
                            <div
                                className="rounded-lg border-2 border-slate-500 bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200"
                                style={{ width: cellW, height: cellH }}
                            >
                                {v}
                            </div>
                            {i < values.length - 1 && (
                                separator === 'none' ? (
                                    <div style={{ width: noneGap }} />
                                ) : (
                                    <div
                                        className="flex items-center justify-center text-slate-400 text-base leading-none"
                                        style={{ width: sepW }}
                                    >
                                        {sepGlyph}
                                    </div>
                                )
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {showIndices && (
                    <div className="flex items-center" style={{ gap: 0 }}>
                        {values.map((_, i) => (
                            <React.Fragment key={i}>
                                <div
                                    className={indexTextClassName}
                                    style={{ width: cellW }}
                                >
                                    {i}
                                </div>
                                {i < values.length - 1 && <div style={{ width: separator === 'none' ? noneGap : sepW }} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArrayIntroPreview;
