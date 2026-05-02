import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

import githubCssUrl from 'highlight.js/styles/github.css?url';
import githubDarkCssUrl from 'highlight.js/styles/github-dark.css?url';

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

marked.setOptions({ gfm: true, breaks: true });

// ─── Highlight.js theme injection ─────────────────────────────────────────

let hljsLink = null;

export function setHljsTheme(isDark) {
  if (!hljsLink) {
    hljsLink = document.createElement('link');
    hljsLink.rel = 'stylesheet';
    document.head.appendChild(hljsLink);
  }
  hljsLink.href = isDark ? githubDarkCssUrl : githubCssUrl;
}

// ─── Render ────────────────────────────────────────────────────────────────

export function renderMarkdown(content) {
  if (!content.trim()) return '';
  const raw = marked.parse(content);
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
}
