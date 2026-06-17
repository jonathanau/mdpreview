import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { escapeHtml, isThemeDark } from '../src/helpers.js';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('&')).toBe('&amp;');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<')).toBe('&lt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('>')).toBe('&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"')).toBe('&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('escapes all five characters in a single string', () => {
    expect(escapeHtml('<script>alert("xss&\'")</script>')).toBe('&lt;script&gt;alert(&quot;xss&amp;&#39;&quot;)&lt;/script&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns the same string if nothing to escape', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('isThemeDark', () => {
  let styleEl;

  beforeAll(() => {
    styleEl = document.createElement('style');
    styleEl.textContent = `
      [data-theme="solarized-light"] { color-scheme: light; }
      [data-theme="solarized-dark"] { color-scheme: dark; }
      [data-theme="folio"] { color-scheme: light; }
      [data-theme="ember"] { color-scheme: dark; }
      [data-theme="monokai"] { color-scheme: dark; }
      [data-theme="nord"] { color-scheme: dark; }
      [data-theme="one-dark"] { color-scheme: dark; }
      [data-theme="github-light"] { color-scheme: light; }
    `;
    document.head.appendChild(styleEl);
  });

  afterAll(() => {
    styleEl?.remove();
  });

  it('returns true for solarized-dark', () => {
    expect(isThemeDark('solarized-dark')).toBe(true);
  });

  it('returns false for solarized-light', () => {
    expect(isThemeDark('solarized-light')).toBe(false);
  });

  it('returns false for folio', () => {
    expect(isThemeDark('folio')).toBe(false);
  });

  it('returns true for ember', () => {
    expect(isThemeDark('ember')).toBe(true);
  });

  it('returns true for monokai', () => {
    expect(isThemeDark('monokai')).toBe(true);
  });

  it('returns true for nord', () => {
    expect(isThemeDark('nord')).toBe(true);
  });

  it('returns true for one-dark', () => {
    expect(isThemeDark('one-dark')).toBe(true);
  });

  it('returns false for github-light', () => {
    expect(isThemeDark('github-light')).toBe(false);
  });

  it('caches results (second call returns same value)', () => {
    expect(isThemeDark('solarized-dark')).toBe(true);
    expect(isThemeDark('solarized-dark')).toBe(true);
  });

  it('does not modify data-theme after returning', () => {
    document.documentElement.setAttribute('data-theme', 'solarized-light');
    isThemeDark('monokai');
    expect(document.documentElement.getAttribute('data-theme')).toBe('solarized-light');
  });
});
