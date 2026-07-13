// Safe Polyfill/Override to prevent DOMExceptions / "Script error" when localStorage/sessionStorage are blocked in strict sandboxed iframes.

function polyfillStorage(type: 'localStorage' | 'sessionStorage') {
  try {
    let test: any;
    try { test = window[type]; } catch(e) {}
    
    if (test) {
      // Test if we can read and write to verify it works
      const testKey = `__test_storage_support_${type}`;
      test.setItem(testKey, "1");
      test.removeItem(testKey);
    } else {
      throw new Error(`Storage ${type} is not accessible`);
    }
  } catch (e) {
    console.warn(`[Storage Polyfill] ${type} is blocked or throws an exception. Injecting memory fallback...`);

    const memoryStorage: Record<string, string> = {};
    const mockStorage = {
      getItem(key: string) {
        return key in memoryStorage ? memoryStorage[key] : null;
      },
      setItem(key: string, value: string) {
        memoryStorage[key] = String(value);
      },
      removeItem(key: string) {
        delete memoryStorage[key];
      },
      clear() {
        for (const key of Object.keys(memoryStorage)) {
          delete memoryStorage[key];
        }
      },
      key(index: number) {
        return Object.keys(memoryStorage)[index] || null;
      },
      get length() {
        return Object.keys(memoryStorage).length;
      }
    };

    try {
      Object.defineProperty(window, type, {
        value: mockStorage,
        writable: true,
        configurable: true
      });
    } catch (err) {
      // If defineProperty fails, override the property on window explicitly if possible
      try {
        (window as any)[type] = mockStorage;
      } catch (innerErr) {
        console.error(`[Storage Polyfill] Critical error: could not override window.${type}`);
      }
    }
  }
}

// Polyfill both storage types immediately when this file is imported
polyfillStorage('localStorage');
polyfillStorage('sessionStorage');
