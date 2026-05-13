import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const BASE_URL = 'https://mdpreview.onrender.com';
const NOW = new Date().toISOString().slice(0, 10);

const PAGES = [
  {
    route: 'markdown-editor',
    title: 'Markdown Editor Online — Free Browser-Based MD Editor | MDPreview',
    description: 'Write and edit Markdown online with MDPreview, a free browser-based Markdown editor featuring live preview, syntax highlighting, local storage, and zero setup. No signup required.',
    keywords: 'markdown editor, online markdown editor, browser markdown editor, free markdown editor, markdown online, md editor, markdown writing tool',
    h1: 'Free Browser-Based Markdown Editor',
    intro: 'MDPreview is a privacy-first, browser-based Markdown editor that runs entirely on your device. There is no server, no account, and no data upload — your documents stay local. Write with live preview, syntax-highlighted code blocks, and more — all from a single tab.',
    bullets: [
      'Live split-pane preview updates as you type',
      'Markdown syntax highlighting via CodeMirror 6',
      'Code block syntax highlighting via highlight.js',
      'Local IndexedDB storage — survives page refreshes',
      'Auto-save with no button to press',
      'Focus mode for distraction-free writing',
      '8 color themes including Solarized, Monokai, and Nord',
      'Export to Markdown or HTML with one click',
      'Multiple documents with sidebar navigation',
      'Privacy-first: nothing leaves your browser',
    ],
    faq: [
      { q: 'Is MDPreview free to use?', a: 'Yes. MDPreview is completely free and open source. There are no paid tiers, no hidden features, and no subscription required.' },
      { q: 'Does MDPreview require an account or signup?', a: 'No. MDPreview runs entirely in your browser with zero setup. There is no login, no account creation, and no personal information requested.' },
      { q: 'Are my documents stored on a server?', a: 'No. All documents are stored locally in your browser using IndexedDB. Nothing is ever uploaded to a server. Your data never leaves your device.' },
      { q: 'Does MDPreview work offline?', a: 'Yes. Once loaded, MDPreview works offline because everything runs client-side. Documents are saved locally and remain accessible without an internet connection.' },
      { q: 'Can I export my Markdown as HTML?', a: 'Yes. MDPreview lets you copy rendered HTML to your clipboard or download it as a complete .html file with embedded syntax highlighting styles.' },
      { q: 'Does MDPreview support GitHub-Flavored Markdown?', a: 'Yes. MDPreview supports GFM including tables, task lists, code fences, strikethrough, and autolinks.' },
      { q: 'Is MDPreview open source?', a: 'Yes. MDPreview is MIT-licensed and the source code is available on GitHub at github.com/jonathanau/mdpreview.' },
    ],
    canonical: `${BASE_URL}/markdown-editor`,
  },
  {
    route: 'markdown-preview',
    title: 'Markdown Preview Online — Live MD to HTML Preview Tool | MDPreview',
    description: 'Preview Markdown rendered as HTML in real time with MDPreview. A free browser-based live Markdown preview tool with syntax highlighting, GFM support, and local document storage.',
    keywords: 'markdown preview, live markdown preview, markdown to html, md preview online, markdown renderer, browser markdown preview',
    h1: 'Live Markdown Preview Tool',
    intro: 'MDPreview converts Markdown to HTML instantly as you type in a clean split-pane interface. See exactly how your document will look when published — rendered headings, tables, code blocks, lists, and more. Everything runs locally in your browser for maximum privacy and speed.',
    bullets: [
      'Instant Markdown-to-HTML rendering as you type',
      'GitHub-Flavored Markdown including tables and task lists',
      'Syntax-highlighted code blocks with language detection',
      'Responsive split-pane layout with draggable divider',
      'Print-friendly preview output',
      'Copy rendered HTML or download as a standalone file',
      'Zero server round-trips — rendering is instant',
    ],
    faq: [
      { q: 'Does the preview update in real time?', a: 'Yes. The preview pane updates automatically as you type with a small debounce for performance. There is no save or refresh button needed.' },
      { q: 'What Markdown features are supported?', a: 'MDPreview supports GitHub-Flavored Markdown including headings, bold, italic, strikethrough, tables, task lists, code fences with syntax highlighting, blockquotes, links, images, and more.' },
      { q: 'Can I copy the rendered HTML?', a: 'Yes. Click the Copy HTML button in the preview pane header to copy the rendered output to your clipboard, or use Download HTML to save a complete standalone file.' },
      { q: 'Does the preview work offline?', a: 'Yes. All Markdown rendering happens client-side using the marked library. No network requests are made during preview generation.' },
      { q: 'Is my Markdown content sent to any server?', a: 'No. MDPreview processes everything locally. Your Markdown content is never transmitted over the network.' },
    ],
    canonical: `${BASE_URL}/markdown-preview`,
  },
];

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageHtml(page) {
  const appUrl = BASE_URL;
  const faqJson = page.faq.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <meta name="keywords" content="${escapeHtml(page.keywords)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${page.canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="MDPreview" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:url" content="${page.canonical}" />
  <meta property="og:image" content="${BASE_URL}/icon-192.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "MDPreview",
          "url": "${appUrl}",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Any",
          "description": "${escapeHtml(page.description)}",
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@type": "FAQPage",
          "mainEntity": ${JSON.stringify(faqJson, null, 6)}
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "${appUrl}" },
            { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(page.h1)}, "item": "${page.canonical}" }
          ]
        }
      ]
    }
  </script>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #fdf6e3; color: #657b83; line-height: 1.7; padding: 2rem 1rem;
    }
    .container { max-width: 800px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 3rem; }
    header h1 { font-size: 2.2rem; font-weight: 600; color: #073642; margin-bottom: .75rem; }
    header p { font-size: 1.15rem; color: #586e75; max-width: 640px; margin: 0 auto; }
    .logo { font-size: .9rem; color: #93a1a1; margin-bottom: 1rem; letter-spacing: .05em; }
    .logo span { color: #cb4b16; font-weight: 600; }
    .cta {
      display: inline-block; margin-top: 1.5rem;
      background: #268bd2; color: #fff; padding: .8rem 2rem; border-radius: 6px;
      text-decoration: none; font-weight: 500; font-size: 1.05rem;
      transition: background .2s;
    }
    .cta:hover { background: #1a6ea8; }
    section { margin-bottom: 2.5rem; }
    h2 { font-size: 1.4rem; color: #073642; margin-bottom: 1rem; border-bottom: 1px solid #eee8d5; padding-bottom: .5rem; }
    ul { list-style: none; padding: 0; }
    ul li { padding: .35rem 0 .35rem 1.4rem; position: relative; color: #586e75; }
    ul li::before { content: '\\2713'; position: absolute; left: 0; color: #859900; font-weight: 700; }
    .faq-item { margin-bottom: .75rem; }
    .faq-item summary { cursor: pointer; font-weight: 500; color: #073642; padding: .5rem 0; }
    .faq-item summary::-webkit-details-marker { color: #93a1a1; }
    .faq-item p { margin-top: .25rem; padding-left: 1.2rem; color: #586e75; }
    .footer-cta { text-align: center; margin: 3rem 0 2rem; padding: 2rem; background: #eee8d5; border-radius: 8px; }
    .footer-cta h2 { border: none; margin-bottom: .5rem; }
    .footer-cta p { color: #586e75; margin-bottom: 1rem; }
    footer { text-align: center; font-size: .85rem; color: #93a1a1; padding: 2rem 0; }
    footer a { color: #268bd2; text-decoration: none; }
    footer a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      header h1 { font-size: 1.6rem; }
      body { padding: 1rem .75rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo"><a href="${appUrl}" style="color:inherit;text-decoration:none;">MD<span>P</span>review</a></div>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      <a class="cta" href="${appUrl}">Open MDPreview</a>
    </header>

    <section aria-labelledby="features-heading">
      <h2 id="features-heading">Features</h2>
      <ul>
        ${page.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('\n        ')}
      </ul>
    </section>

    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently Asked Questions</h2>
      ${page.faq.map(f => `
      <details class="faq-item">
        <summary>${escapeHtml(f.q)}</summary>
        <p>${escapeHtml(f.a)}</p>
      </details>`).join('')}
    </section>

    <div class="footer-cta">
      <h2>Try MDPreview Free</h2>
      <p>No signup required. No data upload. Works offline.</p>
      <a class="cta" href="${appUrl}">Open MDPreview</a>
    </div>

    <footer>
      <p><a href="${appUrl}">MDPreview</a> &mdash; free browser-based Markdown editor. <a href="https://github.com/jonathanau/mdpreview">Open source</a> under MIT license.</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateSitemap() {
  const urls = ['', ...PAGES.map(p => p.route)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}/${u}</loc>
    <lastmod>${NOW}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u === '' ? '1.0' : '0.9'}</priority>
  </url>`).join('\n')}
</urlset>`;
  return xml;
}

function generateRobots() {
  return `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

export function seoPlugin() {
  return {
    name: 'seo-pages',
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist');

      for (const page of PAGES) {
        const dir = resolve(distDir, page.route);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'index.html'), pageHtml(page));
      }

      writeFileSync(resolve(distDir, 'sitemap.xml'), generateSitemap());
      writeFileSync(resolve(distDir, 'robots.txt'), generateRobots());

      // Ensure llms.txt is copied from public (Vite handles this, but be safe)
      const srcLlms = resolve(process.cwd(), 'public', 'llms.txt');
      if (existsSync(srcLlms)) {
        writeFileSync(resolve(distDir, 'llms.txt'), readFileSync(srcLlms, 'utf-8'));
      }
    },
  };
}
