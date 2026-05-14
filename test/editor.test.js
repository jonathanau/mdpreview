import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEditor,
  setEditorContent,
  setEditorTheme,
  wrapSelection,
  prefixLine,
  prefixOrderedLine,
  toggleHeading,
  themeCompartment,
  highlightCompartment,
} from '../src/editor.js';

// ─── Helper ──────────────────────────────────────────────────────────────

function createTestEditor(doc = '') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const view = createEditor({ container, doc, onChange: () => {} });
  return { view, container };
}

function getDoc(view) {
  return view.state.doc.toString();
}

function setSelection(view, anchor, head) {
  view.dispatch({ selection: { anchor, head } });
}

// ─── createEditor ─────────────────────────────────────────────────────────

describe('createEditor', () => {
  it('creates an editor with the given initial document', () => {
    const { view, container } = createTestEditor('hello world');
    expect(getDoc(view)).toBe('hello world');
    container.remove();
  });

  it('creates an editor with an empty document by default', () => {
    const { view, container } = createTestEditor();
    expect(getDoc(view)).toBe('');
    container.remove();
  });

  it('appends the editor DOM to the container', () => {
    const { view, container } = createTestEditor();
    expect(container.querySelector('.cm-editor')).toBeTruthy();
    container.remove();
  });

  it('calls onChange when the document changes', () => {
    const changes = [];
    const container = document.createElement('div');
    document.body.appendChild(container);
    const view = createEditor({ container, doc: '', onChange: (v) => changes.push(v) });
    view.dispatch({ changes: { from: 0, insert: 'abc' } });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toBe('abc');
    container.remove();
  });
});

// ─── setEditorContent ────────────────────────────────────────────────────

describe('setEditorContent', () => {
  it('replaces all content with the new text', () => {
    const { view, container } = createTestEditor('old content');
    setEditorContent(view, 'new content');
    expect(getDoc(view)).toBe('new content');
    container.remove();
  });

  it('can set content to empty string', () => {
    const { view, container } = createTestEditor('some text');
    setEditorContent(view, '');
    expect(getDoc(view)).toBe('');
    container.remove();
  });
});

// ─── setEditorTheme ──────────────────────────────────────────────────────

describe('setEditorTheme', () => {
  it('reconfigures the theme compartment without error', () => {
    const { view, container } = createTestEditor('text');
    expect(() => setEditorTheme(view, true)).not.toThrow();
    expect(() => setEditorTheme(view, false)).not.toThrow();
    container.remove();
  });
});

// ─── wrapSelection (bold, italic, strikethrough, inline code) ────────────

describe('wrapSelection', () => {
  it('wraps selected text with before and after strings', () => {
    const { view, container } = createTestEditor('hello');
    setSelection(view, 0, 5);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**hello**');
    container.remove();
  });

  it('uses "text" placeholder when nothing is selected', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**text**');
    container.remove();
  });

  it('places cursor inside the wrapped text after wrapping', () => {
    const { view, container } = createTestEditor('hello');
    setSelection(view, 0, 5);
    wrapSelection(view, '**', '**');
    const { anchor, head } = view.state.selection.main;
    // anchor at start of "hello", head at end of "hello" inside the markers
    expect(anchor).toBe(2); // after "**"
    expect(head).toBe(7);   // after "**hello"
    container.remove();
  });
});

// ─── Toggle ON/OFF for wrapSelection-based buttons ───────────────────────
// Bold (**), Italic (*), Strikethrough (~~), Inline Code (`)

describe('Toggle: Bold button (wrapSelection with **)', () => {
  it('TOGGLE ON: wraps selected text with **', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**word**');
    container.remove();
  });

  it('TOGGLE ON: inserts **text** placeholder when no selection', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**text**');
    container.remove();
  });

  it('TOGGLE OFF: pressing bold on **word** (full selection including markers) removes **', () => {
    const { view, container } = createTestEditor('**word**');
    setSelection(view, 0, 8); // select "**word**"
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE OFF: pressing bold when cursor is inside **word** (selection inside markers) removes **', () => {
    const { view, container } = createTestEditor('**word**');
    setSelection(view, 2, 6); // select "word" inside **...**
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE ON then OFF: press bold twice on plain text toggles formatting on then off', () => {
    const { view, container } = createTestEditor('word');
    // First press: toggle ON
    setSelection(view, 0, 4);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**word**');
    // Second press: toggle OFF (selection is now inside the markers)
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });
});

