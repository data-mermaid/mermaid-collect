/* globals CircularJSON */
'use strict';

angular.module('app').provider('logger', [
  function() {
    var store;
    var logLevel;
    var loggerUrl;
    var tableOpts = { deleteRecordAfterSync: true };
    var tableName = 'mermaid_logging_store';

    this.init = function(config) {
      logLevel = config.level || 'debug';
      loggerUrl = config.loggerUrl;
    };

    this.$get = [
      '$injector',
      function loggerFactory($injector) {
        var OfflineTable = $injector.get('OfflineTable');
        var log = new Logger();
        if (loggerUrl != null && loggerUrl.length !== 0) {
          store = new OfflineTable(tableName, loggerUrl, tableOpts);
        }
        log.setStore(store);
        log.LOG_LEVEL = logLevel;
        return log;
      }
    ];
  }
]);

function Logger() {
  var store;
  var throttleId = null;
  var throttleTimeout = 100;
  this.ERROR = 'error';
  this.WARN = 'warn';
  this.DEBUG = 'debug';
  this.LOG_LEVEL = this.DEBUG;
  this.LOG_LEVELS = [this.ERROR, this.WARN, this.DEBUG];

  this.setStore = function(db) {
    store = db;
  };

  var getTimestamp = function() {
    return new Date().toISOString();
  };

  var saveLogEntry = function() {
    var self = this;
    if (store == null || throttleId != null) {
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    throttleId = setTimeout(function() {
      if (args.length < 2) {
        return;
      }
      var timestamp = getTimestamp();
      var level = args.shift();
      if (self.LOG_LEVELS.indexOf(level) === -1) {
        throw 'Invalid log type';
      }
      var entry = {};
      for (var i = 2; i <= args.length; i += 2) {
        var key = args[i - 2].toString();
        var val = CircularJSON.stringify(args[i - 1]);

        entry[key] = val;
      }

      var record = {
        level: level,
        timestamp: timestamp,
        entry: entry
      };
      store.create(record).finally(function() {
        setTimeout(function() {
          throttleId = null;
        }, throttleTimeout);
      });
    }, throttleTimeout);
  };

  this.error = function() {
    console.error.apply(this, arguments);
    var args = Array.prototype.slice.call(arguments);
    args.unshift('error');
    saveLogEntry.apply(this, args);
  };

  this.warn = function() {
    console.warn.apply(this, arguments);
    if (this.LOG_LEVEL !== 'error') {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('warn');
      saveLogEntry.apply(this, args);
    }
  };

  this.debug = function() {
    console.debug.apply(this, arguments);
    if ([this.ERROR, this.WARN].indexOf(this.LOG_LEVEL) === -1) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('debug');
      saveLogEntry.apply(this, args);
    }
  };
}
