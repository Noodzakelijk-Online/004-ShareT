/**
 * LRU Cache Utility
 * Powered by: https://github.com/isaacs/node-lru-cache (5k+ ⭐)
 * 
 * Provides in-memory caching for API responses to reduce database queries
 * and improve response times.
 */

const { LRUCache } = require('lru-cache');

// Main cache for API responses (Trello data, user data, etc.)
const apiCache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  updateAgeOnGet: true, // Reset TTL on access
  updateAgeOnHas: false,
  allowStale: false,
});

// Cache for shared link metadata (longer TTL since it changes less)
const sharedLinkCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 minutes TTL
  updateAgeOnGet: true,
});

// Cache for Trello API responses (to reduce API calls)
const trelloCache = new LRUCache({
  max: 200,
  ttl: 1000 * 60 * 2, // 2 minutes TTL (Trello data changes frequently)
  updateAgeOnGet: true,
});

// Cache for user sessions (reduces DB lookups)
const sessionCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 30, // 30 minutes TTL
  updateAgeOnGet: true,
});

/**
 * Generic cache wrapper function
 * @param {LRUCache} cache - The cache instance to use
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - Optional custom TTL in milliseconds
 * @returns {Promise<any>} - Cached or freshly fetched data
 */
async function getOrFetch(cache, key, fetchFn, ttl = undefined) {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  if (ttl) {
    cache.set(key, data, { ttl });
  } else {
    cache.set(key, data);
  }

  return data;
}

/**
 * Invalidate cache entries by pattern
 * @param {LRUCache} cache - The cache instance
 * @param {string} pattern - Pattern to match (simple string matching)
 */
function invalidatePattern(cache, pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
function getStats() {
  return {
    api: {
      size: apiCache.size,
      max: apiCache.max,
      calculatedSize: apiCache.calculatedSize,
    },
    sharedLink: {
      size: sharedLinkCache.size,
      max: sharedLinkCache.max,
    },
    trello: {
      size: trelloCache.size,
      max: trelloCache.max,
    },
    session: {
      size: sessionCache.size,
      max: sessionCache.max,
    },
  };
}

/**
 * Clear all caches
 */
function clearAll() {
  apiCache.clear();
  sharedLinkCache.clear();
  trelloCache.clear();
  sessionCache.clear();
}

module.exports = {
  apiCache,
  sharedLinkCache,
  trelloCache,
  sessionCache,
  getOrFetch,
  invalidatePattern,
  getStats,
  clearAll,
};
