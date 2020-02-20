/* globals Dexie */

angular.module('mermaid.libs').service('OfflineTableUtils', [
  'APP_CONFIG',
  '$q',
  '$http',
  'OfflineTable',
  // 'OfflineTableGroup',
  // 'utils',
  'resourceutils',
  'authService',
  'connectivity',
  'OfflineTableSync',
  'logger',
  function(
    APP_CONFIG,
    $q,
    $http,
    OfflineTable,
    resourceutils,
    authService,
    connectivity,
    OfflineTableSync,
    logger
  ) {
    'use strict';
    const TABLE_NAME_DELIMITER = APP_CONFIG.localDbNameDelimiter;
    const UUID_REGEX_STR =
      '([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}';
    const uuidRegEx = new RegExp(UUID_REGEX_STR);

    const getDatabaseNames = function() {
      return Dexie.getDatabaseNames(function(names) {
        return _.filter(names, function(name) {
          return name && name.startsWith(APP_CONFIG.localDbName);
        });
      });
    };

    const splitTableName = function(tableName) {
      if (tableName == null) {
        return null;
      }

      const name = {};
      const parts = tableName.split(TABLE_NAME_DELIMITER);
      const partsLen = parts.length;
      name.prefix = parts[0];
      name.baseName = parts[1];
      name.profileId =
        partsLen > 2 && uuidRegEx.test(parts[2]) ? parts[2] : null;
      name.projectId =
        partsLen > 3 && uuidRegEx.test(parts[3]) ? parts[3] : null;

      return name;
    };

    const getProjectIdFromTableName = function(name) {
      const tableNameObj = splitTableName(name);
      return tableNameObj.projectId;
    };

    const getProfileIdFromTableName = function(name) {
      const tableNameObj = splitTableName(name);
      return tableNameObj.profileId;
    };

    const getTableProfileIds = function() {
      return getDatabaseNames().then(function(names) {
        const profileIds = new Set();
        for (let i = 0; i < names.length; i++) {
          const name = names[i];
          const profileId = getProfileIdFromTableName(name);
          if (profileId) {
            profileIds.add(profileId);
          }
        }
        return Array.from(profileIds);
      });
    };

    const getTableProjectIds = function() {
      return getDatabaseNames().then(function(names) {
        const projectIds = new Set();
        for (let i = 0; i < names.length; i++) {
          const name = names[i];
          const projectId = getProjectIdFromTableName(name);
          if (projectId) {
            projectIds.add(projectId);
          }
        }
        return Array.from(projectIds);
      });
    };

    const _refresh = function(table, limit) {
      if (connectivity.isOnline !== true) {
        return $q.resolve(table);
      }
      const options = table.getOptions() || {};
      const qry = options.queryArgs || {};

      if (authService.isAuthenticated() !== true && options.isPublic !== true) {
        console.warn('[%s] Table refresh skipped.', table.name);
        return $q.resolve(table);
      }
      return table.count({}, true).then(function(recordCount) {
        if (recordCount === 0) {
          var promise;
          if (limit) {
            promise = resourceutils.all(table.$$resource, limit, qry);
          } else if (table.$$resource != null) {
            promise = table.$$resource.query(qry).$promise;
          } else if (_.isFunction(options.fetch)) {
            promise = options.fetch();
          } else {
            promise = $q.resolve([]);
          }
          return promise.then(function(records) {
            OfflineTableSync.setLastAccessed(table.name);
            return table.addRemoteRecords(records).then(function() {
              return table;
            });
          });
        } else {
          var opts = {};
          if (_.isFunction(options.fetchUpdates)) {
            opts.fetchUpdates = options.fetchUpdates;
          } else if (options.updatesUrl) {
            opts.updatesUrl = options.updatesUrl;
          }

          opts.applySyncRecord = options.applySyncRecord;
          return OfflineTableSync.sync(table, opts)
            .then(function() {
              return table;
            })
            .catch(function(err) {
              logger.error('refreshProjects', '[' + table.name + '] ', err);
              return table;
            });
        }
      });
    };

    const paginatedRefresh = function(table, options) {
      var limit = options.limit || 100;
      return _refresh(table, limit);
    };

    const checkRemoteProjectStatus = function(projectIds) {
      return $q
        .all(
          _.map(projectIds, function(projectId) {
            const url = APP_CONFIG.apiUrl + 'projects/' + projectId + '/';
            return $http
              .head(url)
              .then(function() {
                return { [projectId]: true };
              })
              .catch(function(err) {
                let status = true;
                if (err.status === 404) {
                  status = false;
                }
                return { [projectId]: status };
              });
          })
        )
        .then(function(results) {
          return _.merge.apply(_, results);
        });
    };

    const createOfflineTable = function(
      tableName,
      remoteUrl,
      resource,
      options,
      refreshFx,
      skipRefresh
    ) {
      let table;
      let deferred = $q.defer();
      let promise;

      promise = deferred.promise;

      options = options || {};
      table = new OfflineTable(tableName, remoteUrl, options);
      table.$$resource = resource;
      table.setOptions(options);
      // Add method to refresh data in offlinedb
      table.refresh = function() {
        return refreshFx(table, options);
      };
      if (skipRefresh !== true) {
        table
          .refresh()
          .then(function() {
            deferred.resolve(table);
          })
          .catch(function(err) {
            deferred.reject(err);
          });
      } else {
        deferred.resolve(table);
      }

      return promise;
    };

    const deleteDatabase = function(name) {
      return Dexie.delete(name);
    };

    const isSynced = function(tables) {
      tables = tables || [];
      return $q
        .all(
          _.map(tables, function(table) {
            return table.isSynced();
          })
        )
        .then(function(syncedResults) {
          return syncedResults.indexOf(false) === -1;
        });
    };

    return {
      TABLE_NAME_DELIMITER: TABLE_NAME_DELIMITER,
      UUID_REGEX_STR: UUID_REGEX_STR,
      isSynced: isSynced,
      checkRemoteProjectStatus: checkRemoteProjectStatus,
      deleteDatabase: deleteDatabase,
      getDatabaseNames: getDatabaseNames,
      getProjectIdFromTableName: getProjectIdFromTableName,
      getTableProfileIds: getTableProfileIds,
      getTableProjectIds: getTableProjectIds,
      createOfflineTable: createOfflineTable,
      paginatedRefresh: paginatedRefresh,
      splitTableName: splitTableName
    };
  }
]);
