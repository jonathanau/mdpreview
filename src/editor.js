import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ─── Themes ────────────────────────────────────────────────────────────────

const baseTheme = EditorView.baseTheme({
  '&': { height: '100%' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
    fontSize: '14px',
    lineHeight: '1.8',
  },
  '.cm-content': { padding: '24px 28px', minHeight: '100%' },
  '.cm-line': { padding: '0' },
  '.cm-gutters': { paddingRight: '8px', border: 'none' },
  '.cm-gutter': { minWidth: '36px' },
});

const baseEditorTheme = {
  '&': { backgroundColor: 'var(--surface)', color: 'var(--text)' },
  '.cm-content': { caretColor: 'var(--accent)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--accent-soft)',
  },
  '.cm-gutters': { backgroundColor: 'var(--surface-2)', color: 'var(--text-3)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--border)', color: 'var(--text-2)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--border)', border: 'none', color: 'var(--text-2)' },
};

export const lightEditorTheme = EditorView.theme(baseEditorTheme, { dark: false });
export const darkEditorTheme = EditorView.theme(baseEditorTheme, { dark: true });

// ─── Syntax Highlighting ───────────────────────────────────────────────────

export const dynamicHighlight = HighlightStyle.define([
  { tag: t.heading1, color: 'var(--text)', fontWeight: '500', fontSize: '1.25em' },
  { tag: t.heading2, color: 'var(--text)', fontWeight: '500', fontSize: '1.1em' },
  { tag: t.heading3, color: 'var(--text)', fontWeight: '500' },
  { tag: [t.heading4, t.heading5, t.heading6], color: 'var(--text-2)', fontWeight: '500' },
  { tag: t.emphasis, fontStyle: 'italic', color: 'var(--text-2)' },
  { tag: t.strong, fontWeight: '500', color: 'var(--text)' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: 'var(--text-3)' },
  { tag: t.link, color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' },
  { tag: t.url, color: 'var(--text-3)' },
  { tag: t.quote, color: 'var(--text-2)', fontStyle: 'italic' },
  { tag: t.monospace, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" },
  { tag: t.comment, color: 'var(--text-3)', fontStyle: 'italic' },
  { tag: [t.keyword, t.operator], color: 'var(--syntax-keyword)' },
  { tag: [t.string, t.special(t.brace)], color: 'var(--syntax-string)' },
  { tag: t.number, color: 'var(--syntax-number)' },
  { tag: t.bool, color: 'var(--syntax-keyword)' },
  { tag: t.variableName, color: 'var(--text)' },
  { tag: t.function(t.variableName), color: 'var(--syntax-function)' },
  { tag: t.definition(t.variableName), color: 'var(--syntax-function)' },
  { tag: t.typeName, color: 'var(--syntax-number)' },
  { tag: t.punctuation, color: 'var(--text-3)' },
  { tag: t.processingInstruction, color: 'var(--text-3)' },
  { tag: t.meta, color: 'var(--text-3)' },
  { tag: t.atom, color: 'var(--syntax-keyword)' },
]);

// ─── Format keymap ────────────────────────────────────────────────────────

const formatKeymap = keymap.of([
  { key: 'Mod-b', run: (view) => { wrapSelection(view, '**', '**'); return true; } },
  { key: 'Mod-i', run: (view) => { wrapSelection(view, '*', '*'); return true; } },
  { key: 'Mod-k', run: (view) => {
    const { from, to } = view.state.selection.main;
    const sel = view.state.sliceDoc(from, to);
    if (sel) {
      wrapSelection(view, '[', '](url)');
    } else {
      const text = 'link text';
      view.dispatch({
        changes: { from, to, insert: `[${text}](url)` },
        selection: { anchor: from + 1, head: from + 1 + text.length },
      });
    }
    return true;
  }},
]);

// ─── Compartments for runtime reconfiguration ──────────────────────────────

export const themeCompartment = new Compartment();
export const highlightCompartment = new Compartment();

// ─── Editor factory ────────────────────────────────────────────────────────

export function createEditor({ container, doc = '', onChange, isDark = false }) {
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLineGutter(),
        drawSelection(),
        bracketMatching(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        formatKeymap,
        markdown({ base: markdownLanguage }),
        baseTheme,
        themeCompartment.of(isDark ? darkEditorTheme : lightEditorTheme),
        highlightCompartment.of(syntaxHighlighting(dynamicHighlight)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    }),
    parent: container,
  });

  return view;
}

export function setEditorTheme(view, isDark) {
  view.dispatch({
    effects: [
      themeCompartment.reconfigure(isDark ? darkEditorTheme : lightEditorTheme),
      highlightCompartment.reconfigure(syntaxHighlighting(dynamicHighlight)),
    ],
  });
}

export function setEditorContent(view, content) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: content,
    },
  });
}