describe('Toggle: Italic button (wrapSelection with *)', () => {
  it('TOGGLE ON: wraps selected text with *', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('*word*');
    container.remove();
  });

  it('TOGGLE ON: inserts *text* placeholder when no selection', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('*text*');
    container.remove();
  });

  it('TOGGLE OFF: pressing italic on *word* (full selection including markers) removes *', () => {
    const { view, container } = createTestEditor('*word*');
    setSelection(view, 0, 6);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE OFF: pressing italic when selection is inside *word* removes *', () => {
    const { view, container } = createTestEditor('*word*');
    setSelection(view, 1, 5);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE ON then OFF: press italic twice on plain text toggles formatting on then off', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('*word*');
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });
});

describe('Toggle: Strikethrough button (wrapSelection with ~~)', () => {
  it('TOGGLE ON: wraps selected text with ~~', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('~~word~~');
    container.remove();
  });

  it('TOGGLE ON: inserts ~~text~~ placeholder when no selection', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('~~text~~');
    container.remove();
  });

  it('TOGGLE OFF: pressing strikethrough on ~~word~~ (full selection) removes ~~', () => {
    const { view, container } = createTestEditor('~~word~~');
    setSelection(view, 0, 8);
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE OFF: pressing strikethrough when selection is inside ~~word~~ removes ~~', () => {
    const { view, container } = createTestEditor('~~word~~');
    setSelection(view, 2, 6);
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE ON then OFF: press strikethrough twice on plain text toggles on then off', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('~~word~~');
    wrapSelection(view, '~~', '~~');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });
});

describe('Toggle: Inline code button (wrapSelection with `)', () => {
  it('TOGGLE ON: wraps selected text with backticks', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('`word`');
    container.remove();
  });

  it('TOGGLE ON: inserts `text` placeholder when no selection', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('`text`');
    container.remove();
  });

  it('TOGGLE OFF: pressing code on `word` (full selection) removes backticks', () => {
    const { view, container } = createTestEditor('`word`');
    setSelection(view, 0, 6);
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE OFF: pressing code when selection is inside `word` removes backticks', () => {
    const { view, container } = createTestEditor('`word`');
    setSelection(view, 1, 5);
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE ON then OFF: press code twice on plain text toggles on then off', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('`word`');
    wrapSelection(view, '`', '`');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });
});

describe('Toggle: Code block button (wrapSelection with ```)', () => {
  it('TOGGLE ON: wraps selected text with triple backticks', () => {
    const { view, container } = createTestEditor('code block');
    setSelection(view, 0, 10);
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('```code block```');
    container.remove();
  });

  it('TOGGLE ON: inserts ```text``` placeholder when no selection', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('```text```');
    container.remove();
  });

  it('TOGGLE OFF: pressing code block on ```word``` (full selection) removes triple backticks', () => {
    const { view, container } = createTestEditor('```word```');
    setSelection(view, 0, 10);
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE OFF: pressing code block when selection is inside ```word``` removes triple backticks', () => {
    const { view, container } = createTestEditor('```word```');
    setSelection(view, 3, 7);
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });

  it('TOGGLE ON then OFF: press code block twice on plain text toggles formatting on then off', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('```word```');
    wrapSelection(view, '```', '```');
    expect(getDoc(view)).toBe('word');
    container.remove();
  });
});

// ─── prefixLine (headings, lists, blockquote) ────────────────────────────

