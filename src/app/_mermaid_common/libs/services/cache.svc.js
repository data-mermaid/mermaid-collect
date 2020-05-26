angular.module('mermaid.libs').service('cache', function(APP_CONFIG) {
  'use strict';

  const defaultExpire = APP_CONFIG.defaultCacheExpire;
  let _store = {};

  const isExpired = function(ttl) {
    return getCurrentTime() >= ttl;
  };

  const _flushExpired = function(key) {
    const cachedItem = _store[key];

    if (cachedItem === undefined || !isExpired(cachedItem.ttl)) {
      return;
    }
    _remove(key);
  };

  const _flush = function() {
    _store = {};
  };

  const _remove = function(key) {
    delete _store[key];
  };

  const _set = function(key, value, expire) {
    _flushExpired(key);

    if (expire == null) {
      expire = defaultExpire;
    }
    _store[key] = {
      val: value,
      ttl: getCurrentTime() + expire
    };
  };

  const _get = function(key) {
    _flushExpired(key);

    const cachedItem = _store[key];
    if (cachedItem === undefined) {
      return null;
    }
    return cachedItem.val;
  };

  const getCurrentTime = function() {
    return new Date().getTime();
  };

  return {
    flush: _flush,
    get: _get,
    set: _set,
    remove: _remove,
    keys: _store.keys
  };
});
