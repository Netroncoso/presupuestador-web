import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

class CacheService {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 300,
      checkperiod: 60,
      useClones: false
    });
    
    this.cache.on('expired', (key) => {
      logger.info(`Cache expired: ${key}`);
    });
  }
  
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }
  
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 300);
  }
  
  del(key: string): number {
    return this.cache.del(key);
  }
  
  flush(): void {
    this.cache.flushAll();
  }
  
  invalidateReportes(): void {
    const keys = this.cache.keys().filter(k => k.startsWith('reportes:'));
    if (keys.length > 0) {
      this.cache.del(keys);
      logger.info(`Invalidated ${keys.length} report cache entries`);
    }
  }
  
  invalidateCatalogos(): void {
    const keys = this.cache.keys().filter(k => k.startsWith('catalogos:'));
    if (keys.length > 0) {
      this.cache.del(keys);
      logger.info(`Invalidated ${keys.length} catalog cache entries`);
    }
  }
  
  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService();
