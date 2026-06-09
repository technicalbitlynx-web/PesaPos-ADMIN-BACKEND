// In-memory token store replacing Redis dependency.
// Supports the same set/get/del interface used by auth middleware.
const logger = require('../utils/logger');

const store = new Map();
const timers = new Map();

const redis = {
  async set(key, value, optionOrEx, ttlSeconds) {
    store.set(key, value);
    if (timers.has(key)) clearTimeout(timers.get(key));
    if (optionOrEx === 'EX' && ttlSeconds) {
      const ms = parseInt(ttlSeconds, 10) * 1000;
      const t = setTimeout(() => { store.delete(key); timers.delete(key); }, ms);
      timers.set(key, t);
    }
    return 'OK';
  },

  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },

  async del(key) {
    if (timers.has(key)) { clearTimeout(timers.get(key)); timers.delete(key); }
    store.delete(key);
    return 1;
  },

  on(event, cb) {
    if (event === 'connect') {
      setImmediate(() => { logger.info('Token store ready (in-memory)'); cb(); });
    }
    return this;
  },
};

module.exports = redis;
