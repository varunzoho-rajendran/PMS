import { Injectable } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

/**
 * Cache Service for managing in-memory and localStorage caching
 * Provides TTL (Time To Live) based caching for application data
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_PREFIX = 'pms_cache_';

  /**
   * Set data in cache with expiration time
   * @param key Cache key
   * @param data Data to cache
   * @param expiresIn Time to live in milliseconds (default 5 minutes)
   * @param persistToStorage Whether to persist to localStorage
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000, persistToStorage: boolean = false): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Optionally persist to localStorage
    if (persistToStorage) {
      try {
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    let entry = this.memoryCache.get(key);

    // If not in memory, try localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(this.CACHE_PREFIX + key);
        if (stored) {
          entry = JSON.parse(stored) as CacheEntry<T>;
          // Restore to memory cache
          this.memoryCache.set(key, entry);
        }
      } catch (error) {
        console.warn('Failed to read cache from localStorage:', error);
      }
    }

    // Check if entry exists and is not expired
    if (entry) {
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
      if (!isExpired) {
        return entry.data as T;
      } else {
        // Remove expired entry
        this.remove(key);
      }
    }

    return null;
  }

  /**
   * Check if cache has valid (non-expired) entry
   * @param key Cache key
   * @returns true if valid entry exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove entry from cache
   * @param key Cache key
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove cache from localStorage:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear();
    
    // Clear all localStorage cache entries
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  /**
   * Get or set cache (fetch if not cached)
   * @param key Cache key
   * @param fetchFn Function to fetch data if not cached
   * @param expiresIn Time to live in milliseconds
   * @param persistToStorage Whether to persist to localStorage
   * @returns Cached or freshly fetched data
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    expiresIn: number = 5 * 60 * 1000,
    persistToStorage: boolean = false
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Store in cache
    this.set(key, data, expiresIn, persistToStorage);
    
    return data;
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern Regex pattern to match keys
   */
  invalidatePattern(pattern: RegExp): void {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const actualKey = key.substring(this.CACHE_PREFIX.length);
          if (pattern.test(actualKey)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate cache pattern from localStorage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { memoryEntries: number; storageEntries: number; totalSize: number } {
    const memoryEntries = this.memoryCache.size;
    let storageEntries = 0;
    let totalSize = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          storageEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return {
      memoryEntries,
      storageEntries,
      totalSize
    };
  }
}
