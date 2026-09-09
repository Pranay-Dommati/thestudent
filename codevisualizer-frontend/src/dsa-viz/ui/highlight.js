/**
 * dsa-viz / ui / highlight — ONE Python tokenizer for the whole core.
 * Built on prismjs (already a dependency via rehype-prism-plus /
 * react-syntax-highlighter), so no new package and no CDN.
 *
 * Replaces the 3 divergent hand-rolled `highlightSyntax` copies in
 * components/DSAVisualizer.
 */
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

const CLASS = {
    keyword: 'text-purple-400 font-semibold',
    'class-name': 'text-amber-200',
    builtin: 'text-sky-300',
    function: 'text-sky-300',
    string: 'text-emerald-300',
    'triple-quoted-string': 'text-emerald-300',
    number: 'text-amber-300',
    boolean: 'text-purple-400',
    comment: 'text-slate-500 italic',
    operator: 'text-slate-400',
    punctuation: 'text-slate-500',
    decorator: 'text-amber-300',
    default: 'text-slate-300',
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderNode(node) {
    if (typeof node === 'string') return esc(node);
    if (Array.isArray(node)) return node.map(renderNode).join('');
    // Prism.Token
    const cls = CLASS[node.type] || CLASS.default;
    const inner = renderNode(node.content);
    return `<span class="${cls}">${inner}</span>`;
}

/** highlightLine — returns an HTML string for one line of Python. */
export function highlightLine(line) {
    if (!line || !line.trim()) return '&nbsp;';
    const tokens = Prism.tokenize(line, Prism.languages.python);
    return tokens.map(renderNode).join('') || '&nbsp;';
}
