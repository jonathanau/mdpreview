import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../src/preview.js';

describe('renderMarkdown', () => {
  it('returns empty string for whitespace-only input', () => {
    expect(renderMarkdown('   ')).toBe('');
    expect(renderMarkdown('\n\n')).toBe('');
  });

  it('renders a heading', () => {
    const html = renderMarkdown('# Hello');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
  });

  it('renders bold text', () => {
    const html = renderMarkdown('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    const html = renderMarkdown('*italic*');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders strikethrough text', () => {
    const html = renderMarkdown('~~strike~~');
    expect(html).toContain('<del>strike</del>');
  });

  it('renders inline code', () => {
    const html = renderMarkdown('`code`');
    expect(html).toContain('<code');
    expect(html).toContain('code');
  });

  it('renders a link', () => {
    const html = renderMarkdown('[text](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('text');
  });

  it('renders an unordered list', () => {
    const html = renderMarkdown('- item1\n- item2');
    expect(html).toContain('<ul');
    expect(html).toContain('<li>item1</li>');
    expect(html).toContain('<li>item2</li>');
  });

  it('renders an ordered list', () => {
    const html = renderMarkdown('1. first\n2. second');
    expect(html).toContain('<ol');
    expect(html).toContain('<li>first</li>');
    expect(html).toContain('<li>second</li>');
  });

  it('renders a blockquote', () => {
    const html = renderMarkdown('> quote text');
    expect(html).toContain('<blockquote');
    expect(html).toContain('quote text');
  });

  it('renders a code block with syntax highlighting', () => {
    const html = renderMarkdown('```javascript\nconst x = 1;\n```');
    expect(html).toContain('hljs');
    expect(html).toContain('const');
  });

  it('renders a horizontal rule', () => {
    const html = renderMarkdown('---');
    expect(html).toContain('<hr');
  });

  it('sanitizes dangerous HTML', () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });

  it('allows iframe tags (configured in DOMPurify)', () => {
    const html = renderMarkdown('<iframe src="https://example.com"></iframe>');
    expect(html).toContain('<iframe');
  });

  it('renders GFM table', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = renderMarkdown(md);
    expect(html).toContain('<table');
    expect(html).toContain('A');
    expect(html).toContain('1');
  });

  it('renders H2 and H3', () => {
    expect(renderMarkdown('## Sub').toLowerCase()).toContain('<h2');
    expect(renderMarkdown('### Sub').toLowerCase()).toContain('<h3');
  });

  it('renders line breaks (GFM breaks option)', () => {
    const html = renderMarkdown('line1\nline2');
    expect(html).toContain('<br');
  });
});
