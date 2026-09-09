/**
 * dsa-viz / ProblemPlayer
 *
 * Binds one registry entry to the playback engine + the DSA-sheet shell.
 * DSAImmersiveVisualizer renders <ProblemPlayer slug="bubble-sort" .../> for a
 * migrated problem; every other slug keeps its existing component.
 *
 * Props (same set every legacy visualizer receives from DSAImmersiveVisualizer):
 *   slug, customArray, code, onProgress, seekRef, drawerState, setDrawerState
 */
import React, { useMemo } from 'react';
import SyncedVisualizerShell from '../components/DSAVisualizer/SyncedVisualizerShell';
import { registry } from './problems';
import { buildSteps } from './engine/buildSteps';
import { usePlayer } from './engine/usePlayer';
import Controls from './ui/Controls';
import Narration from './ui/Narration';
import { speedOptions } from './theme/tokens';

const SCROLL_CLASS =
    'flex-1 flex flex-col min-h-0 overflow-hidden px-2 py-3 md:px-6 md:py-5 gap-3';

export default function ProblemPlayer({
    slug,
    customArray = '',
    code = '',
    onProgress,
    seekRef,
    drawerState,
    setDrawerState,
}) {
    const problem = registry[slug] || null;

    const input = useMemo(
        () => (problem ? problem.parseInput(customArray) : null),
        [problem, customArray]
    );
    const displayCode = problem ? (code || problem.code(customArray)) : '';

    const built = useMemo(
        () => (problem
            ? buildSteps(problem.simulate(input), {
                code: displayCode,
                lines: problem.lines,
                lineAnchors: problem.lineAnchors,
                problem: slug,
            })
            : { steps: [], total: 0, executedAt: () => [] }),
        [problem, input, displayCode, slug]
    );

    const p = usePlayer({
        steps: built.steps,
        executedAt: built.executedAt,
        seekRef,
        onProgress,
    });

    if (!problem) {
        return <div className="p-6 text-rose-300">No dsa-viz problem registered for "{slug}"</div>;
    }

    const cycleSpeed = () => {
        const i = speedOptions.indexOf(p.speed);
        p.setSpeed(speedOptions[(i + 1) % speedOptions.length]);
    };

    const controls = (
        <Controls
            idx={p.idx}
            playing={p.playing}
            atEnd={p.atEnd}
            speed={p.speed}
            onReset={p.reset}
            onBack={p.back}
            onPlay={p.play}
            onPause={p.pause}
            onNext={p.next}
            onCycleSpeed={cycleSpeed}
        />
    );

    const Scene = problem.Scene;
    const step = p.currentStep || built.steps[0];

    return (
        <SyncedVisualizerShell
            code={displayCode}
            activeLine={p.activeLine}
            executedLines={p.executedLines}
            drawerState={drawerState}
            setDrawerState={setDrawerState}
            controls={controls}
            scrollClass={SCROLL_CLASS}
        >
            <div className="flex-1 min-h-0 w-full">
                <Scene step={step} input={input} started={p.idx >= 0} reduced={p.reduced} />
            </div>
            <Narration caption={p.currentStep?.caption} narration={p.currentStep?.narration} reduced={p.reduced} />
        </SyncedVisualizerShell>
    );
}
