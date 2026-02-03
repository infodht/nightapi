import logger from "../../logger/logger.js";

const DEFAULT_TTL = 3600; // 1 hour in seconds
const store = new Map(); // In-memory store

/**
 * Get cached data
 */
const get = async (key) => {
  try {
    const item = store.get(key);
    if (item) {
      // Check if expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        store.delete(key);
        logger.info(`Cache expired: ${key}`);
        return null;
      }
      logger.info(`Cache hit: ${key}`);
      return item.value;
    }
    logger.info(`Cache miss: ${key}`);
    return null;
  } catch (err) {
    logger.error(`Cache get error for ${key}: ${err.message}`);
    return null;
  }
};

/**
 * Set cache data with TTL
 */
const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const expiresAt = Date.now() + (ttl * 1000);
    store.set(key, { value, expiresAt });
    logger.info(`Cache set: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    logger.error(`Cache set error for ${key}: ${err.message}`);
    return false;
  }
};

/**
 * Delete specific cache key
 */
const del = async (key) => {
  try {
    store.delete(key);
    logger.info(`Cache deleted: ${key}`);
    return true;
  } catch (err) {
    logger.error(`Cache delete error for ${key}: ${err.message}`);
    return false;
  }
};

/**
 * Delete multiple keys by pattern
 */
const delPattern = async (pattern) => {
  try {
    let deleted = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of store.keys()) {
      if (regex.test(key)) {
        store.delete(key);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.info(`Cache deleted pattern: ${pattern} (${deleted} keys)`);
    }
    return true;
  } catch (err) {
    logger.error(`Cache delete pattern error for ${pattern}: ${err.message}`);
    return false;
  }
};

/**
 * Flush all cache
 */
const flush = async () => {
  try {
    store.clear();
    logger.info("Cache flushed");
    return true;
  } catch (err) {
    logger.error(`Cache flush error: ${err.message}`);
    return false;
  }
};

/**
 * Get cache size
 */
const size = () => store.size;

export { get, set, del, delPattern, flush, size };
