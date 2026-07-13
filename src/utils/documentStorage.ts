class DocumentDb {
  private dbName = "LawyerDocumentsDB";
  private storeName = "documentContents";
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, string>();
  private useFallback = false;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      let request;
      try {
        let idb = null;
        try {
          if (typeof window !== "undefined") idb = window.indexedDB;
        } catch(e) {}

        if (idb) {
          request = idb.open(this.dbName, 1);
        } else {
          this.useFallback = true;
          return reject(new Error("indexedDB is not available"));
        }
      } catch (err) {
        this.useFallback = true;
        return reject(err);
      }
      request.onupgradeneeded = (e) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => {
        this.useFallback = true;
        reject(request.error);
      };
    });
  }

  async get(id: string): Promise<string | null> {
    // Try memory cache first
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id) || null;
    }
    // Try localStorage fallback
    try {
      const localVal = localStorage.getItem("doc_fb_" + id);
      if (localVal) {
        this.memoryCache.set(id, localVal);
        return localVal;
      }
    } catch (e) {}

    if (this.useFallback) return null;

    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          const val = req.result || null;
          if (val) {
            this.memoryCache.set(id, val);
          }
          resolve(val);
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error("IndexedDB error reading:", e);
      this.useFallback = true;
      return null;
    }
  }

  async set(id: string, dataUrl: string): Promise<void> {
    // Always store in memory cache
    this.memoryCache.set(id, dataUrl);

    // Try storing in localStorage as a backup if small (< 2MB)
    if (dataUrl.length < 2 * 1024 * 1024) {
      try {
        localStorage.setItem("doc_fb_" + id, dataUrl);
      } catch (e) {
        console.warn("LocalStorage fallback write failed (probably quota):", e);
      }
    }

    if (this.useFallback) return;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.put(dataUrl, id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error("IndexedDB error writing:", e);
      this.useFallback = true;
    }
  }

  async delete(id: string): Promise<void> {
    this.memoryCache.delete(id);
    try {
      localStorage.removeItem("doc_fb_" + id);
    } catch (e) {}

    if (this.useFallback) return;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error("IndexedDB error deleting:", e);
      this.useFallback = true;
    }
  }
}

export const documentDb = new DocumentDb();
