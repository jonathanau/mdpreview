const DB_NAME = 'md-editor';
const DB_VERSION = 1;
const STORE = 'documents';

function validateDoc(doc) {
  if (!doc || typeof doc !== 'object') return null;
  if (typeof doc.id !== 'string' || !doc.id.startsWith('doc-')) return null;
  if (typeof doc.content !== 'string') doc.content = '';
  if (typeof doc.updatedAt !== 'number' || !isFinite(doc.updatedAt)) doc.updatedAt = Date.now();
  return doc;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    }
  });
}

export class Storage {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await openDB();
  }

  async list() {
    return new Promise((resolve, reject) => {
      const t = this.db.transaction(STORE, 'readonly');
      const store = t.objectStore(STORE);
      const index = store.index('updatedAt');
      const req = index.getAll();
      req.onsuccess = () => resolve(req.result.map(validateDoc).filter(Boolean).reverse());
      req.onerror = () => reject(req.error);
    });
  }

  async get(id) {
    const doc = await tx(this.db, 'readonly', (store) => store.get(id));
    return validateDoc(doc);
  }

  async save(doc) {
    doc.updatedAt = Date.now();
    return tx(this.db, 'readwrite', (store) => store.put(doc));
  }

  async create(title = 'Untitled') {
    const doc = {
      id: `doc-${crypto.randomUUID()}`,
      title,
      content: '',
      updatedAt: Date.now(),
    };
    await tx(this.db, 'readwrite', (store) => store.add(doc));
    return doc;
  }

  async delete(id) {
    return tx(this.db, 'readwrite', (store) => store.delete(id));
  }
}

export function extractTitle(content) {
  const firstLine = content.trim().split('\n')[0] || '';
  return firstLine.replace(/^#+\s*/, '').trim() || 'Untitled';
}

export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
