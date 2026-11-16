// Mock Redis for local SQLite setup without needing actual Redis server
class MockRedis {
  private store: Record<string, string> = {};

  async get(key: string) {
    return this.store[key] || null;
  }

  async set(key: string, val: string, mode?: string, time?: number) {
    this.store[key] = val;
  }

  async del(key: string) {
    delete this.store[key];
  }

  async incr(key: string) {
    const current = Number(this.store[key] || 0);
    this.store[key] = String(current + 1);
    return current + 1;
  }

  async expire(key: string, time: number) {
    // Mock implementation
  }

  on(event: string, callback: any) {
    if (event === 'connect') {
      setTimeout(callback, 100);
    }
  }
}

const redis = new MockRedis();
console.log('Connected to Mock Redis (In-Memory)');

export default redis;