export function wrapSelection(view, before, after) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  // Toggle OFF: selected text already includes the markers exactly at the boundaries
  if (selected && selected.length >= before.length + after.length) {
    const selectedBefore = selected.slice(0, before.length);
    const selectedAfter = selected.slice(selected.length - after.length);
    if (selectedBefore === before && selectedAfter === after) {
      const inner = selected.slice(before.length, selected.length - after.length);
      // Only unwrap if inner content is not itself wrapped with the same markers
      // (prevents **word** from being incorrectly unwrapped by * toggle)
      if (!(inner.slice(0, before.length) === before && inner.slice(inner.length - after.length) === after && inner.length >= before.length + after.length)) {
        view.dispatch({
          changes: { from, to, insert: inner },
          selection: { anchor: from, head: from + inner.length },
        });
        view.focus();
        return;
      }
    }
  }

  // Toggle OFF: markers surround the selection (but aren't part of it)
  const beforeText = view.state.sliceDoc(Math.max(0, from - before.length), from);
  const afterText = view.state.sliceDoc(to, Math.min(view.state.doc.length, to + after.length));
  if (beforeText === before && afterText === after && (from - before.length) >= 0) {
    view.dispatch({
      changes: [
        { from: from - before.length, to: from, insert: '' },
        { from: to, to: to + after.length, insert: '' },
      ],
      selection: { anchor: from - before.length, head: to - before.length },
    });
    view.focus();
    return;
  }

  // Toggle ON: wrap the text with markers
  const text = selected || 'text';
  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: { anchor: from + before.length, head: from + before.length + text.length },
  });
  view.focus();
}

function getSelectedLines(view) {
  const { from, to } = view.state.selection.main;
  const firstLine = view.state.doc.lineAt(from);
  const lastLine  = view.state.doc.lineAt(to);
  const lines = [];
  for (let n = firstLine.number; n <= lastLine.number; n++) {
    lines.push(view.state.doc.line(n));
  }
  if (lines.length > 1 && to === lines[lines.length - 1].from) {
    lines.pop();
  }
  return lines;
}

export function prefixLine(view, prefix) {
  const lines = getSelectedLines(view);
  const { from: selFrom, to: selTo } = view.state.selection.main;
  const hadSelection = selFrom !== selTo;

  if (lines.length === 1 && lines[0].text.length === 0) {
    view.dispatch({
      changes: { from: lines[0].from, to: lines[0].from, insert: prefix },
      selection: { anchor: lines[0].from + prefix.length },
    });
    view.focus();
    return;
  }

  const nonEmpty = lines.filter(l => l.text.length > 0);
  const allPrefixed = nonEmpty.length > 0 && nonEmpty.every(l => l.text.startsWith(prefix));

  let totalDelta = 0;
  let changes;

  if (allPrefixed) {
    changes = nonEmpty.map(l => {
      totalDelta -= prefix.length;
      return { from: l.from, to: l.from + prefix.length, insert: '' };
    });
  } else {
    const targets = nonEmpty.filter(l => !l.text.startsWith(prefix));
    changes = targets.map(l => {
      totalDelta += prefix.length;
      return { from: l.from, to: l.from, insert: prefix };
    });
  }

  if (changes.length === 0) { view.focus(); return; }
  const endPos = lines[lines.length - 1].to + totalDelta;
  view.dispatch({
    changes,
    selection: hadSelection ? { anchor: lines[0].from, head: endPos } : { anchor: endPos },
  });
  view.focus();
}

const isNumbered = (text) => /^\d+\.\s/.test(text);

export function prefixOrderedLine(view) {
  const lines = getSelectedLines(view);
  const { from: selFrom, to: selTo } = view.state.selection.main;
  const hadSelection = selFrom !== selTo;

  if (lines.length === 1 && lines[0].text.length === 0) {
    view.dispatch({
      changes: { from: lines[0].from, to: lines[0].from, insert: '1. ' },
      selection: { anchor: lines[0].from + 3 },
    });
    view.focus();
    return;
  }

  const nonEmpty = lines.filter(l => l.text.length > 0);
  const allNumbered = nonEmpty.length > 0 && nonEmpty.every(l => isNumbered(l.text));

  let totalDelta = 0;
  let changes;

  if (allNumbered) {
    changes = nonEmpty.map(l => {
      const match = l.text.match(/^(\d+\.\s)/);
      totalDelta -= match[1].length;
      return { from: l.from, to: l.from + match[1].length, insert: '' };
    });
  } else {
    let counter = 1;
    changes = nonEmpty.map(l => {
      const existing = isNumbered(l.text) ? l.text.match(/^(\d+\.\s)/)[0] : '';
      const insert = `${counter++}. `;
      totalDelta += insert.length - existing.length;
      return { from: l.from, to: l.from + existing.length, insert };
    });
  }

  if (changes.length === 0) { view.focus(); return; }
  const endPos = lines[lines.length - 1].to + totalDelta;
  view.dispatch({
    changes,
    selection: hadSelection ? { anchor: lines[0].from, head: endPos } : { anchor: endPos },
  });
  view.focus();
}

export function toggleHeading(view, level) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const lineText = line.text;

  const headingPrefixes = ['# ', '## ', '### ', '#### ', '##### ', '###### '];
  const targetPrefix = headingPrefixes[level - 1];

  const headingMatch = lineText.match(/^(#{1,6})\s+/);

  if (headingMatch) {
    const currentLevel = headingMatch[1].length;
    if (currentLevel === level) {
      view.dispatch({
        changes: { from: line.from, to: line.from + headingMatch[0].length, insert: '' },
      });
    } else {
      view.dispatch({
        changes: { from: line.from, to: line.from + headingMatch[0].length, insert: targetPrefix },
        selection: { anchor: line.from + targetPrefix.length },
      });
    }
  } else {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: targetPrefix },
      selection: { anchor: line.from + targetPrefix.length },
    });
  }
  view.focus();
}