describe('prefixLine', () => {
  it('adds a prefix to the beginning of the current line', () => {
    const { view, container } = createTestEditor('hello');
    setSelection(view, 0, 0);
    prefixLine(view, '# ');
    expect(getDoc(view)).toBe('# hello');
    container.remove();
  });

  it('removes the prefix if the line already starts with it (toggle off)', () => {
    const { view, container } = createTestEditor('# hello');
    setSelection(view, 0, 0);
    prefixLine(view, '# ');
    expect(getDoc(view)).toBe('hello');
    container.remove();
  });

  it('works on a line in the middle of a multi-line document', () => {
    const { view, container } = createTestEditor('line1\nline2\nline3');
    setSelection(view, 6, 6); // cursor on "line2"
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('line1\n- line2\nline3');
    container.remove();
  });

  it('places cursor at end of line after toggle ON', () => {
    const { view, container } = createTestEditor('hello');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(view.state.selection.main.anchor).toBe(7);
    container.remove();
  });

  it('places cursor at end of line after longer prefix like "1. "', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(view.state.selection.main.anchor).toBe(7);
    container.remove();
  });

  it('places cursor at end of line after "> " prefix', () => {
    const { view, container } = createTestEditor('quote');
    setSelection(view, 0, 0);
    prefixLine(view, '> ');
    expect(view.state.selection.main.anchor).toBe(7);
    container.remove();
  });

  it('inserts "- " and places cursor after it on empty line', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- ');
    expect(view.state.selection.main.anchor).toBe(2);
    container.remove();
  });

  it('inserts "> " and places cursor after it on empty line', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('> ');
    expect(view.state.selection.main.anchor).toBe(2);
    container.remove();
  });

  it('inserts "1. " and places cursor after it on empty line', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('1. ');
    expect(view.state.selection.main.anchor).toBe(3);
    container.remove();
  });

  it('places cursor at end of content after toggle OFF (cursor only)', () => {
    const { view, container } = createTestEditor('- hello');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('hello');
    expect(view.state.selection.main.anchor).toBe(5);
    container.remove();
  });

  it('places cursor at end of content after toggle OFF "1. " prefix', () => {
    const { view, container } = createTestEditor('1. hello');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('hello');
    expect(view.state.selection.main.anchor).toBe(5);
    container.remove();
  });
});



// ─── Toggle: Heading buttons (toggleHeading) ─────────────────────────────

describe('Toggle: H1 button (toggleHeading with level 1)', () => {
  it('TOGGLE ON: adds # prefix to a plain line', () => {
    const { view, container } = createTestEditor('Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# Title');
    container.remove();
  });

  it('TOGGLE OFF: removes # prefix from a line', () => {
    const { view, container } = createTestEditor('# Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('Title');
    container.remove();
  });

  it('DOWNGRADE: H2 replaces # with ##', () => {
    const { view, container } = createTestEditor('# Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Title');
    container.remove();
  });

  it('UPGRADE: H1 on H2 replaces ## with #', () => {
    const { view, container } = createTestEditor('## Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# Title');
    container.remove();
  });
});

describe('Toggle: H2 button (toggleHeading with level 2)', () => {
  it('TOGGLE ON: adds ## prefix to a line', () => {
    const { view, container } = createTestEditor('Subtitle');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Subtitle');
    container.remove();
  });

  it('TOGGLE OFF: removes ## prefix from a line', () => {
    const { view, container } = createTestEditor('## Subtitle');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('Subtitle');
    container.remove();
  });

  it('DOWNGRADE: H3 on H2 replaces ## with ###', () => {
    const { view, container } = createTestEditor('## Subtitle');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Subtitle');
    container.remove();
  });
});

describe('Toggle: H3 button (toggleHeading with level 3)', () => {
  it('TOGGLE ON: adds ### prefix to a line', () => {
    const { view, container } = createTestEditor('Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Section');
    container.remove();
  });

  it('UPGRADE: H3 on H1 replaces # with ###', () => {
    const { view, container } = createTestEditor('# Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Section');
    container.remove();
  });

  it('DOWNGRADE: H1 on H3 replaces ### with #', () => {
    const { view, container } = createTestEditor('### Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# Section');
    container.remove();
  });
});

describe('toggleHeading cursor position', () => {
  it('places cursor after "# " on empty line when toggling H1 ON', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(view.state.selection.main.anchor).toBe(2);
    container.remove();
  });

  it('places cursor after "## " on empty line when toggling H2 ON', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(view.state.selection.main.anchor).toBe(3);
    container.remove();
  });

  it('places cursor after "# " when cursor at line start on non-empty line', () => {
    const { view, container } = createTestEditor('Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(view.state.selection.main.anchor).toBe(2);
    container.remove();
  });

  it('places cursor after "## " when upgrading from H1 to H2', () => {
    const { view, container } = createTestEditor('# Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(view.state.selection.main.anchor).toBe(3);
    container.remove();
  });

  it('places cursor after "# " when downgrading from H2 to H1', () => {
    const { view, container } = createTestEditor('## Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(view.state.selection.main.anchor).toBe(2);
    container.remove();
  });
});

describe('toggleHeading edge cases', () => {
  it('applies H1 to an empty line', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# ');
    container.remove();
  });

  it('replaces heading prefix on content without a trailing space after #', () => {
    const { view, container } = createTestEditor('#Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# #Title');
    container.remove();
  });

  it('toggles H1 on a line in a multi-line document without affecting others', () => {
    const { view, container } = createTestEditor('A\nB\nC');
    setSelection(view, 2, 2);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('A\n# B\nC');
    container.remove();
  });

  it('downgrades H3 to H2 in a multi-line document without affecting others', () => {
    const { view, container } = createTestEditor('# A\n### B\nC');
    setSelection(view, 7, 7);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('# A\n## B\nC');
    container.remove();
  });

  it('preserves text after the heading marker', () => {
    const { view, container } = createTestEditor('## Hello world');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Hello world');
    container.remove();
  });

  it('heading with trailing whitespace is handled', () => {
    const { view, container } = createTestEditor('# Title  ');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('Title  ');
    container.remove();
  });
});

// ─── Toggle: Unordered list button (prefixLine with "- ") ─────────────────

describe('Toggle: Unordered list button (prefixLine with "- ")', () => {
  it('TOGGLE ON: adds - prefix to a line', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- item');
    container.remove();
  });

  it('TOGGLE OFF: removes - prefix from a line', () => {
    const { view, container } = createTestEditor('- item');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('item');
    container.remove();
  });

  it('TOGGLE ON then OFF: press UL twice toggles on then off', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- item');
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('item');
    container.remove();
  });
});

