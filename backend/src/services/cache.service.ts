// backend/src/services/cache.service.ts
class CacheService {
  private cache: Map<string, { data: any; expiry?: number }> = new Map();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check expiry
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  set<T>(key: string, data: T, expirySeconds?: number): void {
    let expiryMs: number | undefined;
    if (expirySeconds) {
      expiryMs = Date.now() + expirySeconds * 1000;
    }

    this.cache.set(key, { data, expiry: expiryMs });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

export default new CacheService();
