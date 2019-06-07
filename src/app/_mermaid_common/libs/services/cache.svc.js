/* globals lscache */

angular.module('mermaid.libs').service('cache', function(APP_CONFIG) {
  'use strict';
  // var self = this;
  var cacheservice = {
    _cache: null,
    expire: APP_CONFIG.defaultCacheExpire || 1, // In minutes
    remove: function(key) {
      this._cache.remove(key);
    },
    removeAll: function() {
      this._cache.flush();
    },
    set: function(key, value, expire) {
      expire = expire || this.expire;
      this._cache.set(key, value, expire);
    },
    get: function(key) {
      var v = this._cache.get(key);
      if (v !== null) {
        console.log('"%s" from cache', key);
      }
      return v;
    }
  };

  cacheservice._cache = lscache;
  cacheservice._cache.setBucket('mermaid-');

  return cacheservice;
});
