import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

import githubCssUrl from 'highlight.js/styles/github.css?url';
import githubDarkCssUrl from 'highlight.js/styles/github-dark.css?url';
import solarizedLightCssUrl from 'highlight.js/styles/base16/solarized-light.css?url';
import solarizedDarkCssUrl from 'highlight.js/styles/base16/solarized-dark.css?url';
import monokaiCssUrl from 'highlight.js/styles/monokai.css?url';
import nordCssUrl from 'highlight.js/styles/nord.css?url';
import draculaCssUrl from 'highlight.js/styles/base16/dracula.css?url';

// ─── Configure marked ──────────────────────────────────────────────────────

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.use({ gfm: true, breaks: true });

// ─── Highlight.js theme injection ─────────────────────────────────────────

let hljsLink = null;

const hljsThemes = {
  'folio': githubCssUrl,
  'ember': githubDarkCssUrl,
  'solarized-light': solarizedLightCssUrl,
  'solarized-dark': solarizedDarkCssUrl,
  'monokai': monokaiCssUrl,
  'nord': nordCssUrl,
  'one-dark': draculaCssUrl,
  'github-light': githubCssUrl
};

export function setHljsTheme(themeName) {
  if (!hljsLink) {
    hljsLink = document.createElement('link');
    hljsLink.rel = 'stylesheet';
    hljsLink.dataset.hljs = '';
    document.head.appendChild(hljsLink);
  }
  hljsLink.href = hljsThemes[themeName] || githubCssUrl;
}

// ─── Render ────────────────────────────────────────────────────────────────

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe') {
    node.setAttribute('sandbox', '');
  }
});

export function renderMarkdown(content) {
  if (!content.trim()) return '';
  const raw = marked.parse(content);
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['frameborder', 'sandbox', 'scrolling'],
  });
}
