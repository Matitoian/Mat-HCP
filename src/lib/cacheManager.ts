/**
 * Cache Manager - localStorage-based caching with expiration
 * Improves app performance by caching API responses
 */

export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  key: string;
}

class CacheManager {
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    try {
      const item = {
        value,
        expires: Date.now() + ttl,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      if (Date.now() > parsed.expires) {
        localStorage.removeItem(`cache_${key}`);
        return defaultValue;
      }

      return parsed.value as T;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return defaultValue;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    const item = this.get(key);
    return item !== undefined;
  }

  /**
   * Remove a specific item from cache
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get or set - executes fn if cache miss
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
}

export const cache = new CacheManager();

// Cache keys for properties
export const CACHE_KEYS = {
  PROPERTIES: 'properties',
  PROPERTY_DETAIL: (id: string) => `property_${id}`,
  SAVED_PROPERTIES: 'saved_properties',
  USER_PROFILE: 'user_profile',
  CHATS: 'chats',
  PAYMENTS: 'payments',
  RATINGS: (id: string) => `ratings_${id}`,
  ADMIN_STATS: 'admin_stats',
  ADMIN_USERS: 'admin_users',
  ADMIN_PROPERTIES: 'admin_properties',
};

/**
 * Invalidate related caches (useful after mutations)
 */
export function invalidateCache(...keys: string[]): void {
  keys.forEach(key => cache.remove(key));
}

/**
 * Clear related property caches
 */
export function invalidatePropertyCaches(propertyId?: string): void {
  invalidateCache(
    CACHE_KEYS.PROPERTIES,
    propertyId ? CACHE_KEYS.PROPERTY_DETAIL(propertyId) : ''
  );
}
