/**
 * dsa-viz / ui / Narration — the current step's plain-English line.
 * Visible on every breakpoint (the old AnnotationCard was `hidden md:flex`).
 * `aria-live="polite"` so screen-reader users hear each step; the fuller
 * `narration` goes to an sr-only node.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Narration({ caption, narration, reduced = false }) {
    return (
        <div className="w-full flex justify-center px-3">
            <div aria-live="polite" className="max-w-xl w-full">
                <AnimatePresence mode="wait">
                    {caption && (
                        <motion.p
                            key={caption}
                            initial={reduced ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.16 }}
                            className="text-center px-4 py-2.5 rounded-xl border border-amber-600/40 bg-amber-900/30 text-amber-100 text-[13px] md:text-sm font-medium leading-snug shadow-lg backdrop-blur-sm m-0"
                        >
                            {caption}
                        </motion.p>
                    )}
                </AnimatePresence>
                <span className="sr-only">{narration || caption}</span>
            </div>
        </div>
    );
}
