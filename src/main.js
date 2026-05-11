import './style.css';
import { Storage, extractTitle, relativeTime } from './storage.js';
import {
  createEditor,
  setEditorTheme,
  setEditorContent,
  wrapSelection,
  prefixLine,
} from './editor.js';
import { renderMarkdown, setHljsTheme } from './preview.js';

// ─── State ────────────────────────────────────────────────────────────────

const storage = new Storage();
let editorView = null;
let currentDoc = null;
let saveTimer = null;
let previewTimer = null;
let currentTheme = 'solarized-light';
let sidebarOpen = true;
let sidebarWidth = 220; // Default width
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
  try {
    await storage.init();
  } catch (err) {
    console.error('Storage init failed:', err);
    showToast('Failed to open document storage');
    return;
  }

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

  const savedWidth = localStorage.getItem('md-sidebar-width');
  if (savedWidth) {
    sidebarWidth = parseInt(savedWidth, 10);
  }
  applySidebar();

  editorView = createEditor({
    container: document.getElementById('editor-mount'),
    doc: '',
    onChange: handleContentChange,
    isDark: isThemeDark(currentTheme),
  });

  try {
    let docs = await storage.list();
    if (docs.length === 0) {
      const doc = await storage.create('Welcome');
      await storage.save({ ...doc, content: defaultContent() });
      docs = await storage.list();
    }
    await openDoc(docs[0].id);
  } catch (err) {
    console.error('Failed to load documents:', err);
    showToast('Failed to load documents');
  }

  renderSidebar();
  setupToolbar();
  setupSplitter();
  setupSidebarKeyboard();

  document.documentElement.classList.remove('loading');
}

// ─── Document management ──────────────────────────────────────────────────

async function openDoc(id) {
  // Flush any pending save for the current document before switching
  if (saveTimer && currentDoc) {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      await storage.save(currentDoc);
      statSaved.textContent = 'saved';
    } catch (err) {
      console.error('Save failed during switch:', err);
    }
  }
  try {
    const doc = await storage.get(id);
    if (!doc) return;
    currentDoc = doc;
    setEditorContent(editorView, doc.content);
    renderPreview(doc.content);
    updateStats(doc.content);
    editorView.focus();
  } catch (err) {
    console.error('Failed to open document:', err);
    showToast('Failed to open document');
  }
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
        <span class="doc-time">${escapeHtml(time)}</span>
      </div>
      <button class="doc-delete" title="Delete" aria-label="Delete ${escapeHtml(title)}" data-id="${doc.id}">
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
      const confirmed = await showConfirm('Delete this document?');
      if (!confirmed) return;
      try {
        await storage.delete(doc.id);
        const remaining = await storage.list();
        if (currentDoc && currentDoc.id === doc.id) {
          await openDoc(remaining[0].id);
        }
        renderSidebar();
      } catch (err) {
        console.error('Delete failed:', err);
        showToast('Failed to delete document');
      }
    });

    docList.appendChild(el);
  });
}

function handleContentChange(content) {
  if (!currentDoc) return;
  currentDoc.content = content;
  schedulePreview(content);
  updateStats(content);
  statSaved.textContent = 'saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await storage.save(currentDoc);
      statSaved.textContent = 'saved';
      renderSidebar();
    } catch (err) {
      console.error('Save failed:', err);
      statSaved.textContent = 'save failed';
      showToast('Save failed');
    }
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

function schedulePreview(content) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => renderPreview(content), 150);
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
  return ['solarized-dark', 'ember', 'monokai', 'nord', 'one-dark'].includes(theme);
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  setHljsTheme(currentTheme);
  if (editorView) setEditorTheme(editorView, isThemeDark(currentTheme));

  // Update custom dropdown
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.value === currentTheme);
  });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

