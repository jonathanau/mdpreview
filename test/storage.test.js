import { describe, it, expect, beforeEach } from 'vitest';
import { Storage, extractTitle, relativeTime } from '../src/storage.js';

// ─── Storage class ─────────────────────────────────────────────────────────

describe('Storage', () => {
  let storage;

  beforeEach(async () => {
    if (storage?.db) storage.db.close();
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('md-editor');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    storage = new Storage();
    await storage.init();
  });

  it('init() creates a storage instance with a db connection', () => {
    expect(storage.db).toBeTruthy();
  });

  it('create() returns a doc with id, content, and updatedAt (no title)', async () => {
    const doc = await storage.create();
    expect(doc.id).toMatch(/^doc-/);
    expect(doc.content).toBe('');
    expect(doc.updatedAt).toEqual(expect.any(Number));
    expect(doc).not.toHaveProperty('title');
  });

  it('save() persists a document that can be retrieved with get()', async () => {
    const doc = await storage.create();
    doc.content = '# Hello';
    await storage.save(doc);
    const retrieved = await storage.get(doc.id);
    expect(retrieved.content).toBe('# Hello');
    expect(retrieved.id).toBe(doc.id);
  });

  it('save() updates updatedAt timestamp', async () => {
    const doc = await storage.create();
    const original = doc.updatedAt;
    doc.content = 'updated';
    await storage.save(doc);
    expect(doc.updatedAt).toBeGreaterThanOrEqual(original);
  });

  it('get() returns null for nonexistent id', async () => {
    const result = await storage.get('doc-nonexistent');
    expect(result).toBeNull();
  });

  it('list() returns empty array when no documents exist', async () => {
    const docs = await storage.list();
    expect(docs).toEqual([]);
  });

  it('list() returns all documents ordered by updatedAt descending', async () => {
    const doc1 = await storage.create();
    doc1.content = 'older';
    await storage.save(doc1);
    const doc2 = await storage.create();
    doc2.content = 'newer';
    await storage.save(doc2);

    const docs = await storage.list();
    expect(docs).toHaveLength(2);
    expect(docs[0].updatedAt).toBeGreaterThanOrEqual(docs[1].updatedAt);
  });

  it('delete() removes a document', async () => {
    const doc = await storage.create();
    await storage.delete(doc.id);
    expect(await storage.get(doc.id)).toBeNull();
  });

  it('delete() on nonexistent id does not throw', async () => {
    await expect(storage.delete('doc-nonexistent')).resolves.toBeUndefined();
  });

  it('full round-trip: create, save (update content), get, delete', async () => {
    const doc = await storage.create();
    expect(doc.content).toBe('');
    doc.content = '# Final';
    await storage.save(doc);
    const retrieved = await storage.get(doc.id);
    expect(retrieved.content).toBe('# Final');
    await storage.delete(doc.id);
    expect(await storage.get(doc.id)).toBeNull();
  });
});

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
