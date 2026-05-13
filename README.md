# MDPreview: Markdown Editor with Live Preview

A minimal, elegant markdown editor with live preview that runs entirely in your browser. Documents are stored locally via IndexedDB; no server or account required.

## Features

- **Live split-pane editing** — CodeMirror 6 editor with instant Markdown preview
- **Syntax highlighting** — Markdown in the editor, code blocks in the preview via highlight.js
- **Multi-document** — Create, switch, rename, and delete files from the sidebar
- **IndexedDB persistence** — All documents survive page refreshes
- **8 color themes** — Solarized Light/Dark, Folio, Ember, Monokai, Nord, One Dark, GitHub Light
- **Focus mode** — Hide everything except the editor for distraction-free writing
- **Draggable splitter** — Resize the editor and preview panes to your preference
- **Export options** — Download as `.md`, copy Markdown source, or copy/download rendered HTML
- **Formatting toolbar** — Bold, italic, headings, lists, blockquotes, links, and code blocks
- **Status bar** — Live word, character, and line counts with auto-save indicator

## Tech Stack

- [Vite](https://vitejs.dev/) — Build tool and dev server
- [CodeMirror 6](https://codemirror.net/) — Text editor with Markdown language support
- [marked](https://marked.js.org/) — Markdown parser
- [highlight.js](https://highlightjs.org/) — Code block syntax highlighting
- [DOMPurify](https://github.com/cure53/DOMPurify) — Preview HTML sanitization
- [Vitest](https://vitest.dev/) + [jsdom](https://github.com/jsdom/jsdom) — Unit testing

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Run the test suite
npm test
```

## Project Structure

```
├── index.html          # Application shell
├── src/
│   ├── main.js         # App state, document management, UI wiring
│   ├── editor.js       # CodeMirror 6 setup, themes, and formatting helpers
│   ├── preview.js      # Markdown rendering and highlight.js theme loading
│   ├── storage.js      # IndexedDB document store
│   └── style.css       # Theme variables and layout styles
├── test/
│   ├── setup.js        # jsdom mocks for CodeMirror
│   ├── editor.test.js
│   ├── preview.test.js
│   └── storage.test.js
└── vite.config.js      # Vite and Vitest configuration
```

## License

MIT © 2026 Jonathan Au
