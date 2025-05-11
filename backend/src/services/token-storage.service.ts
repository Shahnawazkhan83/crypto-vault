// backend/src/services/token-storage.service.ts
class TokenStorageService {
  private tokenStore: Map<string, { value: string; expiry?: number }> =
    new Map();

  async get(key: string): Promise<string | null> {
    const item = this.tokenStore.get(key);
    if (!item) return null;

    // Check expiry
    if (item.expiry && item.expiry < Date.now()) {
      this.tokenStore.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    let expiryMs: number | undefined;
    if (expirySeconds) {
      expiryMs = Date.now() + expirySeconds * 1000;
    }

    this.tokenStore.set(key, { value, expiry: expiryMs });
  }

  async del(key: string): Promise<boolean> {
    return this.tokenStore.delete(key);
  }
}

export default new TokenStorageService();