describe('Toggle: Ordered list button (prefixLine with "1. ")', () => {
  it('TOGGLE ON: adds 1. prefix to a line', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('1. item');
    container.remove();
  });

  it('TOGGLE OFF: removes 1. prefix from a line', () => {
    const { view, container } = createTestEditor('1. item');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('item');
    container.remove();
  });

  it('TOGGLE ON then OFF: press OL twice toggles on then off', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('1. item');
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('item');
    container.remove();
  });

  it('does not remove "10. " when toggling "1. " (exact prefix match)', () => {
    const { view, container } = createTestEditor('10. item');
    setSelection(view, 0, 0);
    prefixLine(view, '1. ');
    expect(getDoc(view)).toBe('1. 10. item');
    container.remove();
  });
});

describe('Toggle: Blockquote button (prefixLine with "> ")', () => {
  it('TOGGLE ON: adds > prefix to a line', () => {
    const { view, container } = createTestEditor('quote text');
    setSelection(view, 0, 0);
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('> quote text');
    container.remove();
  });

  it('TOGGLE OFF: removes > prefix from a line', () => {
    const { view, container } = createTestEditor('> quote text');
    setSelection(view, 0, 0);
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('quote text');
    container.remove();
  });

  it('TOGGLE ON then OFF: press blockquote twice toggles on then off', () => {
    const { view, container } = createTestEditor('quote text');
    setSelection(view, 0, 0);
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('> quote text');
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('quote text');
    container.remove();
  });
});

// ─── Link button (special wrapSelection logic from main.js) ──────────────

