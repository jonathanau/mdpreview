import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
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

export const lightEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#1a1714' },
  '.cm-content': { caretColor: '#c05a2b' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#c05a2b', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#f5e8df',
  },
  '.cm-activeLine': { backgroundColor: '#faf8f4' },
  '.cm-gutters': { backgroundColor: '#f0ede6', color: '#b0ab9f' },
  '.cm-activeLineGutter': { backgroundColor: '#e8e4dc', color: '#6b6560' },
  '.cm-foldPlaceholder': { backgroundColor: '#e0dbd0', border: 'none', color: '#6b6560' },
}, { dark: false });

export const darkEditorTheme = EditorView.theme({
  '&': { backgroundColor: '#211e24', color: '#ede9f0' },
  '.cm-content': { caretColor: '#e07a4f' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#e07a4f', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#3a2518',
  },
  '.cm-activeLine': { backgroundColor: '#252228' },
  '.cm-gutters': { backgroundColor: '#1c1a1f', color: '#4a4555' },
  '.cm-activeLineGutter': { backgroundColor: '#252228', color: '#9e99a8' },
  '.cm-foldPlaceholder': { backgroundColor: '#332f3a', border: 'none', color: '#9e99a8' },
}, { dark: true });

// ─── Syntax Highlighting ───────────────────────────────────────────────────

export const lightHighlight = HighlightStyle.define([
  { tag: t.heading1, color: '#1a1714', fontWeight: '500', fontSize: '1.25em' },
  { tag: t.heading2, color: '#1a1714', fontWeight: '500', fontSize: '1.1em' },
  { tag: t.heading3, color: '#1a1714', fontWeight: '500' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#3a3530', fontWeight: '500' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#3a3530' },
  { tag: t.strong, fontWeight: '500', color: '#1a1714' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#9c978e' },
  { tag: t.link, color: '#c05a2b', textDecoration: 'underline', textUnderlineOffset: '3px' },
  { tag: t.url, color: '#9c978e' },
  { tag: t.quote, color: '#6b6560', fontStyle: 'italic' },
  { tag: t.monospace, color: '#c05a2b', fontFamily: "'JetBrains Mono', monospace" },
  { tag: t.comment, color: '#9c978e', fontStyle: 'italic' },
  { tag: [t.keyword, t.operator], color: '#b04030' },
  { tag: [t.string, t.special(t.brace)], color: '#3c7a3c' },
  { tag: t.number, color: '#1565c0' },
  { tag: t.bool, color: '#b04030' },
  { tag: t.variableName, color: '#1a1714' },
  { tag: t.function(t.variableName), color: '#5a3a9a' },
  { tag: t.definition(t.variableName), color: '#5a3a9a' },
  { tag: t.typeName, color: '#1565c0' },
  { tag: t.punctuation, color: '#9c978e' },
  { tag: t.processingInstruction, color: '#9c978e' },
  { tag: t.meta, color: '#9c978e' },
  { tag: t.atom, color: '#b04030' },
]);

export const darkHighlight = HighlightStyle.define([
  { tag: t.heading1, color: '#ede9f0', fontWeight: '500', fontSize: '1.25em' },
  { tag: t.heading2, color: '#dbd7e0', fontWeight: '500', fontSize: '1.1em' },
  { tag: t.heading3, color: '#dbd7e0', fontWeight: '500' },
  { tag: [t.heading4, t.heading5, t.heading6], color: '#c8c4cc', fontWeight: '500' },
  { tag: t.emphasis, fontStyle: 'italic', color: '#c8c4cc' },
  { tag: t.strong, fontWeight: '500', color: '#ede9f0' },
  { tag: t.strikethrough, textDecoration: 'line-through', color: '#6e6a78' },
  { tag: t.link, color: '#e07a4f', textDecoration: 'underline', textUnderlineOffset: '3px' },
  { tag: t.url, color: '#6e6a78' },
  { tag: t.quote, color: '#9e99a8', fontStyle: 'italic' },
  { tag: t.monospace, color: '#e07a4f', fontFamily: "'JetBrains Mono', monospace" },
  { tag: t.comment, color: '#6e6a78', fontStyle: 'italic' },
  { tag: [t.keyword, t.operator], color: '#e06c75' },
  { tag: [t.string, t.special(t.brace)], color: '#98c379' },
  { tag: t.number, color: '#61afef' },
  { tag: t.bool, color: '#e06c75' },
  { tag: t.variableName, color: '#ede9f0' },
  { tag: t.function(t.variableName), color: '#c678dd' },
  { tag: t.definition(t.variableName), color: '#c678dd' },
  { tag: t.typeName, color: '#61afef' },
  { tag: t.punctuation, color: '#6e6a78' },
  { tag: t.processingInstruction, color: '#6e6a78' },
  { tag: t.meta, color: '#6e6a78' },
  { tag: t.atom, color: '#e06c75' },
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
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        bracketMatching(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        markdown({ base: markdownLanguage }),
        baseTheme,
        themeCompartment.of(isDark ? darkEditorTheme : lightEditorTheme),
        highlightCompartment.of(
          syntaxHighlighting(isDark ? darkHighlight : lightHighlight)
        ),
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
      highlightCompartment.reconfigure(
        syntaxHighlighting(isDark ? darkHighlight : lightHighlight)
      ),
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
  const text = selected || 'text';
  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: { anchor: from + before.length, head: from + before.length + text.length },
  });
  view.focus();
}

export function prefixLine(view, prefix) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const lineText = line.text;
  if (lineText.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: '' },
    });
  } else {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
    });
  }
  view.focus();
}

export function insertAtCursor(view, text) {
  const { from, to } = view.state.selection.main;
  view.dispatch({ changes: { from, to, insert: text } });
  view.focus();
}
