import './style.css';
import { Storage, extractTitle, relativeTime } from './storage.js';
import {
  createEditor,
  setEditorTheme,
  setEditorContent,
  wrapSelection,
  prefixLine,
  insertAtCursor,
} from './editor.js';
import { renderMarkdown, setHljsTheme } from './preview.js';

// ─── State ────────────────────────────────────────────────────────────────

const storage = new Storage();
let editorView = null;
let currentDoc = null;
let saveTimer = null;
let currentTheme = 'solarized-light';
let sidebarOpen = true;
let focusMode = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────

const docList = document.getElementById('doc-list');
const previewContent = document.getElementById('preview-content');
const previewEmpty = document.getElementById('preview-empty');
const statWords = document.getElementById('stat-words');
const statChars = document.getElementById('stat-chars');
const statLines = document.getElementById('stat-lines');
const statSaved = document.getElementById('stat-saved');

// ─── Init ─────────────────────────────────────────────────────────────────

async function init() {
  await storage.init();

  const savedTheme = localStorage.getItem('md-theme');
  if (savedTheme === 'light') currentTheme = 'folio';
  else if (savedTheme === 'dark') currentTheme = 'ember';
  else if (savedTheme) {
    currentTheme = savedTheme;
  } else {
    currentTheme = 'solarized-light';
  }
  applyTheme();

  const savedSidebar = localStorage.getItem('md-sidebar');
  sidebarOpen = savedSidebar !== 'closed';
  applySidebar();

  editorView = createEditor({
    container: document.getElementById('editor-mount'),
    doc: '',
    onChange: handleContentChange,
    isDark: isThemeDark(currentTheme),
  });

  let docs = await storage.list();
  if (docs.length === 0) {
    const doc = await storage.create('Welcome');
    await storage.save({ ...doc, content: defaultContent() });
    docs = await storage.list();
  }

  await openDoc(docs[0].id);
  renderSidebar();
  setupToolbar();
  setupSplitter();
}

// ─── Document management ──────────────────────────────────────────────────

async function openDoc(id) {
  const doc = await storage.get(id);
  if (!doc) return;
  currentDoc = doc;
  setEditorContent(editorView, doc.content);
  renderPreview(doc.content);
  updateStats(doc.content);
  editorView.focus();
}

async function renderSidebar() {
  const docs = await storage.list();
  docList.innerHTML = '';
  docs.forEach((doc) => {
    const el = document.createElement('div');
    el.className = 'doc-item' + (currentDoc && doc.id === currentDoc.id ? ' active' : '');
    el.dataset.id = doc.id;

    const title = extractTitle(doc.content) || 'Untitled';
    const time = relativeTime(doc.updatedAt);

    el.innerHTML = `
      <div class="doc-item-inner">
        <span class="doc-title">${escapeHtml(title)}</span>
        <span class="doc-time">${time}</span>
      </div>
      <button class="doc-delete" title="Delete" data-id="${doc.id}">
        <svg viewBox="0 0 24 24" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    `;

    el.addEventListener('click', (e) => {
      if (e.target.closest('.doc-delete')) return;
      openDoc(doc.id).then(renderSidebar);
    });

    el.querySelector('.doc-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (docs.length === 1) { showToast('Cannot delete the last document'); return; }
      await storage.delete(doc.id);
      const remaining = await storage.list();
      if (currentDoc && currentDoc.id === doc.id) {
        await openDoc(remaining[0].id);
      }
      renderSidebar();
    });

    docList.appendChild(el);
  });
}

function handleContentChange(content) {
  if (!currentDoc) return;
  currentDoc.content = content;
  renderPreview(content);
  updateStats(content);
  statSaved.textContent = 'saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await storage.save(currentDoc);
    statSaved.textContent = 'saved';
    renderSidebar();
  }, 600);
}

// ─── Preview ──────────────────────────────────────────────────────────────

function renderPreview(content) {
  if (!content.trim()) {
    previewEmpty.style.display = 'flex';
    previewContent.innerHTML = '';
    return;
  }
  previewEmpty.style.display = 'none';
  previewContent.innerHTML = renderMarkdown(content);
}

// ─── Stats ────────────────────────────────────────────────────────────────

function updateStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  statWords.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  statChars.textContent = `${text.length} chars`;
  statLines.textContent = `${text ? text.split('\n').length : 0} lines`;
}

// ─── Theme ────────────────────────────────────────────────────────────────

function isThemeDark(theme) {
  return ['solarized-dark', 'ember', 'monokai', 'nord', 'dracula'].includes(theme);
}