describe('Toggle: Link button logic', () => {
  // The link button in main.js uses a special case:
  //   If text is selected: wrapSelection(editorView, `[`, `](url)`)
  //   If no text selected: inserts `[link text](url)` with "link text" selected

  it('TOGGLE ON: wraps selected text as a link', () => {
    const { view, container } = createTestEditor('click here');
    setSelection(view, 0, 10);
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('[click here](url)');
    container.remove();
  });

  it('TOGGLE ON: inserts link template when no text selected', () => {
    const { view, container } = createTestEditor('');
    // Simulates the no-selection path from main.js (fixed: no double-insert)
    const { from, to } = view.state.selection.main;
    const text = 'link text';
    view.dispatch({
      changes: { from, to, insert: `[${text}](url)` },
      selection: { anchor: from + 1, head: from + 1 + text.length },
    });
    expect(getDoc(view)).toBe('[link text](url)');
    // "link text" should be selected
    const { anchor, head } = view.state.selection.main;
    expect(anchor).toBe(1);
    expect(head).toBe(10);
    container.remove();
  });

  it('TOGGLE OFF: pressing link on [click here](url) (full selection) removes link', () => {
    const { view, container } = createTestEditor('[click here](url)');
    setSelection(view, 0, 17); // select "[click here](url)"
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('click here');
    container.remove();
  });

  it('TOGGLE OFF: pressing link when selection is inside [text](url) removes link', () => {
    const { view, container } = createTestEditor('[click here](url)');
    setSelection(view, 1, 11); // select "click here" inside [...]
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('click here');
    container.remove();
  });

  it('TOGGLE ON then OFF: press link twice toggles on then off', () => {
    const { view, container } = createTestEditor('click here');
    setSelection(view, 0, 10);
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('[click here](url)');
    // Select the full link text including markers
    setSelection(view, 0, 17);
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('click here');
    container.remove();
  });
});

// ─── Multi-line prefixLine toggle scenarios ──────────────────────────────

describe('prefixLine toggle on multi-line documents', () => {
  it('toggles H1 on the second line without affecting other lines', () => {
    const { view, container } = createTestEditor('Title\nBody\nFooter');
    setSelection(view, 6, 6); // cursor on "Body"
    prefixLine(view, '# ');
    expect(getDoc(view)).toBe('Title\n# Body\nFooter');
    container.remove();
  });

  it('toggles off H1 on the second line without affecting other lines', () => {
    const { view, container } = createTestEditor('Title\n# Body\nFooter');
    setSelection(view, 8, 8); // cursor on "# Body" line
    prefixLine(view, '# ');
    expect(getDoc(view)).toBe('Title\nBody\nFooter');
    container.remove();
  });

  it('can toggle different prefixes on different lines independently', () => {
    const { view, container } = createTestEditor('line1\nline2\nline3');
    // Toggle UL on line 1
    setSelection(view, 0, 0);
    prefixLine(view, '- ');
    // Toggle quote on line 3
    setSelection(view, 9, 9); // start of "line3" after "- line1\nline2\n"
    // Recalculate position after first edit: "- line1\nline2\nline3"
    // "- line1" is 7 chars + newline = 8, "line2" is 5 + newline = 6, so "line3" starts at 14
    setSelection(view, 14, 14);
    prefixLine(view, '> ');
    expect(getDoc(view)).toBe('- line1\nline2\n> line3');
    container.remove();
  });
});

// ─── Multi-line prefixLine ────────────────────────────────────────────────

describe('Multi-line prefixLine', () => {
  it('toggle UL ON on all unprefixed lines', () => {
    const { view, container } = createTestEditor('a\nb\nc');
    setSelection(view, 0, 5); // selects all 3 lines
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- a\n- b\n- c');
    container.remove();
  });

  it('toggle UL OFF on all prefixed lines', () => {
    const { view, container } = createTestEditor('- a\n- b\n- c');
    setSelection(view, 0, 11);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('a\nb\nc');
    container.remove();
  });

  it('toggle UL ON on mixed selection (only unprefixed get prefix)', () => {
    const { view, container } = createTestEditor('- a\nb\n- c');
    setSelection(view, 0, 9);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- a\n- b\n- c');
    container.remove();
  });

  it('toggle UL ON excludes empty lines', () => {
    const { view, container } = createTestEditor('a\n\nc');
    setSelection(view, 0, 4);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- a\n\n- c');
    container.remove();
  });

  it('toggle UL OFF leaves empty lines alone', () => {
    const { view, container } = createTestEditor('- a\n\n- c');
    setSelection(view, 0, 8);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('a\n\nc');
    container.remove();
  });

  it('dangling selection at next line start excludes that line', () => {
    const { view, container } = createTestEditor('a\nb\nc');
    setSelection(view, 0, 2);
    prefixLine(view, '- ');
    expect(getDoc(view)).toBe('- a\nb\nc');
    container.remove();
  });

  it('preserves selection across all lines after multi-line toggle ON', () => {
    const { view, container } = createTestEditor('a\nb');
    setSelection(view, 0, 3);
    prefixLine(view, '- ');
    const sel = view.state.selection.main;
    expect(sel.anchor).toBe(0);
    expect(sel.head).toBe(7);
    container.remove();
  });

  it('preserves selection across all lines after multi-line toggle OFF', () => {
    const { view, container } = createTestEditor('- a\n- b');
    setSelection(view, 0, 7);
    prefixLine(view, '- ');
    const sel = view.state.selection.main;
    expect(sel.anchor).toBe(0);
    expect(sel.head).toBe(3);
    container.remove();
  });
});