function applySidebar() {
  const sidebar = document.getElementById('sidebar');
  const splitter = document.getElementById('sidebar-splitter');
  sidebar.classList.toggle('hidden', !sidebarOpen);
  if (sidebarOpen) {
    sidebar.style.width = `${sidebarWidth}px`;
    splitter.style.display = 'block';
  } else {
    sidebar.style.width = '0';
    splitter.style.display = 'none';
  }
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
    try {
      const doc = await storage.create();
      await storage.save({ ...doc, content: '' });
      await openDoc(doc.id);
      renderSidebar();
    } catch (err) {
      console.error('Failed to create document:', err);
      showToast('Failed to create document');
    }
  });

  // Theme switcher logic
  const themeSwitcher = document.getElementById('theme-switcher');
  const themeMenu = document.getElementById('theme-menu');
  const btnTheme = document.getElementById('btn-theme');
  let originalTheme = currentTheme;

  const closeThemeMenu = () => {
    themeSwitcher.classList.remove('open');
    btnTheme?.setAttribute('aria-expanded', 'false');
    if (currentTheme !== originalTheme) {
      currentTheme = originalTheme;
      applyTheme();
    }
  };

  btnTheme?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = themeSwitcher.classList.contains('open');
    if (isOpen) {
      closeThemeMenu();
    } else {
      themeSwitcher.classList.add('open');
      btnTheme?.setAttribute('aria-expanded', 'true');
      originalTheme = currentTheme;
      // Focus the active (or first) option
      const active = themeMenu.querySelector('.theme-option.active') || themeMenu.querySelector('.theme-option');
      active?.focus();
    }
  });

  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('mouseenter', () => {
      const theme = opt.dataset.value;
      document.documentElement.setAttribute('data-theme', theme);
      setHljsTheme(theme);
      if (editorView) setEditorTheme(editorView, isThemeDark(theme));
    });

    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTheme = opt.dataset.value;
      originalTheme = currentTheme;
      localStorage.setItem('md-theme', currentTheme);
      applyTheme();
      themeSwitcher.classList.remove('open');
    });
  });

  themeSwitcher?.addEventListener('mouseleave', () => {
    if (themeSwitcher.classList.contains('open')) {
      // Revert to original if we leave the switcher area
      document.documentElement.setAttribute('data-theme', originalTheme);
      setHljsTheme(originalTheme);
      if (editorView) setEditorTheme(editorView, isThemeDark(originalTheme));
    }
  });

  document.addEventListener('click', (e) => {
    if (!themeSwitcher?.contains(e.target)) {
      closeThemeMenu();
    }
  });

  // Theme menu keyboard navigation
  themeMenu?.addEventListener('keydown', (e) => {
    const options = [...themeMenu.querySelectorAll('.theme-option')];
    const current = document.activeElement;
    const idx = options.indexOf(current);

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown'
        ? options[(idx + 1) % options.length]
        : options[(idx - 1 + options.length) % options.length];
      next?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      current?.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeThemeMenu();
      btnTheme?.focus();
    }
  });

  on('btn-focus', () => { focusMode = !focusMode; applyFocus(); });

  on('btn-preview-toggle', () => {
    document.body.classList.toggle('mobile-preview');
    const btn = document.getElementById('btn-preview-toggle');
    btn?.classList.toggle('active', document.body.classList.contains('mobile-preview'));
  });

  on('btn-download-md', () => {
    if (!currentDoc) return;
    const content = editorView.state.doc.toString();
    const title = extractTitle(content) || 'document';
    const blob = new Blob([content], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded');
  });

  on('btn-copy-md', () => {
    const content = editorView.state.doc.toString();
    navigator.clipboard.writeText(content).then(() => showToast('Markdown copied'));
  });

  on('btn-copy-html', () => {
    const html = renderMarkdown(editorView.state.doc.toString());
    navigator.clipboard.writeText(html).then(() => showToast('HTML copied'));
  });

  on('btn-download-html', () => {
    const content = editorView.state.doc.toString();
    const title = extractTitle(content) || 'document';
    const html = renderMarkdown(content);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded');
  });

  on('tb-bold', () => wrapSelection(editorView, '**', '**'));
  on('tb-italic', () => wrapSelection(editorView, '*', '*'));
  on('tb-strike', () => wrapSelection(editorView, '~~', '~~'));
  on('tb-code', () => wrapSelection(editorView, '`', '`'));
  on('tb-codeblock', () => wrapSelection(editorView, '```\n', '\n```'));

  on('tb-h1', () => prefixLine(editorView, '# '));
  on('tb-h2', () => prefixLine(editorView, '## '));
  on('tb-h3', () => prefixLine(editorView, '### '));
  on('tb-ul', () => prefixLine(editorView, '- '));
  on('tb-ol', () => prefixLine(editorView, '1. '));
  on('tb-quote', () => prefixLine(editorView, '> '));
  on('tb-link', () => {
    const { from, to } = editorView.state.selection.main;
    const sel = editorView.state.sliceDoc(from, to);
    if (sel) {
      wrapSelection(editorView, '[', '](url)');
    } else {
      const text = 'link text';
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
  const main = document.getElementById('main');

  // Sidebar splitter
  const sidebarSplitter = document.getElementById('sidebar-splitter');
  const sidebar = document.getElementById('sidebar');
  let sidebarDragging = false;

  sidebarSplitter.addEventListener('mousedown', (e) => {
    sidebarDragging = true;
    sidebarSplitter.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  // Main splitter (Editor/Preview)
  const mainSplitter = document.getElementById('main-splitter');
  const editorPane = document.getElementById('editor-pane');
  const previewPane = document.getElementById('preview-pane');
  let mainDragging = false, startX = 0, startW = 0;

  mainSplitter.addEventListener('mousedown', (e) => {
    mainDragging = true;
    startX = e.clientX;
    startW = editorPane.getBoundingClientRect().width;
    mainSplitter.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (sidebarDragging) {
      const mainRect = main.getBoundingClientRect();
      const newW = Math.max(160, Math.min(450, e.clientX - mainRect.left));
      sidebarWidth = newW;
      sidebar.style.width = `${newW}px`;
      localStorage.setItem('md-sidebar-width', newW);
    }

    if (mainDragging) {
      const total = main.getBoundingClientRect().width;
      const sidebarW = sidebarOpen ? sidebar.getBoundingClientRect().width : 0;
      const availableWidth = total - (sidebarOpen ? sidebarW + 4 : 0) - 4; // subtract splitters

      const mainRect = main.getBoundingClientRect();
      const relativeX = e.clientX - mainRect.left - (sidebarOpen ? sidebarW + 4 : 0);

      const newW = Math.max(200, Math.min(availableWidth - 200, relativeX));
      editorPane.style.flex = `0 0 ${((newW / availableWidth) * 100).toFixed(2)}%`;
      previewPane.style.flex = '1';
    }
  });

  document.addEventListener('mouseup', () => {
    if (sidebarDragging || mainDragging) {
      sidebarDragging = false;
      mainDragging = false;
      sidebarSplitter.classList.remove('dragging');
      mainSplitter.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirm-dialog');
    const msg = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    msg.textContent = message;

    const cleanup = (result) => {
      dialog.close();
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('cancel', onCancel);
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', onCancel); // Escape key

    dialog.showModal();
    cancelBtn.focus();
  });
}

function setupSidebarKeyboard() {
  docList.addEventListener('keydown', (e) => {
    const items = [...docList.querySelectorAll('.doc-item')];
    if (items.length === 0) return;

    const active = docList.querySelector('.doc-item.active');
    const idx = items.indexOf(active);

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown'
        ? items[Math.min(idx + 1, items.length - 1)]
        : items[Math.max(idx - 1, 0)];
      if (next && next !== active) {
        const id = next.dataset.id;
        openDoc(id).then(renderSidebar);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) active.click();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (active) {
        const delBtn = active.querySelector('.doc-delete');
        if (delBtn) delBtn.click();
      }
    }
  });
}

function defaultContent() {
  return `# Welcome to MDPreview

A minimal, elegant writing environment. Your documents are stored locally in your browser using IndexedDB; no server required.

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
