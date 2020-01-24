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

    const UUID_REGEX_STR =
      '([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}';
    const uuidRegEx = new RegExp(UUID_REGEX_STR);
    const projectTableRegEx = new RegExp(
      `${APP_CONFIG.localDbName}-.*-${UUID_REGEX_STR}-${UUID_REGEX_STR}`
    );

    const getDatabaseNames = function() {
      return Dexie.getDatabaseNames(function(names) {
        return _.filter(names, function(name) {
          return name && name.startsWith(APP_CONFIG.localDbName);
        });
      });
    };

    const getProjectIdFromTableName = function(name) {
      if (projectTableRegEx.test(name)) {
        const parts = name.split(uuidRegEx);
        if (parts.length > 0) {
          return parts[1];
        }
      }
      return null;
    };

    const getProfileIdFromTableName = function(name) {
      if (projectTableRegEx.test(name)) {
        const uuids = name.split(uuidRegEx);
        return uuids[2];
      } else if (uuidRegEx.test(name)) {
        const uuids = name.split(uuidRegEx);
        return uuids[1];
      }
      return null;
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

    /*
    ([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}

    1. get list of profile ids
    2. get a list of project tables for id
    3. get list of common tables
    4. delete project tables by profile id
    5. delete common tables if only 1 profile id

    */
    const deleteDatabases = function() {
      // TODO refactor deleteDatabases
      throw 'TODO refactor deleteDatabases';
      return getDatabaseNames()
        .then(function(names) {
          return _.compact(_.uniq(_.map(names, projectIdFromTableName)));
        })
        .then(function(projectIds) {
          return $q.all(_.map(projectIds, fetchProjectTablesForRemoval));
        })
        .then(function(delTables) {
          return loadLookupTables(true).then(function(lookupTables) {
            return delTables.concat(lookupTables);
          });
        })
        .then(function(delTables) {
          return ProjectsTable(true).then(function(table) {
            delTables.push(table);
            return delTables;
          });
        })
        .then(function(delTables) {
          delTables = [].concat.apply([], delTables);
          var deletePromises = _.map(delTables, function(table) {
            var name = table.name;
            if (table.closeDbGroup) {
              table.closeDbGroup();
            } else {
              table.db.close();
            }
            return Dexie.delete(name);
          });
          deletePromises.push(OfflineTableSync.destroy());
          return $q.all(deletePromises);
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

    const projectIdFromTableName = function(tableName) {
      var parts = tableName
        .split('-')
        .reverse()
        .join('-')
        .split('-', 5);
      if (parts.length < 5) {
        return null;
      }
      return parts.reverse().join('-');
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
      // tables[tableName] = promise;
      //TODO: createOffline table should pass promise if called more than once

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

    const isSynced = function() {
      throw 'TODO Refactor isSynced';
      const db_prefix = 'mermaid-collect-';

      return Dexie.getDatabaseNames().then(function(names) {
        var is_synced_promises = [];
        // Get database names
        _.each(names, function(name) {
          if (name != null && name.startsWith(db_prefix)) {
            var table = new OfflineTable(name);
            is_synced_promises.push(table.isSynced());
          }
        });

        return $q.all(is_synced_promises).then(function(results) {
          for (var i = 0; i < results.length; i++) {
            if (results[i] === false) {
              return false;
            }
          }
          return true;
        });
      });
    };

    return {
      UUID_REGEX_STR: UUID_REGEX_STR,
      isSynced: isSynced,
      checkRemoteProjectStatus: checkRemoteProjectStatus,
      deleteDatabase: deleteDatabase,
      deleteDatabases: deleteDatabases,
      getDatabaseNames: getDatabaseNames,
      getProjectIdFromTableName: getProjectIdFromTableName,
      getTableProfileIds: getTableProfileIds,
      getTableProjectIds: getTableProjectIds,
      projectIdFromTableName: projectIdFromTableName,
      createOfflineTable: createOfflineTable,
      paginatedRefresh: paginatedRefresh
    };
  }
]);