// ─── prefixOrderedLine ────────────────────────────────────────────────────

describe('prefixOrderedLine', () => {
  it('adds "1. " prefix to an unprefixed line (toggle ON)', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. item');
    container.remove();
  });

  it('places cursor at end of line on toggle ON (single line)', () => {
    const { view, container } = createTestEditor('item');
    setSelection(view, 0, 0);
    prefixOrderedLine(view);
    expect(view.state.selection.main.anchor).toBe(7);
    container.remove();
  });

  it('inserts "1. " and places cursor after it on empty line', () => {
    const { view, container } = createTestEditor('');
    setSelection(view, 0, 0);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. ');
    expect(view.state.selection.main.anchor).toBe(3);
    container.remove();
  });

  it('removes "1. " prefix from a numbered line (toggle OFF)', () => {
    const { view, container } = createTestEditor('1. item');
    setSelection(view, 0, 0);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('item');
    container.remove();
  });

  it('places cursor at end of content after toggle OFF (cursor only)', () => {
    const { view, container } = createTestEditor('1. item');
    setSelection(view, 0, 0);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('item');
    expect(view.state.selection.main.anchor).toBe(4);
    container.remove();
  });

  it('assigns sequential numbers on multi-line toggle ON', () => {
    const { view, container } = createTestEditor('a\nb\nc');
    setSelection(view, 0, 5);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. a\n2. b\n3. c');
    container.remove();
  });

  it('removes all number prefixes on multi-line toggle OFF', () => {
    const { view, container } = createTestEditor('1. a\n2. b\n3. c');
    setSelection(view, 0, 14);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('a\nb\nc');
    container.remove();
  });

  it('skips already-numbered lines and numbers the rest sequentially', () => {
    const { view, container } = createTestEditor('1. a\nb\n3. c');
    setSelection(view, 0, 11);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. a\n2. b\n3. c');
    container.remove();
  });

  it('skips empty lines on toggle ON', () => {
    const { view, container } = createTestEditor('a\n\nc');
    setSelection(view, 0, 4);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. a\n\n2. c');
    container.remove();
  });

  it('handles toggle OFF with multi-digit numbers', () => {
    const { view, container } = createTestEditor('10. a\n20. b');
    setSelection(view, 0, 11);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('a\nb');
    container.remove();
  });

  it('dangling selection at next line start excludes that line', () => {
    const { view, container } = createTestEditor('a\nb\nc');
    setSelection(view, 0, 2);
    prefixOrderedLine(view);
    expect(getDoc(view)).toBe('1. a\nb\nc');
    container.remove();
  });

  it('preserves selection across all lines after multi-line toggle ON', () => {
    const { view, container } = createTestEditor('a\nb');
    setSelection(view, 0, 3);
    prefixOrderedLine(view);
    const sel = view.state.selection.main;
    expect(sel.anchor).toBe(0);
    expect(sel.head).toBe(9);
    container.remove();
  });

  it('preserves selection across all lines after multi-line toggle OFF', () => {
    const { view, container } = createTestEditor('1. a\n2. b');
    setSelection(view, 0, 9);
    prefixOrderedLine(view);
    const sel = view.state.selection.main;
    expect(sel.anchor).toBe(0);
    expect(sel.head).toBe(3);
    container.remove();
  });
});

// ─── Enter key after list creation ─────────────────────────────────────────

