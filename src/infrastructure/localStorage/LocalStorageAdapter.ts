/**
 * Local Storage Adapter
 * Provides localStorage-based storage implementation for development and testing
 * Used when mock data is enabled or for offline functionality
 */

export class LocalStorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  /**
   * Get an item from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorageAdapter get error:', error);
      return null;
    }
  }

  /**
   * Set an item in localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorageAdapter set error:', error);
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('LocalStorageAdapter remove error:', error);
    }
  }

  /**
   * Clear all items with the prefix
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('LocalStorageAdapter clear error:', error);
    }
  }

  /**
   * Check if an item exists
   */
  exists(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  /**
   * Get all keys with the prefix
   */
  getKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }

  /**
   * Get storage size (approximate)
   */
  getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}

/**
 * Default localStorage adapter instance
 */
export const defaultLocalStorageAdapter = new LocalStorageAdapter();
