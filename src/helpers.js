export { escapeHtml } from './escape-html.js';

const themeCache = new Map();

export function isThemeDark(theme) {
  if (themeCache.has(theme)) return themeCache.get(theme);

  const prev = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', theme);
  const scheme = getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim();
  if (prev) document.documentElement.setAttribute('data-theme', prev);
  else document.documentElement.removeAttribute('data-theme');

  const dark = scheme === 'dark';
  themeCache.set(theme, dark);
  return dark;
}