function applyTheme() {
  document.body.setAttribute('data-theme', currentTheme);
  setHljsTheme(currentTheme);
  if (editorView) setEditorTheme(editorView, isThemeDark(currentTheme));
  const sel = document.getElementById('sel-theme');
  if (sel) sel.value = currentTheme;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

function applySidebar() {
  document.getElementById('sidebar').classList.toggle('hidden', !sidebarOpen);
  document.getElementById('btn-sidebar').classList.toggle('active', sidebarOpen);
}

// ─── Focus mode ───────────────────────────────────────────────────────────

function applyFocus() {
  document.body.classList.toggle('focus-mode', focusMode);
  document.getElementById('btn-focus').classList.toggle('active', focusMode);
}

// ─── Toolbar ──────────────────────────────────────────────────────────────

function setupToolbar() {
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);

  on('btn-sidebar', () => {
    sidebarOpen = !sidebarOpen;
    localStorage.setItem('md-sidebar', sidebarOpen ? 'open' : 'closed');
    applySidebar();
  });

  on('btn-new', async () => {
    const doc = await storage.create();
    await storage.save({ ...doc, content: '' });
    await openDoc(doc.id);
    renderSidebar();
  });

  document.getElementById('sel-theme')?.addEventListener('change', (e) => {
    currentTheme = e.target.value;
    localStorage.setItem('md-theme', currentTheme);
    applyTheme();
  });

  on('btn-focus', () => { focusMode = !focusMode; applyFocus(); });

  on('btn-download', () => {
    if (!currentDoc) return;
    const content = editorView.state.doc.toString();
    const title = extractTitle(content) || 'document';
    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    showToast('Downloaded');
  });

  on('btn-copy-html', () => {
    const html = renderMarkdown(editorView.state.doc.toString());
    navigator.clipboard.writeText(html).then(() => showToast('HTML copied'));
  });

  on('tb-bold', () => wrapSelection(editorView, '**', '**'));
  on('tb-italic', () => wrapSelection(editorView, '*', '*'));
  on('tb-strike', () => wrapSelection(editorView, '~~', '~~'));
  on('tb-code', () => wrapSelection(editorView, '`', '`'));
  on('tb-code-block', () => wrapSelection(editorView, '```', '```'));
  on('tb-h1', () => prefixLine(editorView, '# '));
  on('tb-h2', () => prefixLine(editorView, '## '));
  on('tb-h3', () => prefixLine(editorView, '### '));
  on('tb-ul', () => prefixLine(editorView, '- '));
  on('tb-ol', () => prefixLine(editorView, '1. '));
  on('tb-quote', () => prefixLine(editorView, '> '));
  on('tb-link', () => {
    const { from, to } = editorView.state.selection.main;
    const sel = editorView.state.sliceDoc(from, to);
    const text = sel || 'link text';
    wrapSelection(editorView, `[${sel ? '' : text}`, `${sel ? '' : ''}](url)`);
    if (!sel) {
      editorView.dispatch({
        changes: { from, to, insert: `[${text}](url)` },
        selection: { anchor: from + 1, head: from + 1 + text.length },
      });
      editorView.focus();
    }
  });
}

// ─── Splitter ─────────────────────────────────────────────────────────────

function setupSplitter() {
  const splitter = document.getElementById('splitter');
  const editorPane = document.getElementById('editor-pane');
  const previewPane = document.getElementById('preview-pane');
  let dragging = false, startX = 0, startW = 0;

  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startW = editorPane.getBoundingClientRect().width;
    splitter.classList.add('dragging');
    document.body.style.cssText += 'cursor:col-resize;user-select:none;';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const main = document.getElementById('main');
    const total = main.getBoundingClientRect().width;
    const newW = Math.max(200, Math.min(total - 200, startW + (e.clientX - startX)));
    editorPane.style.flex = `0 0 ${((newW / total) * 100).toFixed(2)}%`;
    previewPane.style.flex = '1';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function defaultContent() {
  return `# Welcome to MDPreview

A minimal, elegant writing environment. Your documents are stored locally in your browser using IndexedDB — no server required.

## Features

- **CodeMirror 6** editor with Markdown syntax highlighting
- **Live preview** with code syntax highlighting via highlight.js
- **Multi-document** support — create, switch, and delete files from the sidebar
- **IndexedDB** persistence — documents survive page refreshes
- **Drag** the center divider to resize editor and preview panes
- **Focus mode** — hide everything but the editor
- **Dark mode** with system preference detection

## Quick Reference

| Format | Syntax | Shortcut |
|--------|--------|----------|
| Bold | \`**text**\` | Ctrl+B |
| Italic | \`*text*\` | Ctrl+I |
| Heading | \`# H1\` | toolbar |
| Link | \`[text](url)\` | toolbar |

## Code Blocks

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet('world'));
\`\`\`

> Writing is thinking. To write well is to think clearly.

---

*Create a new document using the + button in the sidebar.*
`;
}

// ─── Start ────────────────────────────────────────────────────────────────

init().catch(console.error);
