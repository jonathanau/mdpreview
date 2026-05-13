# MDPreview — Free Browser-Based Markdown Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**MDPreview** is a free, privacy-first browser-based Markdown editor with live preview. Write with syntax-highlighted code blocks and local document storage — all without a server, account, or signup. No data ever leaves your device.

## Features

- **Live split-pane editing** — CodeMirror 6 editor with instant Markdown preview
- **Syntax highlighting** — Markdown in the editor, code blocks in the preview via highlight.js
- **Multi-document** — Create, switch, rename, and delete files from the sidebar
- **IndexedDB persistence** — All documents survive page refreshes (no server storage)
- **8 color themes** — Solarized Light/Dark, Folio, Ember, Monokai, Nord, One Dark, GitHub Light
- **Focus mode** — Hide everything except the editor for distraction-free writing
- **Draggable splitter** — Resize the editor and preview panes to your preference
- **Export options** — Download as `.md`, copy Markdown source, or copy/download rendered HTML
- **Formatting toolbar** — Bold, italic, headings, lists, blockquotes, links, and code blocks
- **Status bar** — Live word, character, and line counts with auto-save indicator
- **Privacy-first** — Runs entirely client-side; nothing is uploaded
- **Offline-capable** — Works without internet after initial load
- **GitHub-Flavored Markdown** — Tables, task lists, code fences, strikethrough, autolinks

## Why MDPreview?

- **No account required** — Open and start writing immediately
- **No data upload** — Everything stays in your browser
- **Works offline** — No internet dependency after page load
- **Open source** — MIT license, inspectable and auditable
- **No backend** — Static site, zero servers, zero databases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | [Vite](https://vitejs.dev/) |
| Text editor | [CodeMirror 6](https://codemirror.net/) |
| Markdown parser | [marked](https://marked.js.org/) |
| Code highlighting | [highlight.js](https://highlightjs.org/) |
| HTML sanitization | [DOMPurify](https://github.com/cure53/DOMPurify) |
| Testing | [Vitest](https://vitest.dev/) + [jsdom](https://github.com/jsdom/jsdom) |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run the test suite
npm test
```

## Frequently Asked Questions

### Does MDPreview work offline?
Yes. Once the page is loaded, MDPreview runs entirely client-side and continues working without an internet connection.

### Does MDPreview upload my files?
No. All documents are stored locally in your browser using IndexedDB. Nothing is ever sent to a server.

### Is MDPreview open source?
Yes. MDPreview is MIT-licensed. The source code is available on [GitHub](https://github.com/jonathanau/mdpreview).

### Can I export HTML?
Yes. You can copy rendered HTML to your clipboard or download a complete standalone `.html` file with embedded syntax highlighting.

### Does MDPreview support GitHub-Flavored Markdown?
Yes. MDPreview supports GFM including tables, task lists, code fences with syntax highlighting, strikethrough, and autolinks.

### How do I save my documents?
Saving is automatic. MDPreview auto-saves to IndexedDB as you type — no save button needed.

## License

MIT © 2026 Jonathan Au
