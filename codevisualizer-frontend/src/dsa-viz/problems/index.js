/**
 * dsa-viz / problems / registry
 *
 * slug -> problem module. DSAImmersiveVisualizer looks a slug up here; if it's
 * present, it renders <ProblemPlayer slug=…/> instead of the legacy component.
 *
 * A problem module exports:
 *   meta          { title, pattern, difficulty }
 *   code          (rawInput:string) => pythonSource   (canonical; must match the
 *                 template in DSAProblemPage.jsx for the same slug)
 *   lines         { KEY: 1-basedLineNumber }
 *   lineAnchors   { KEY: 'substring that line must contain' }   (DEV assertion)
 *   defaultInput  string
 *   parseInput    (rawInput:string) => parsed        (fed to simulate + Scene)
 *   validateInput (rawInput:string) => ''|errorMsg
 *   simulate      (parsed) => rawStep[]
 *   Scene         ({ step, input, started, reduced }) => JSX
 */
import bubbleSort from './bubble-sort.jsx';
import binarySearch from './binary-search.jsx';
import fibonacci from './fibonacci.jsx';

export const registry = {
    'bubble-sort': bubbleSort,
    'binary-search': binarySearch,
    'fibonacci': fibonacci,
};

/** slugs currently served by the dsa-viz core (used by DSAImmersiveVisualizer). */
export const DSA_VIZ_SLUGS = new Set(Object.keys(registry));
