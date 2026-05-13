# Contributing to MDPreview

Thanks for your interest in contributing!

## Project Structure

```
├── index.html              # Application shell (SEO metadata, JSON-LD, semantic HTML)
├── scripts/
│   └── seo-pages.js        # Build-time landing page generator + sitemap plugin
├── public/
│   ├── llms.txt            # LLM/AI crawler optimization
│   ├── robots.txt          # Crawler directives
│   ├── sitemap.xml         # XML sitemap (auto-generated in production build)
│   ├── theme-init.js       # Synchronous theme initialization
│   └── fonts/              # Self-hosted web fonts
├── src/
│   ├── main.js             # App state, document management, UI wiring
│   ├── editor.js           # CodeMirror 6 setup, themes, and formatting helpers
│   ├── preview.js          # Markdown rendering and highlight.js theme loading
│   ├── storage.js          # IndexedDB document store
│   └── style.css           # Theme variables and layout styles
├── test/
│   ├── setup.js            # jsdom mocks for CodeMirror
│   ├── editor.test.js
│   ├── preview.test.js
│   └── storage.test.js
└── vite.config.js          # Vite configuration with SEO plugin
```

## Getting Started

```bash
npm install
npm run dev
npm test
npm run build
```

## Guidelines

- Keep the app deployable as a static site — no backend dependencies
- Preserve offline-first and privacy-first characteristics
- Run `npm test` before submitting changes
- Document new features in README.md and llms.txt where relevant
