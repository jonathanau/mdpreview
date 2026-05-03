import { describe, it, expect } from 'vitest';
import { extractTitle, relativeTime } from '../src/storage.js';

// ─── extractTitle ─────────────────────────────────────────────────────────

describe('extractTitle', () => {
  it('extracts title from H1 line', () => {
    expect(extractTitle('# My Title')).toBe('My Title');
  });

  it('extracts title from H2 line', () => {
    expect(extractTitle('## Subtitle')).toBe('Subtitle');
  });

  it('extracts title from H3 line', () => {
    expect(extractTitle('### Section')).toBe('Section');
  });

  it('returns first non-heading line as title if no heading', () => {
    expect(extractTitle('Just a line')).toBe('Just a line');
  });

  it('returns "Untitled" for empty content', () => {
    expect(extractTitle('')).toBe('Untitled');
  });

  it('returns "Untitled" for whitespace-only content', () => {
    expect(extractTitle('   ')).toBe('Untitled');
  });

  it('uses only the first line', () => {
    expect(extractTitle('# First\n## Second')).toBe('First');
  });

  it('trims whitespace from title', () => {
    expect(extractTitle('#   Spaced Title  ')).toBe('Spaced Title');
  });
});

// ─── relativeTime ─────────────────────────────────────────────────────────

describe('relativeTime', () => {
  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const ts = Date.now() - 30000; // 30 seconds ago
    expect(relativeTime(ts)).toBe('just now');
  });

  it('returns "just now" for current timestamp', () => {
    expect(relativeTime(Date.now())).toBe('just now');
  });

  it('returns minutes for timestamps less than 1 hour ago', () => {
    const ts = Date.now() - 5 * 60000; // 5 minutes ago
    expect(relativeTime(ts)).toBe('5m ago');
  });

  it('returns hours for timestamps less than 24 hours ago', () => {
    const ts = Date.now() - 3 * 3600000; // 3 hours ago
    expect(relativeTime(ts)).toBe('3h ago');
  });

  it('returns days for timestamps more than 24 hours ago', () => {
    const ts = Date.now() - 2 * 86400000; // 2 days ago
    expect(relativeTime(ts)).toBe('2d ago');
  });

  it('returns "1m ago" for exactly 1 minute ago', () => {
    const ts = Date.now() - 60000;
    expect(relativeTime(ts)).toBe('1m ago');
  });

  it('returns "1h ago" for exactly 60 minutes ago', () => {
    const ts = Date.now() - 3600000;
    expect(relativeTime(ts)).toBe('1h ago');
  });

  it('returns "1d ago" for exactly 24 hours ago', () => {
    const ts = Date.now() - 86400000;
    expect(relativeTime(ts)).toBe('1d ago');
  });
});
