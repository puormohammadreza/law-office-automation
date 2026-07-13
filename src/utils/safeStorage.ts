// Safe wrapper around localStorage
const memoryStorage = new Map<string, string>();

function getStorage() {
  try {
    if (typeof window !== "undefined") {
      let ls;
      try { ls = window.localStorage; } catch(e) {}
      return ls;
    }
  } catch(e) {}
  return null;
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const ls = getStorage();
      if (ls) return ls.getItem(key);
    } catch (e) {}
    return memoryStorage.has(key) ? memoryStorage.get(key)! : null;
  },
  setItem: (key: string, value: string): void => {
    try {
      const ls = getStorage();
      if (ls) {
        ls.setItem(key, value);
        return;
      }
    } catch (e) {}
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      const ls = getStorage();
      if (ls) {
        ls.removeItem(key);
        return;
      }
    } catch (e) {}
    memoryStorage.delete(key);
  },
  clear: (): void => {
    try {
      const ls = getStorage();
      if (ls) {
        ls.clear();
        return;
      }
    } catch (e) {}
    memoryStorage.clear();
  }
};
