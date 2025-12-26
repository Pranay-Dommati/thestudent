// IndexedDBService.js
// Lightweight key-value wrapper over IndexedDB with graceful fallbacks

const DB_NAME = 'thestudent_db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

class IndexedDBService {
  constructor() {
    this._dbPromise = null;
    this._isSupported = typeof indexedDB !== 'undefined';
  }

  _openDB() {
    if (!this._isSupported) return Promise.reject(new Error('IndexedDB not supported'));
    if (this._dbPromise) return this._dbPromise;

    this._dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
        request.onblocked = () => {
          // If blocked, we still wait for onsuccess or onerror
          // No-op
        };
      } catch (err) {
        reject(err);
      }
    });

    return this._dbPromise;
  }

  async setItem(key, value) {
    try {
      const db = await this._openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return true;
    } catch (err) {
      // Silent fallback
      return false;
    }
  }

  async getItem(key) {
    try {
      const db = await this._openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return null;
    }
  }

  async removeItem(key) {
    try {
      const db = await this._openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async keys() {
    try {
      const db = await this._openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const keys = [];
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            keys.push(cursor.key);
            cursor.continue();
          } else {
            resolve(keys);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return [];
    }
  }

  // Copy selected localStorage keys/prefixes into IndexedDB if missing
  async migrateLocalStorage({ exactKeys = [], prefixes = [] } = {}) {
    if (!this._isSupported || typeof localStorage === 'undefined') return { migrated: 0 };

    let migrated = 0;
    const toMigrate = new Set();

    // Add exact keys if present
    exactKeys.forEach((k) => {
      if (localStorage.getItem(k) !== null) toMigrate.add(k);
    });

    // Add by prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (prefixes.some((p) => key.startsWith(p))) {
        toMigrate.add(key);
      }
    }

    for (const key of toMigrate) {
      const exists = await this.getItem(key);
      if (exists === null) {
        try {
          const raw = localStorage.getItem(key);
          let value = null;
          try {
            value = JSON.parse(raw);
          } catch {
            value = raw; // Non-JSON
          }
          await this.setItem(key, value);
          migrated++;
        } catch {
          // ignore
        }
      }
    }

    return { migrated };
  }
}

const indexedDBService = new IndexedDBService();
export default indexedDBService;
