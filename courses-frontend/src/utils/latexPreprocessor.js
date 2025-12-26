/**
 * Preprocesses LaTeX syntax in markdown content to ensure compatibility
 * with remark-math and rehype-katex
 * 
 * Converts:
 * - \[ ... \] to $$ ... $$ (display math)
 * - \( ... \) to $ ... $ (inline math)
 * - Handles aligned environments
 * - Preserves existing $$ and $ syntax
 */
export function preprocessLatex(content) {
  if (!content) return content;

  let processed = content;

    // Conservative conversions only:
    // 1) Convert \[ ... \] (display math) to $$ ... $$ across multiline
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `$$${inner}$$`);

    // 2) Convert \( ... \) (inline math) to $ ... $
    processed = processed.replace(/\\\(([^\n]*?)\\\)/g, (_, inner) => `$${inner}$`);

    // 2.1) Recover escaped dollar delimiters around LaTeX that were previously sanitized
    // e.g. \$\cos x\$  ->  $\cos x$
    // and     \$\begin{bmatrix}...\end{bmatrix}\$  ->  $...$
    // We only unescape when inner text clearly looks like LaTeX (has \\command or \begin)
    const unescapeEscapedDollarDelimiters = (text) => {
      if (!text) return text;
      // Skip code blocks
      const segments = [];
      let last = 0;
      const codeBlockRegex = /```[\s\S]*?```/g;
      let hit;
      while ((hit = codeBlockRegex.exec(text)) !== null) {
        if (hit.index > last) segments.push({ type: 'text', value: text.slice(last, hit.index) });
        segments.push({ type: 'code', value: hit[0] });
        last = hit.index + hit[0].length;
      }
      if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });

      const fixInText = (s) => s.replace(/\\\$([^$]*?(?:\\begin\{[a-zA-Z*]+\}|\\[a-zA-Z]+)[^$]*?)\\\$/g,
        (_, inner) => `$${inner}$`);

      return segments.map(seg => (seg.type === 'text' ? fixInText(seg.value) : seg.value)).join('');
    };
    processed = unescapeEscapedDollarDelimiters(processed);

    // 3) Robust handling for bare LaTeX environments (e.g., \begin{bmatrix} ... \end{bmatrix})
    // Some content stores matrix/equation environments without surrounding math fences.
    // We wrap such paragraphs or single lines in display math $$ ... $$ so rehype-katex can render them.
    const wrapEnvInDisplayMath = (text) => {
      if (!text) return text;

      // Skip code blocks (``` ... ```), process only non-code segments to avoid corrupting samples
      const segments = [];
      let lastIndex = 0;
      const codeBlockRegex = /```[\s\S]*?```/g;
      let m;
      while ((m = codeBlockRegex.exec(text)) !== null) {
        // Push preceding normal text
        if (m.index > lastIndex) {
          segments.push({ type: 'text', value: text.slice(lastIndex, m.index) });
        }
        segments.push({ type: 'code', value: m[0] });
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) {
        segments.push({ type: 'text', value: text.slice(lastIndex) });
      }

      const envRegex = /\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/;
      const isAlreadyDisplayMath = (s) => /(^\s*\$\$[\s\S]*\$\$\s*$)/.test(s);

      const transformBlock = (block) => {
        // Work paragraph by paragraph to avoid wrapping regular prose
        return block
          .replace(/\r\n/g, '\n')
          .split(/\n{2,}/)
          .map((para) => {
            const trimmed = para.trim();
            if (!trimmed) return para; // keep spacing
            if (isAlreadyDisplayMath(trimmed)) return para; // no double wrapping

            // If a paragraph contains a LaTeX environment, decide whether to wrap
            if (envRegex.test(trimmed)) {
              // If the paragraph is mostly the environment(s) and optional brackets/punctuation, wrap whole para
              const withoutEnvs = trimmed.replace(/\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/g, '').trim();
              // Allow only simple surrounding characters like brackets, commas, equality signs, etc.
              const hasOnlyPunct = withoutEnvs.replace(/[\[\]\(\)\{\},.=;:\-+*\s]/g, '') === '';
              if (hasOnlyPunct) {
                return `$$\n${trimmed}\n$$`;
              }
              // Otherwise, inline-wrap each environment occurrence and keep text around it
              return trimmed.replace(/\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/g, (match) => `$$${match}$$`);
            }

            // Heuristic: if a single line contains many LaTeX commands (e.g., \cos, \sin, \frac)
            // and is likely intended as math, wrap it as display math. Useful for inputs like
            // "[ \\begin{bmatrix} ... \\end{bmatrix} ]" where surrounding brackets are part of math.
            const latexTokenCount = (trimmed.match(/\\(cos|sin|tan|log|ln|sqrt|frac|theta|phi|pi|times|cdot|sum|int|begin|end)/g) || []).length;
            if (latexTokenCount >= 2 && !/\$\$|\$/.test(trimmed)) {
              return `$$\n${trimmed}\n$$`;
            }

            return para;
          })
          .join('\n\n');
      };

      const rebuilt = segments
        .map((seg) => (seg.type === 'text' ? transformBlock(seg.value) : seg.value))
        .join('');
      return rebuilt;
    };

  processed = wrapEnvInDisplayMath(processed);

  // Hoist short prefixes early so display blocks are formed before we protect them.
  processed = hoistPrefixesIntoDisplay(processed);

    // 3.5) Line-level safety: if a single line is a pure LaTeX environment
    // (e.g., "\\begin{bmatrix} ... \\end{bmatrix}") without $$ fences, wrap it
    // as a display block. This covers authoring where A = is on one line and
    // the matrix environment is on the next line by itself.
    const wrapStandaloneEnvLines = (text) => {
      if (!text) return text;
      const codeBlockRegex = /```[\s\S]*?```/g;
      const segments = [];
      let last = 0, m;
      while ((m = codeBlockRegex.exec(text)) !== null) {
        if (m.index > last) segments.push({ t: 'text', v: text.slice(last, m.index) });
        segments.push({ t: 'code', v: m[0] });
        last = m.index + m[0].length;
      }
      if (last < text.length) segments.push({ t: 'text', v: text.slice(last) });

      const envFull = /^\s*\\begin\{[a-zA-Z*]+\}[\s\S]*\\end\{[a-zA-Z*]+\}\s*$/;

      const fix = (s) => s
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line; // preserve blank lines
          if (/\$\$/.test(trimmed)) return line; // already fenced
          if (envFull.test(trimmed)) {
            return `$$\n${trimmed}\n$$`;
          }
          return line;
        })
        .join('\n');

      return segments.map(seg => (seg.t === 'text' ? fix(seg.v) : seg.v)).join('');
    };
    processed = wrapStandaloneEnvLines(processed);

    // 4) Conservative inline heuristic: expressions inside normal parentheses that look like LaTeX
    // e.g., ( \\theta - \\phi = \\dfrac{\pi}{2} ) -> $ \\theta - \\phi = \\dfrac{\pi}{2} $
    processed = processed.replace(/\(([^()]*\\[a-zA-Z][^()]*)\)/g, (match, inner) => {
      // Only convert when there are at least two LaTeX commands (reduces false positives)
      const cmdCount = (inner.match(/\\[a-zA-Z]+/g) || []).length;
      if (cmdCount >= 2 && !/\$/.test(inner)) {
        return `$${inner.trim()}$`;
      }
      return match;
    });

    // 5) Merge back-to-back inline math segments `$...$ $...$` into one `$... ...$`
    // This fixes authoring like "$a$$b$" which breaks KaTeX due to a stray `$`.
    const mergeAdjacentInlineMath = (text) => {
      if (!text) return text;
      // Protect display math blocks while processing
      const parts = [];
      let last = 0;
      const displayRegex = /\$\$[\s\S]*?\$\$/g;
      let m2;
      while ((m2 = displayRegex.exec(text)) !== null) {
        if (m2.index > last) parts.push({ type: 'text', value: text.slice(last, m2.index) });
        parts.push({ type: 'display', value: m2[0] });
        last = m2.index + m2[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

      const mergeIn = (s) => {
        let prev;
        let out = s;
        const pattern = /\$([^$]*?)\$\s*\$([^$]*?)\$/g; // only single-dollar segments
        // Repeat until stable in case there are 3+ groups in a row
        do {
          prev = out;
          out = out.replace(pattern, (_, a, b) => `$${a.trim()} ${b.trim()}$`);
        } while (out !== prev);
        return out;
      };

      return parts.map(p => (p.type === 'text' ? mergeIn(p.value) : p.value)).join('');
    };

    // 5.0) Handle gaps denoted by four dollar signs between two inline maths: `$...$ $$$$ $...$`
    // Replace `$$$$` in normal text (not inside display math) with `$ $` so it becomes
    // `$...$ $...$`, which we later merge into a single inline math.
    const fixFourDollarGaps = (text) => {
      if (!text) return text;
      const parts = [];
      let last = 0;
      const displayRegex = /\$\$[\s\S]*?\$\$/g;
      let m2;
      while ((m2 = displayRegex.exec(text)) !== null) {
        if (m2.index > last) parts.push({ type: 'text', value: text.slice(last, m2.index) });
        parts.push({ type: 'display', value: m2[0] });
        last = m2.index + m2[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

      const fix = (s) => s.replace(/\$\$\$\$/g, '$ $');
      return parts.map(p => (p.type === 'text' ? fix(p.value) : p.value)).join('');
    };
    processed = fixFourDollarGaps(processed);

    processed = mergeAdjacentInlineMath(processed);

    // 5.1) Normalize runs of stray dollar characters outside display math.
    // This fixes artifacts like "$$$" or "$$$$" produced by upstream sanitizers.
    const normalizeDollarRuns = (text) => {
      if (!text) return text;
      const parts = [];
      let last = 0;
      const displayRegex = /\$\$[\s\S]*?\$\$/g;
      let m2;
      while ((m2 = displayRegex.exec(text)) !== null) {
        if (m2.index > last) parts.push({ type: 'text', value: text.slice(last, m2.index) });
        parts.push({ type: 'display', value: m2[0] });
        last = m2.index + m2[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

      const fix = (s) => s.replace(/\${3,}/g, (run) => (run.length % 2 === 0 ? '$$' : '$'));
      return parts.map(p => (p.type === 'text' ? fix(p.value) : p.value)).join('');
    };
    processed = normalizeDollarRuns(processed);

    // 5.2) Hoist short prefixes (e.g., "A =") into inline $$...$$ when the inner contains
    // display-only environments like bmatrix/pmatrix/cases so it becomes a proper display block.
    // Example: "A = $$\\begin{bmatrix} ... \\end{bmatrix}$$" -> "$$\nA = \\begin{bmatrix} ... \\end{bmatrix}\n$$"
    function hoistPrefixesIntoDisplay(text) {
      if (!text) return text;
      const envLike = /(\\begin\{[a-zA-Z*]+\}|\\(bmatrix|pmatrix|matrix|cases|aligned|align|gather|split)\b)/;
      const isShortPrefix = (s) => {
        if (!s) return false;
        const t = s.trim();
        if (t.length > 8) return false;
        const compact = t.replace(/\s+/g, '');
        return /^(?:[A-Za-z]{1,4}|[A-Za-z]{1,4}[=:+-]|[A-Za-z]{1,3}[=]|[A-Za-z]{1,2}\d?)$/.test(compact) || ["A=","A ="].includes(t);
      };

      const lines = text.replace(/\r\n/g, '\n').split('\n');
      // Full environment matcher to support hoisting even when upstream hasn't added $$ yet
      const envFullRegex = /\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}/;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // Find the first $$ ... $$ pair on this line
        let start = line.indexOf('$$');
        if (start === -1) {
          // No $$ yet; if we see a short prefix followed by a full environment and no trailing text,
          // wrap the whole as display math.
          const envMatch = envFullRegex.exec(line);
          if (envMatch) {
            const before = line.slice(0, envMatch.index);
            const after = line.slice(envMatch.index + envMatch[0].length);
            if (isShortPrefix(before) && after.trim() === '') {
              const prefix = before.trim();
              lines[i] = `$$\n${prefix ? prefix + ' ' : ''}${envMatch[0].trim()}\n$$`;
            }
          }
          continue;
        }
        let end = line.indexOf('$$', start + 2);
        if (end === -1) { lines[i] = line; continue; }

        const before = line.slice(0, start);
        const inner = line.slice(start + 2, end);
        const after = line.slice(end + 2);

        if (envLike.test(inner) && isShortPrefix(before) && after.trim() === '') {
          const prefix = before.trim();
          lines[i] = `$$\n${prefix ? prefix + ' ' : ''}${inner.trim()}\n$$`;
        }
      }
      return lines.join('\n');
    }
    processed = hoistPrefixesIntoDisplay(processed);

  // 5.3) Ensure display math $$ ... $$ blocks are isolated and well-formed.
    // This implementation operates per text segment and rewrites each $$...$$ block
    // by:
    //  - moving it onto its own lines
    //  - hoisting a short prefix from the previous text-line (e.g. "A =") into the block
    //  - absorbing a trailing "= RHS" immediately after the block into the block
    // Code blocks (```...```) are preserved unchanged.
    const normalizeDisplayBlocks = (text) => {
      if (!text) return text;
      const codeBlockRegex = /```[\s\S]*?```/g;
      const parts = [];
      let last = 0;
      let cb;
      while ((cb = codeBlockRegex.exec(text)) !== null) {
        if (cb.index > last) parts.push({ type: 'text', value: text.slice(last, cb.index) });
        parts.push({ type: 'code', value: cb[0] });
        last = cb.index + cb[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });

  const displayRe = /\$\$[\s\S]*?\$\$/g;
  const shortPrefixRe = /([A-Za-z]{1,4}\s*[=:+-]?|[A-Za-z]{1,4})$/; // end-of-line short prefix

      const processText = (s) => {
        let out = '';
        let idx = 0;
        let m;
        while ((m = displayRe.exec(s)) !== null) {
          const start = m.index;
          const end = displayRe.lastIndex;
          const before = s.slice(idx, start);
          const block = m[0];
          const inner = block.slice(2, -2).trim();

          // examine the trailing text immediately after the block up to the next newline
          const afterSlice = s.slice(end);
          const afterMatch = afterSlice.match(/^\s*=\s*([^\n]*)/);

          // check if the before ends with a short prefix on its last line
          const beforeLines = before.split(/\n/);
          const lastLine = beforeLines[beforeLines.length - 1] || '';
          const prefixMatch = lastLine.match(shortPrefixRe);

          // emit preceding text except possibly removing the short prefix we will hoist
          let emitBefore = before;
          let hoistedPrefix = '';
          if (prefixMatch) {
            hoistedPrefix = prefixMatch[0].trim();
            // remove the hoisted prefix from emitBefore (only last occurrence)
            const li = emitBefore.lastIndexOf(prefixMatch[0]);
            if (li !== -1) emitBefore = emitBefore.slice(0, li) + emitBefore.slice(li + prefixMatch[0].length);
          }

          out += emitBefore;

          // Build normalized block
          let normalized = '\n$$\n';
          if (hoistedPrefix) normalized += hoistedPrefix + (hoistedPrefix.endsWith('=') ? ' ' : ' = ');
          normalized += inner.replace(/\r\n/g, '\n').trim();

          // If there's a trailing = RHS immediately after the block, absorb it
          if (afterMatch) {
            const rhs = afterMatch[1].trim();
            normalized += '\n= ' + rhs;
            // advance the regexp index past the absorbed RHS so it won't be emitted later
            // compute how many chars to skip from end
            const skipLen = afterMatch[0].length;
            // move displayRe.lastIndex forward by skipLen in the overall string context
            displayRe.lastIndex = end + skipLen;
            idx = end + skipLen;
          } else {
            idx = end;
          }

          normalized += '\n$$\n';
          out += normalized;
        }
        // append remainder
        if (idx < s.length) out += s.slice(idx);
        return out;
      };

      return parts.map(p => (p.type === 'text' ? processText(p.value) : p.value)).join('');
    };
    processed = normalizeDisplayBlocks(processed);

    // 6) Fix patterns like: cos$\theta-\phi$ -> $\cos(\theta-\phi)$ (conservative)
    const fixFunctionWithInlineArg = (text) => {
      const fn = /(cos|sin|tan|cot|sec|csc|log|ln)/;
      return text.replace(new RegExp(`\\b${fn.source}\\$([^$]+?)\\$`, 'g'), (m, f, inner) => {
        // Avoid double-wrapping if inner already starts with \\ or function name
        const content = inner.trim();
        const wrapped = content.startsWith('(') ? `\\${f}${content}` : `\\${f} ${content}`;
        return `$${wrapped}$`;
      });
    };
    processed = fixFunctionWithInlineArg(processed);

    // 7) Promote math-dominant lines with broken dollars or bare tokens to display math
    const promoteMathyLines = (text) => {
      const protect = (s) => {
        // Extract display and inline math segments so we can check outside-math tokens
        const segments = [];
        let idx = 0;
        const display = /\$\$[\s\S]*?\$\$/g;
        let mm;
        while ((mm = display.exec(s)) !== null) {
          if (mm.index > idx) segments.push({ t: 'text', v: s.slice(idx, mm.index) });
          segments.push({ t: 'disp', v: mm[0] });
          idx = mm.index + mm[0].length;
        }
        if (idx < s.length) segments.push({ t: 'text', v: s.slice(idx) });
        // Within text pieces, further split on inline math $...$
        const explode = [];
        const inlineRe = /\$([^$]|\$\$)*?\$/g; // naive but works after previous merges
        for (const seg of segments) {
          if (seg.t !== 'text') { explode.push(seg); continue; }
          let i = 0, m3;
          const str = seg.v;
          while ((m3 = inlineRe.exec(str)) !== null) {
            if (m3.index > i) explode.push({ t: 'text', v: str.slice(i, m3.index) });
            explode.push({ t: 'inline', v: m3[0] });
            i = m3.index + m3[0].length;
          }
          if (i < str.length) explode.push({ t: 'text', v: str.slice(i) });
        }

        // Promote line by line in text segments only
        for (let k = 0; k < explode.length; k++) {
          const seg = explode[k];
          if (seg.t !== 'text') continue;
          const lines = seg.v.split(/\n/);
          for (let li = 0; li < lines.length; li++) {
            const line = lines[li];
            const trimmed = line.trim();
            if (!trimmed) continue;

            const singleDollarCount = (trimmed.match(/(?<!\$)\$(?!\$)/g) || []).length;
            const latexTokenCount = (trimmed.match(/\\[a-zA-Z]+/g) || []).length;
            const nonMathWords = (trimmed.replace(/\\[a-zA-Z]+|\d+|[\^_{}()\[\]+\-*/=|.,:;<>\s]/g, ' ').match(/[A-Za-z]+/g) || []);
            const isDominantMath = latexTokenCount >= 2 && nonMathWords.length <= 3; // e.g., "MN =", "But"

            if (isDominantMath && (singleDollarCount % 2 === 1 || /\\[a-zA-Z]+/.test(trimmed))) {
              // If line has any single-dollar math, strip singles (keep $$) then wrap whole line as display math
              const withoutSingles = trimmed.replace(/(?<!\$)\$(?!\$)/g, '');
              lines[li] = `$$\n${withoutSingles}\n$$`;
            }
          }
          explode[k].v = lines.join('\n');
        }
        return explode.map(p => p.v).join('');
      };
      return protect(text);
    };
    processed = promoteMathyLines(processed);
    // Optional debug dump: enable by setting globalThis.__LATEX_PREPROC_DEBUG__ = true in browser
    // or by setting process.env.LATEX_PREPROC_DEBUG = '1' when running in Node during builds/tests.
    try {
      const debugFlag =
        (typeof globalThis !== 'undefined' && globalThis.__LATEX_PREPROC_DEBUG__) ||
        (typeof process !== 'undefined' && process.env && process.env.LATEX_PREPROC_DEBUG === '1');
      if (debugFlag) {
        // eslint-disable-next-line no-console
        console.log('----- PREPROCESSED MARKDOWN START -----');
        // eslint-disable-next-line no-console
        console.log(processed);
        // eslint-disable-next-line no-console
        console.log('----- PREPROCESSED MARKDOWN CHARS (first 500) -----');
        const preview = processed.slice(0, 500);
        const named = { 32: 'SP', 9: 'TAB', 10: 'LF', 13: 'CR', 160: 'NBSP', 8203: 'ZWSP', 65279: 'BOM' };
        const chars = Array.from(preview)
          .map((c) => {
            const code = c.charCodeAt(0);
            const name = named[code] || null;
            return name ? `${name}(${code})` : `${c}(${code})`;
          })
          .join(' ');
        // eslint-disable-next-line no-console
        console.log(chars);
        // eslint-disable-next-line no-console
        console.log('escapedDollars:', /\\\$/.test(processed), 'htmlEntityDollar:', /&(?:#36|#x24);/.test(processed), 'zeroWidthChars:', /[\u200B\u200C\u200D\uFEFF]/.test(processed));
        // eslint-disable-next-line no-console
        console.log('----- PREPROCESSED MARKDOWN END -----');
      }
    } catch (_) {
      // ignore debug errors in environments without console/process
    }

  return processed;
}

// Minimal aggressive version kept for future toggles; currently identical to preprocessLatex
export function preprocessLatexAggressive(content) {
  return preprocessLatex(content);
}

export default preprocessLatex;
