/**
 * dsa-viz / scene / ArrayScene
 *
 * The Scene body for ANY single-array visualizer — sorts, binary search, two
 * pointers, sliding window, stacks-over-arrays. A problem shapes one `view`
 * object and gets the whole composition: value-as-height bars (or equal
 * cells), regions, dimension braces, pointers, in-place comparison brackets,
 * swap arcs, spotlighting, reveals and success ripples.
 *
 * Nothing here is problem-specific. A problem never writes layout maths,
 * colours, timing or animation — only *what is true* at each step.
 *
 * view = {
 *   values    [{ id, v }]
 *   regions   [{ key, from, to, tone, label, rule }]
 *   spans     [{ id, from, to, label, tone }]   dimension brace under the array
 *   marks     [{ index, tone, emphasis, ring }]
 *   pointers  [{ id, label, index, tone, side }]
 *   badges    [{ id, text, index, tone, row }]
 *   relation  { a, b, op, lhs, rhs, verdict, note }
 *   exchange  { over, under }        element ids trading places
 *   spotlight [index]                dim everything else
 *   reveal    { from, to }           staggered grow-in
 *   pulse     { from, to, tone }     staggered ripple
 *   lock      index                  snap-into-final-position pulse
 *   focus     { from, to }           camera
 * }
 */
import React, { useMemo } from 'react';
import SceneCanvas from './SceneCanvas';
import ArrayTrack from './ArrayTrack';
import PointerLayer from './PointerLayer';
import RelationLayer from './RelationLayer';
import SpanLayer from './SpanLayer';
import BadgeLayer from './BadgeLayer';
import { barGeometry, trackGeometry, spanBox } from './geometry';

export default function ArrayScene({ view, mode = 'bar', reduced = false }) {
    const {
        values = [], regions = [], spans = [], marks = [], pointers = [], badges = [],
        relation = null, exchange = null, spotlight = null, reveal = null,
        pulse = null, lock = null, focus = null,
    } = view || {};

    // Bar heights must be stable across steps, so the scale is derived from the
    // multiset of values (which never changes), not their current order.
    const scaleKey = useMemo(
        () => values.map((e) => e.v).sort((a, b) => a - b).join(','),
        [values]
    );

    const geom = useMemo(
        () => (mode === 'bar'
            ? barGeometry({
                count: values.length, values, plotTop: 96, plotH: 300, gap: 14, targetW: 980,
                // widen slots for short arrays so 3 bars don't read as 3 slivers
                maxSlotW: values.length <= 4 ? 150 : values.length <= 6 ? 124 : 108,
            })
            : trackGeometry({ count: values.length, originY: 120 })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mode, values.length, scaleKey]
    );

    const markMap = useMemo(() => {
        const m = new Map();
        marks.forEach((k) => m.set(k.index, k));
        return m;
    }, [marks]);

    // tone precedence: explicit mark → pulse tint → region → neutral
    const toneAt = (i) => {
        const mk = markMap.get(i);
        if (mk?.tone) return mk.tone;
        if (pulse?.tone && i >= pulse.from && i <= pulse.to) return pulse.tone;
        for (const r of regions) {
            const a = Math.min(r.from, r.to), b = Math.max(r.from, r.to);
            if (i >= a && i <= b && r.paint !== false) return r.tone;
        }
        return 'neutral';
    };
    const emphasisAt = (i) => !!markMap.get(i)?.emphasis;
    const ringAt = (i) => markMap.get(i)?.ring ?? null;

    // world height must clear the deepest bottom pointer row
    const bottomDepth = useMemo(() => {
        const seen = {};
        let d = 0;
        pointers.forEach((p) => {
            if ((p.side || 'bottom') !== 'bottom') return;
            seen[p.index] = (seen[p.index] || 0) + 1;
            d = Math.max(d, seen[p.index]);
        });
        return Math.max(1, d);
    }, [pointers]);

    const world = {
        w: Math.max(geom.width, 320),
        h: geom.ptrY('bottom', bottomDepth - 1) + 40,
    };

    const focusBox = focus ? spanBox(geom, focus.from, focus.to, 40) : null;

    const resolvedRelation = relation && values[relation.a] && values[relation.b]
        ? {
            ...relation,
            yA: geom.topOf(values[relation.a].v),
            yB: geom.topOf(values[relation.b].v),
        }
        : null;

    const resolvedBadges = badges.map((b) => ({
        ...b,
        x: geom.cx(b.index),
        y: geom.plotTop - 44 - (b.row || 0) * 32,
    }));

    return (
        <SceneCanvas world={world} focusBox={focusBox} reduced={reduced}>
            <ArrayTrack
                geom={geom}
                values={values}
                regions={regions}
                toneAt={toneAt}
                emphasisAt={emphasisAt}
                ringAt={ringAt}
                exchange={exchange}
                spotlight={spotlight}
                reveal={reveal}
                pulse={pulse}
                lock={lock}
                reduced={reduced}
            />
            <RelationLayer geom={geom} relation={resolvedRelation} reduced={reduced} />
            <SpanLayer geom={geom} spans={spans} reduced={reduced} />
            <PointerLayer geom={geom} pointers={pointers} reduced={reduced} />
            <BadgeLayer badges={resolvedBadges} reduced={reduced} />
        </SceneCanvas>
    );
}
