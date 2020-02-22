/* globals Dexie, moment */

/*
  
  destroy: Remove local IndexedDB that stores table names and last accessed.

  getLastAccessed(name): Get timestamp of when OfflineTable was last updated from remote table.
    @param {string} name: IndexedDB table name.

  setLastAccessed(name): Set current timestamp of when OfflineTable was last updated from remote table.
    @param {string} name: IndexedDB table name.
  
  removeLastAccessed(name): Remove timestamp of when OfflineTable was last updated from remote table.
    @param {string} name: IndexedDB table name.

  sync(offlineTable, options): 
    @param {OfflineTable} offlineTable: IndexedDB table instance.
    @param {object} options: Optional parameters. Available options include:
      
      - fetchUpdates {function} Override existing fetchUpdates method.
        @returns {Promise}
      - updatesUrl {string} Override existing generated updatesUrl based on OfflineTable remote_url.
      - applySyncRecord {function} Override existing applySyncRecord method.  Used for special cases such as choices.
        @returns {Promise}
      - dryRun {boolean} Don't apply syncRecord's to local and remote databases.
        @returns {Promise} syncRecord
      - tableName {string} Can set how the table name is saved in the last accessed database, defaults: `offlineTable.name`.
*/

angular.module('mermaid.libs').service('OfflineTableSync', [
  '$http',
  '$q',
  'utils',
  function($http, $q, utils) {
    'use strict';

    var db;
    var table;

    var service = {};
    const APP_CONFIG = window.appConfig; // Doing this to fix karma tests
    var databaseName = `${APP_CONFIG.localDbName}${
      APP_CONFIG.localDbNameDelimiter
    }offlinetables`;
    var tableSchema = {};

    service.LOCAL_CREATE = 10;
    service.LOCAL_DELETE = 11;
    service.LOCAL_PUT = 12;
    service.REMOTE_CREATE = 20;
    service.REMOTE_DELETE = 21;
    service.REMOTE_PUT = 22;

    tableSchema[databaseName] = '&name';
    db = new Dexie(databaseName, { autoOpen: true });
    db.version(1).stores(tableSchema);
    table = db[databaseName];

    var getCurrentTimestamp = function() {
      return moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    };

    var fetchUpdates = function(updatesUrl, offlineTableName) {
      var url = updatesUrl;

      return service
        .getLastAccessed(offlineTableName)
        .then(function(timestamp) {
          timestamp = timestamp || '';
          url = utils.attachQueryParams(url, { timestamp: timestamp });
          return $http.get(url);
        })
        .then(function(resp) {
          return resp.data;
        });
    };

    var castToTimestamp = function(timestampString) {
      var timestampTemplate = 'YYYY-MM-DD+HH:mm:ss.SSS';
      var isValid =
        _.isString(timestampString) &&
        moment(timestampString, timestampTemplate).isValid();

      if (isValid === false) {
        return null;
      }
      return moment(timestampString, 'YYYY-MM-DD+HH:mm:ss.SSS').unix();
    };

    var syncDelete = function(deletedRecord, offlineTable) {
      return offlineTable.get(deletedRecord.id).then(function(record) {
        var isSynced = record && record.$$synced;
        var isDeleted = record && record.$$deleted;
        var localUpdatedOn = castToTimestamp(_.get(record, 'updated_on'));
        var remoteDeleteTimestamp = castToTimestamp(
          _.get(deletedRecord, 'timestamp')
        );

        if (
          record == null ||
          (isSynced === true && localUpdatedOn > remoteDeleteTimestamp)
        ) {
          return null;
        } else if (
          (isSynced && localUpdatedOn <= remoteDeleteTimestamp) ||
          (isSynced === false && isDeleted)
        ) {
          return {
            action: service.LOCAL_DELETE,
            record: record
          };
        } else if (isSynced === false && isDeleted === false) {
          return {
            action: service.REMOTE_CREATE,
            record: record
          };
        }
        throw 'Sync delete option not available.';
      });
    };

    var syncUpdate = function(updatedRecord, offlineTable) {
      var pk = _.get(updatedRecord, offlineTable.getPrimaryKeyName());
      return offlineTable.get(pk).then(function(record) {
        var isSynced = _.get(record, '$$synced');
        var localUpdatedOn = castToTimestamp(_.get(record, 'updated_on'));
        var remoteUpdatedOn = castToTimestamp(
          _.get(updatedRecord, 'updated_on')
        );

        if (isSynced && localUpdatedOn === remoteUpdatedOn) {
          return null;
        } else if (record == null) {
          return {
            action: service.LOCAL_CREATE,
            record: updatedRecord
          };
        } else if (isSynced && localUpdatedOn < remoteUpdatedOn) {
          return {
            action: service.LOCAL_PUT,
            record: updatedRecord
          };
        } else if (
          isSynced === false ||
          (isSynced && localUpdatedOn > remoteUpdatedOn)
        ) {
          return {
            action: service.REMOTE_PUT,
            record: record
          };
        }

        throw 'Sync update option not available.';
      });
    };

    var syncUpdated = function(updatedRecords, offlineTable) {
      return $q
        .all(
          _.map(updatedRecords, function(updatedRecord) {
            return syncUpdate(updatedRecord, offlineTable);
          })
        )
        .then(function(results) {
          return _.reduce(
            results,
            function(syncRecord, result) {
              if (result != null) {
                syncRecord[result.record.id] = result;
              }
              return syncRecord;
            },
            {}
          );
        });
    };

    var syncDeleted = function(deletedRecords, offlineTable) {
      return $q
        .all(
          _.map(deletedRecords, function(deletedRecord) {
            return syncDelete(deletedRecord, offlineTable);
          })
        )
        .then(function(results) {
          return _.reduce(
            results,
            function(syncRecord, result) {
              if (result != null && result.record.id) {
                syncRecord[result.record.id] = result;
              }
              return syncRecord;
            },
            {}
          );
        });
    };

    var getUnsyncedLocalRecords = function(offlineTable, ignoreIds) {
      return offlineTable
        .filter({ $$synced: false }, true)
        .then(function(records) {
          return _.filter(records, function(record) {
            return ignoreIds.indexOf(record.id) === -1;
          });
        })
        .then(function(unsyncedLocalRecords) {
          return _.reduce(
            unsyncedLocalRecords,
            function(results, unsyncedLocalRecord) {
              if (
                unsyncedLocalRecord.$$deleted === true &&
                unsyncedLocalRecord.$$synced === false
              ) {
                results[unsyncedLocalRecord.id] = {
                  action: service.REMOTE_DELETE,
                  record: unsyncedLocalRecord
                };
              } else if (
                unsyncedLocalRecord.$$created === true &&
                unsyncedLocalRecord.$$synced === false
              ) {
                results[unsyncedLocalRecord.id] = {
                  action: service.REMOTE_CREATE,
                  record: unsyncedLocalRecord
                };
              } else {
                results[unsyncedLocalRecord.id] = {
                  action: service.REMOTE_PUT,
                  record: unsyncedLocalRecord
                };
              }
              return results;
            },
            {}
          );
        });
    };

    var createSyncRecord = function(
      updatedRecords,
      deletedRecords,
      offlineTable
    ) {
      var updatePromise = syncUpdated(updatedRecords, offlineTable);
      var deletePromise = syncDeleted(deletedRecords, offlineTable);
      var promise = $q.all([updatePromise, deletePromise]);

      return promise
        .then(function(results) {
          return _.extend({}, results[0], results[1]);
        })
        .then(function(syncRecord) {
          var ignoreIds = _.keys(syncRecord);
          return getUnsyncedLocalRecords(offlineTable, ignoreIds).then(function(
            unsyncedRecords
          ) {
            return _.extend(syncRecord, unsyncedRecords);
          });
        })
        .catch(function(err) {
          console.error(err);
          throw err;
        });
    };

    var applySyncRecord = function(syncRecord, offlineTable) {
      return $q.all(
        _.map(syncRecord, function(entry) {
          switch (entry.action) {
            case service.LOCAL_CREATE:
              return offlineTable.addRemoteRecords(entry.record);
            case service.LOCAL_PUT:
              return offlineTable.addRemoteRecords(entry.record);
            case service.LOCAL_DELETE:
              return entry.record.delete(true);
            case service.REMOTE_CREATE:
              return entry.record.remotePost();
            case service.REMOTE_DELETE:
              return entry.record.remoteDelete();
            case service.REMOTE_PUT:
              return entry.record.remotePut();
            default:
              throw entry.action + ' is not a valid action';
          }
        })
      );
    };

    var sync = function(offlineTable, updates, options) {
      var addedRecords = updates.added || [];
      var updatedRecords = updates.modified || [];
      var deletedRecords = updates.removed || [];

      var isDryRun = options.dryRun || false;
      var tableName = options.tableName || offlineTable.name;

      updatedRecords = updatedRecords.concat(addedRecords);
      var syncLogicPromise = createSyncRecord(
        updatedRecords,
        deletedRecords,
        offlineTable
      );

      return syncLogicPromise.then(function(syncRecord) {
        if (isDryRun) {
          return syncRecord;
        }
        var _applySyncRecord = options.applySyncRecord || applySyncRecord;
        return _applySyncRecord(syncRecord, offlineTable).then(function() {
          if (Object.keys(syncRecord).length > 0) {
            service.setLastAccessed(tableName);
          }
          return syncRecord;
        });
      });
    };

    service.destroy = function() {
      if (db && db.isOpen()) {
        db.close();
      }
      return Dexie.delete(databaseName);
    };

    service.setLastAccessed = function(name) {
      var timestamp = getCurrentTimestamp();
      var data = { lastAccessed: timestamp, name: name };
      return db.transaction('rw?', table, function() {
        return table.put(data).then(function() {
          return data;
        });
      });
    };

    service.getLastAccessed = function(name) {
      return table.get(name).then(function(rec) {
        if (rec === undefined) {
          return null;
        }
        return rec.lastAccessed;
      });
    };

    service.removeLastAccessed = function(name) {
      return table.delete(name);
    };

    service.sync = function(offlineTable, options) {
      options = options || {};
      var fetchUpdatesPromise;
      var tableName = options.tableName || offlineTable.name;

      if (_.isFunction(options.fetchUpdates)) {
        fetchUpdatesPromise = options.fetchUpdates();
      } else {
        var url =
          options.updatesUrl || offlineTable.getResourceUrl() + 'updates/';
        fetchUpdatesPromise = fetchUpdates(url, tableName);
      }
      return fetchUpdatesPromise.then(function(updates) {
        return sync(offlineTable, updates, options);
      });
    };

    return service;
  }
]);