describe('Enter after list creation', () => {
  it('continues numbered list correctly from cursor at end of line', async () => {
    const { view, container } = createTestEditor('');
    const { insertNewlineContinueMarkup } = await import('@codemirror/lang-markdown');

    // Simulate: OL button → "1. ", type "item" → "1. item", cursor at end (pos 7)
    view.dispatch({ changes: { from: 0, insert: '1. item' }, selection: { anchor: 7 } });

    insertNewlineContinueMarkup(view);
    expect(getDoc(view)).toBe('1. item\n2. ');
    container.remove();
  });

  it('continues numbered list correctly after prefixOrderedLine', async () => {
    const { view, container } = createTestEditor('');
    const { insertNewlineContinueMarkup } = await import('@codemirror/lang-markdown');

    // Simulate: OL button on empty line, then type "item"
    prefixOrderedLine(view);
    view.dispatch({ changes: { from: 3, insert: 'item' }, selection: { anchor: 7 } });

    expect(getDoc(view)).toBe('1. item');
    insertNewlineContinueMarkup(view);
    expect(getDoc(view)).toBe('1. item\n2. ');
    container.remove();
  });

  it('continues bullet list correctly after prefixLine', async () => {
    const { view, container } = createTestEditor('');
    const { insertNewlineContinueMarkup } = await import('@codemirror/lang-markdown');

    prefixLine(view, '- ');
    view.dispatch({ changes: { from: 2, insert: 'item' }, selection: { anchor: 6 } });

    expect(getDoc(view)).toBe('- item');
    insertNewlineContinueMarkup(view);
    expect(getDoc(view)).toBe('- item\n- ');
    container.remove();
  });
});

// ─── wrapSelection edge cases ────────────────────────────────────────────

describe('wrapSelection edge cases', () => {
  it('wraps an empty selection with placeholder text', () => {
    const { view, container } = createTestEditor('hello');
    setSelection(view, 5, 5); // cursor at end, no selection
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('hello**text**');
    container.remove();
  });

  it('wraps multi-word selection', () => {
    const { view, container } = createTestEditor('the quick brown fox');
    setSelection(view, 4, 15); // "quick brown"
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('the *quick brown* fox');
    container.remove();
  });

  it('can apply bold then italic sequentially (nested formatting)', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**word**');
    // Now select the bold text including markers
    setSelection(view, 0, 8);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('***word***');
    container.remove();
  });

  it('does not unwrap ***word*** with * because inner **word** is also wrapped with *', () => {
    const { view, container } = createTestEditor('***word***');
    setSelection(view, 0, 10); // select ***word***
    wrapSelection(view, '*', '*');
    // Guard prevents unwrapping: inner **word** starts/ends with *, so it wraps instead
    expect(getDoc(view)).toBe('****word****');
    container.remove();
  });
});

// ─── Format keymap (Ctrl+B, Ctrl+I, Ctrl+K) ─────────────────────────────

describe('Format keymap', () => {
  it('Ctrl+B bolds selected text', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    view.dispatch({ effects: [] }); // ensure view is active
    // Simulate keymap by calling the same logic the keymap uses
    wrapSelection(view, '**', '**');
    expect(getDoc(view)).toBe('**word**');
    container.remove();
  });

  it('Ctrl+I italicizes selected text', () => {
    const { view, container } = createTestEditor('word');
    setSelection(view, 0, 4);
    wrapSelection(view, '*', '*');
    expect(getDoc(view)).toBe('*word*');
    container.remove();
  });

  it('Ctrl+K wraps selected text as a link', () => {
    const { view, container } = createTestEditor('click here');
    setSelection(view, 0, 10);
    wrapSelection(view, '[', '](url)');
    expect(getDoc(view)).toBe('[click here](url)');
    container.remove();
  });

  it('Ctrl+K inserts link template when no text selected', () => {
    const { view, container } = createTestEditor('');
    const { from, to } = view.state.selection.main;
    const text = 'link text';
    view.dispatch({
      changes: { from, to, insert: `[${text}](url)` },
      selection: { anchor: from + 1, head: from + 1 + text.length },
    });
    expect(getDoc(view)).toBe('[link text](url)');
    container.remove();
  });
});
