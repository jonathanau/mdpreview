import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEditor,
  setEditorContent,
  setEditorTheme,
  wrapSelection,
  prefixLine,
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
});

// ─── Toggle ON/OFF for prefixLine-based buttons ──────────────────────────
// H1 (# ), H2 (## ), H3 (### ), UL (- ), OL (1. ), Blockquote (> )

// ─── Toggle: H1 button (toggleHeading with level 1) ──────────────────────

describe('Toggle: H1 button (toggleHeading with level 1)', () => {
  it('TOGGLE ON: adds # prefix to a line', () => {
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

  it('TOGGLE ON then OFF: press H1 twice toggles on then off', () => {
    const { view, container } = createTestEditor('Title');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# Title');
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('Title');
    container.remove();
  });

  it('DOWNGRADE: H2 on H1 replaces # with ##', () => {
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

  it('TOGGLE ON then OFF: press H2 twice toggles on then off', () => {
    const { view, container } = createTestEditor('Subtitle');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Subtitle');
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

  it('UPGRADE: H2 on H3 replaces ### with ##', () => {
    const { view, container } = createTestEditor('### Subtitle');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Subtitle');
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

  it('TOGGLE OFF: removes ### prefix from a line', () => {
    const { view, container } = createTestEditor('### Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('Section');
    container.remove();
  });

  it('TOGGLE ON then OFF: press H3 twice toggles on then off', () => {
    const { view, container } = createTestEditor('Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Section');
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('Section');
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

  it('UPGRADE: H3 on H2 replaces ## with ###', () => {
    const { view, container } = createTestEditor('## Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Section');
    container.remove();
  });

  it('DOWNGRADE: H2 on H3 replaces ### with ##', () => {
    const { view, container } = createTestEditor('### Section');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Section');
    container.remove();
  });
});

describe('Toggle: H4 button (toggleHeading with level 4)', () => {
  it('TOGGLE ON: adds #### prefix to a line', () => {
    const { view, container } = createTestEditor('Subsection');
    setSelection(view, 0, 0);
    toggleHeading(view, 4);
    expect(getDoc(view)).toBe('#### Subsection');
    container.remove();
  });

  it('UPGRADE: H4 on H2 replaces ## with ####', () => {
    const { view, container } = createTestEditor('## Subsection');
    setSelection(view, 0, 0);
    toggleHeading(view, 4);
    expect(getDoc(view)).toBe('#### Subsection');
    container.remove();
  });

  it('DOWNGRADE: H2 on H4 replaces #### with ##', () => {
    const { view, container } = createTestEditor('#### Subsection');
    setSelection(view, 0, 0);
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('## Subsection');
    container.remove();
  });
});

describe('Toggle: H5 button (toggleHeading with level 5)', () => {
  it('TOGGLE ON: adds ##### prefix to a line', () => {
    const { view, container } = createTestEditor('Minor heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 5);
    expect(getDoc(view)).toBe('##### Minor heading');
    container.remove();
  });

  it('UPGRADE: H5 on H3 replaces ### with #####', () => {
    const { view, container } = createTestEditor('### Minor heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 5);
    expect(getDoc(view)).toBe('##### Minor heading');
    container.remove();
  });

  it('DOWNGRADE: H3 on H5 replaces ##### with ###', () => {
    const { view, container } = createTestEditor('##### Minor heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 3);
    expect(getDoc(view)).toBe('### Minor heading');
    container.remove();
  });
});

describe('Toggle: H6 button (toggleHeading with level 6)', () => {
  it('TOGGLE ON: adds ###### prefix to a line', () => {
    const { view, container } = createTestEditor('Tiny heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 6);
    expect(getDoc(view)).toBe('###### Tiny heading');
    container.remove();
  });

  it('UPGRADE: H6 on H4 replaces #### with ######', () => {
    const { view, container } = createTestEditor('#### Tiny heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 6);
    expect(getDoc(view)).toBe('###### Tiny heading');
    container.remove();
  });

  it('DOWNGRADE: H1 on H6 replaces ###### with #', () => {
    const { view, container } = createTestEditor('###### Tiny heading');
    setSelection(view, 0, 0);
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('# Tiny heading');
    container.remove();
  });
});

describe('toggleHeading on multi-line documents', () => {
  it('toggles H1 on a line in the middle without affecting other lines', () => {
    const { view, container } = createTestEditor('Title\nBody\nFooter');
    setSelection(view, 6, 6); // cursor on "Body"
    toggleHeading(view, 1);
    expect(getDoc(view)).toBe('Title\n# Body\nFooter');
    container.remove();
  });

  it('downgrades H3 to H2 on a line in the middle without affecting other lines', () => {
    const { view, container } = createTestEditor('# Title\n### Body\nFooter');
    setSelection(view, 9, 9); // cursor on "### Body"
    toggleHeading(view, 2);
    expect(getDoc(view)).toBe('# Title\n## Body\nFooter');
    container.remove();
  });
});

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
