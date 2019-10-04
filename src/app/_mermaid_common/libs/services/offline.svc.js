/* globals Dexie */

angular.module('mermaid.libs').service('offlineservice', [
  'APP_CONFIG',
  '$q',
  '$http',
  'OfflineTable',
  'OfflineTableGroup',
  'utils',
  'resourceutils',
  'authService',
  'Choice',
  'ProjectSite',
  'ProjectManagement',
  'ProjectProfile',
  'CollectRecord',
  'BenthicAttribute',
  'FishSize',
  'FishFamily',
  'FishGenus',
  'FishSpecies',
  'connectivity',
  'OfflineTableSync',
  function(
    APP_CONFIG,
    $q,
    $http,
    OfflineTable,
    OfflineTableGroup,
    utils,
    resourceutils,
    authService,
    Choice,
    ProjectSite,
    ProjectManagement,
    ProjectProfile,
    CollectRecord,
    BenthicAttribute,
    FishSize,
    FishFamily,
    FishGenus,
    FishSpecies,
    connectivity,
    OfflineTableSync
  ) {
    'use strict';

    var deleteProjectPromises = {};
    var tables = {};
    var projectRelatedTableBaseNames = [
      'projectsites',
      'projectmanagements',
      'project_profiles',
      'collectrecords'
    ];
    var nonProjectRelatedTableNames = [
      'choices',
      'fishattributes',
      'fishsizes',
      'fishfamilies',
      'fishgenera',
      'fishspecies',
      'benthicattributes',
      'projecttags'
    ];

    const projectsTableName = APP_CONFIG.localDbName + '-projects';

    var getTableByName = function(name) {
      tables = tables || {};
      return tables[name];
    };

    var databaseExists = function(name) {
      return Dexie.getDatabaseNames().then(function(names) {
        return names.indexOf(name) !== -1;
      });
    };

    var getDatabaseNames = function() {
      return Dexie.getDatabaseNames(function(names) {
        return _.filter(names, function(name) {
          return name && name.startsWith(APP_CONFIG.localDbName);
        });
      });
    };

    var fetchProjectTablesForRemoval = function(projectId) {
      var promise = loadProjectRelatedTables(projectId, true);
      return promise.then(function(tables) {
        var isSyncedPromise = $q.all(
          _.map(tables, function(table) {
            return table.isSynced();
          })
        );
        return isSyncedPromise.then(function(syncedResults) {
          if (syncedResults.indexOf(false) !== -1) {
            return $q.reject('Offline table not saved to server.');
          }
          return tables;
        });
      });
    };

    var clearDatabases = function(projectId) {
      return fetchProjectTablesForRemoval(projectId).then(function(tables) {
        return $q.all(
          _.map(tables, function(table) {
            if (table.name === projectsTableName) {
              return table.deleteRecords([projectId], true);
            }

            return table.table.clear().then(function() {
              return OfflineTableSync.removeLastAccessed(table.name);
            });
          })
        );
      });
    };

    const deleteProjectDatabases = function(projectId, force) {
      if (deleteProjectPromises[projectId] != null) {
        return deleteProjectPromises[projectId];
      }

      force = force || false;

      let tablesPromise;
      if (force) {
        tablesPromise = loadProjectRelatedTables(projectId, true);
      } else {
        tablesPromise = fetchProjectTablesForRemoval(projectId);
      }

      deleteProjectPromises[projectId] = tablesPromise
        .then(function(tables) {
          var deletePromises = _.map(tables, function(table) {
            var name = table.name;
            if (name === projectsTableName) {
              return table.deleteRecords([projectId], true);
            }

            if (table.closeDbGroup) {
              table.closeDbGroup();
            } else {
              table.db.close();
            }
            return Dexie.delete(name).then(function() {
              return OfflineTableSync.removeLastAccessed(name);
            });
          });
          return $q.all(deletePromises);
        })
        .finally(function() {
          delete deleteProjectPromises[projectId];
        });

      return deleteProjectPromises[projectId];
    };

    var deleteDatabases = function() {
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

    var getProjectTableNames = function() {
      var regStr =
        APP_CONFIG.localDbName +
        '-.*-([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}';
      var regx = new RegExp(regStr);
      return getDatabaseNames().then(function(names) {
        return _.filter(names, function(name) {
          return regx.test(name);
        });
      });
    };

    var isProjectOffline = function(projectId) {
      if (projectId == null) {
        throw 'projectId is required';
      }
      var baseName;
      var tableName;
      return getDatabaseNames().then(function(names) {
        for (var i = 0; i < projectRelatedTableBaseNames.length; i++) {
          baseName = projectRelatedTableBaseNames[i];
          tableName = APP_CONFIG.localDbName + '-' + baseName + '-' + projectId;
          if (names.indexOf(tableName) === -1) {
            return false;
          }
        }

        for (var j = 0; j < nonProjectRelatedTableNames.length; j++) {
          baseName = nonProjectRelatedTableNames[i];
          tableName = APP_CONFIG.localDbName + '-' + baseName;
          if (names.indexOf(tableName) === -1) {
            return false;
          }
        }

        return ProjectsTable(null, true).then(function(table) {
          return table.get(projectId).then(function(record) {
            return record !== null;
          });
        });
      });
    };

    const isOrphanedProject = function(projectId) {
      return loadProjectRelatedTables(projectId, true)
        .then(function(tables) {
          // Remove projects table because all authenticated
          // users has access.
          const filteredTables = _.filter(tables, function(table) {
            return table.name !== projectsTableName;
          });

          const tableChecks = _.map(filteredTables, function(table) {
            return $http
              .head(table.remote_url)
              .then(function() {
                return true;
              })
              .catch(function(err) {
                if (err.status === 403) {
                  return false;
                }
                return true;
              });
          });
          return $q.all(tableChecks);
        })
        .then(function(checks) {
          return checks.indexOf(true) === -1;
        });
    };

    const getProjectIds = function() {
      return getDatabaseNames().then(function(names) {
        return _.uniq(
          _.map(names, function(name) {
            return projectIdFromTableName(name);
          })
        );
      });
    };

    const getOrphanedProjects = function() {
      return getProjectIds()
        .then(function(projectIds) {
          return $q.all(
            _.map(_.compact(projectIds), function(projectId) {
              return isOrphanedProject(projectId).then(function(isOrphaned) {
                return {
                  projectId: projectId,
                  isOrphaned: isOrphaned
                };
              });
            })
          );
        })
        .then(function(projects) {
          return _.filter(projects, { isOrphaned: true });
        });
    };

    var _refresh = function(table, limit) {
      if (connectivity.isOnline !== true) {
        return $q.resolve(table);
      }
      var options = table.getOptions() || {};
      var qry = options.queryArgs || {};
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
          return OfflineTableSync.sync(table, opts).then(function() {
            return table;
          });
        }
      });
    };

    var paginatedRefresh = function(table, options) {
      var limit = options.limit || 100;
      return _refresh(table, limit);
    };

    var projectIdFromTableName = function(tableName) {
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

    var refreshAll = function() {
      // Check if records are synced
      var projectTablesPromise = getProjectTableNames().then(function(names) {
        var projectId;
        var promises = [];
        for (var n = 0; n < names.length; n++) {
          projectId = projectIdFromTableName(names[n]);
          if (projectId === null) {
            continue;
          }
          promises.push(loadProjectRelatedTables(projectId));
        }
        return $q.all(promises);
      });
      var lookupTablesPromise = loadLookupTables(false);

      return $q.all([projectTablesPromise, lookupTablesPromise]);
    };

    var getOrCreateOfflineTable = function(
      dbName,
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

      tableName = dbName + '-' + tableName;
      tableName = tableName.replace(/\//g, '-');
      if (!tables[tableName]) {
        promise = deferred.promise;
        tables[tableName] = promise;
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
      } else {
        if (skipRefresh !== true) {
          promise = tables[tableName].then(function(table) {
            table.refresh = function() {
              return refreshFx(table, options);
            };
            return table.refresh();
          });
        } else {
          promise = tables[tableName];
        }
      }
      return promise;
    };

    var buildProjectRelatedRemoteUrl = function(resourceUrlName, project_id) {
      return utils.template(
        APP_CONFIG.apiUrl + 'projects/{{project_pk}}/{{resourceUrlName}}/',
        {
          project_pk: project_id,
          resourceUrlName: resourceUrlName
        }
      );
    };

    var buildProjectRelatedTable = function(
      resource,
      resourceUrlName,
      project_id,
      table_name,
      options,
      skipRefresh
    ) {
      var remote_url;
      table_name = table_name || resourceUrlName;
      table_name += '-' + project_id;
      options = _.merge(options || {}, {
        queryArgs: { project_pk: project_id }
      });

      if (resourceUrlName) {
        remote_url = buildProjectRelatedRemoteUrl(resourceUrlName, project_id);
      }

      const refresh = function(table, options) {
        var promise;
        if (_.isFunction(options.refresh)) {
          promise = options.refresh(table, options);
        } else {
          promise = paginatedRefresh(table, options);
        }
        return promise.catch(function(err) {
          if (err.status === 403) {
            deleteProjectDatabases(project_id);
            return table;
          }
          return err;
        });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        table_name,
        remote_url,
        resource,
        options,
        refresh,
        skipRefresh
      );
    };

    var ProjectsTable = function(projectId, skipRefresh) {
      var tableName = 'projects';
      var updatesUrl = APP_CONFIG.apiUrl + 'projects/updates/';
      var remoteUrl = APP_CONFIG.apiUrl + 'projects/';

      var addProject = function(table) {
        if (projectId == null) {
          throw 'Project id required';
        }
        var url = remoteUrl + projectId + '/';
        return $http.get(url).then(function(resp) {
          return table.addRemoteRecords(resp.data);
        });
      };

      var refreshProjects = function(table) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }

        if (projectId == null) {
          if (APP_CONFIG.debugState) {
            console.warn(
              'Skipping table sync: All projects can not be refreshed at the same time.'
            );
          }
          return $q.resolve(table);
        }

        return table
          .get(projectId)
          .then(function(record) {
            if (record === null) {
              return addProject(table);
            } else {
              var opts = { tableName: tableName + '-' + projectId };
              return OfflineTableSync.sync(table, opts);
            }
          })
          .then(function() {
            OfflineTableSync.setLastAccessed(tableName + '-' + projectId);
            return table;
          });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        tableName,
        remoteUrl,
        null,
        {
          updatesUrl: updatesUrl
        },
        refreshProjects,
        skipRefresh
      ).then(function(table) {
        table.create = function() {
          throw 'Method not allowed';
        };
        return table;
      });
    };

    var ProjectSitesTable = function(project_id, skipRefresh) {
      var convertToChoices = function(choicesName, choices) {
        var choicesSubset = _.filter(choices, { name: choicesName })[0];
        return _.reduce(
          choicesSubset.data,
          function(o, choice) {
            o[choice.id] = choice;
            return o;
          },
          {}
        );
      };

      return ChoicesTable()
        .then(function(table) {
          return table.filter();
        })
        .then(function(choices) {
          var countryChoices = convertToChoices('countries', choices);
          var reefTypeChoices = convertToChoices('reeftypes', choices);
          var reefZoneChoices = convertToChoices('reefzones', choices);
          var reefExposuresChoices = convertToChoices('reefexposures', choices);
          return {
            countryChoices: countryChoices,
            reefTypeChoices: reefTypeChoices,
            reefZoneChoices: reefZoneChoices,
            reefExposuresChoices: reefExposuresChoices
          };
        })
        .then(function(choices) {
          return buildProjectRelatedTable(
            ProjectSite,
            'sites',
            project_id,
            'projectsites',
            {
              joinDefn: {
                countries: {
                  foreignKey: 'country',
                  relatedRecords: choices.countryChoices,
                  relatedKey: 'id',
                  relatedColumns: ['name']
                },
                reefzones: {
                  foreignKey: 'reef_zone',
                  relatedRecords: choices.reefZoneChoices,
                  relatedKey: 'id',
                  relatedColumns: ['name']
                },
                reeftypes: {
                  foreignKey: 'reef_type',
                  relatedRecords: choices.reefTypeChoices,
                  relatedKey: 'id',
                  relatedColumns: ['name']
                },
                reefexposures: {
                  foreignKey: 'exposure',
                  relatedRecords: choices.reefExposuresChoices,
                  relatedKey: 'id',
                  relatedColumns: ['name']
                }
              }
            },
            skipRefresh
          ).then(function(table) {
            if (table.$watch == null) {
              return table;
            }

            table.$watch(
              function(event) {
                if (
                  event.event === 'ot-deleterecord-error' &&
                  event.data[1].status === 403
                ) {
                  var msg = event.data[1].data || event.data[1].statusText;
                  if (msg.length > 500) {
                    msg = msg.substr(0, 497) + '...';
                  }
                  utils.showAlert('Warning', msg, utils.statuses.warning, 5000);
                }
              },
              null,
              'site-del-error'
            );

            return table;
          });
        });
    };

    var ProjectManagementsTable = function(project_id, skipRefresh) {
      return buildProjectRelatedTable(
        ProjectManagement,
        'managements',
        project_id,
        'projectmanagements',
        {},
        skipRefresh
      ).then(function(table) {
        table.$watch(
          function(event) {
            if (
              event.event === 'ot-deleterecord-error' &&
              event.data[1].status === 403
            ) {
              var msg = event.data[1].data || event.data[1].statusText;
              utils.showAlert('Warning', msg, utils.statuses.warning, 5000);
            }
          },
          null,
          'management-del-error'
        );
        return table;
      });
    };

    var ProjectProfilesTable = function(project_id, skipRefresh) {
      var projectProfilesRefresh = function(table, options) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }
        return paginatedRefresh(table, options).catch(function(err) {
          if (err.status === 403) {
            deleteProjectDatabases(project_id);
            return table;
          }
          return err;
        });
      };
      return buildProjectRelatedTable(
        ProjectProfile,
        'project_profiles',
        project_id,
        'project_profiles',
        { refresh: projectProfilesRefresh },
        skipRefresh
      );
    };

    var CollectRecordsTable = function(project_id, skipRefresh) {
      return buildProjectRelatedTable(
        CollectRecord,
        'collectrecords',
        project_id,
        null,
        {
          joinDefn: {
            sites:
              'data.sample_event.site -> mermaid-projectsites-' +
              project_id +
              '.id, name'
          }
        },
        skipRefresh
      );
    };

    var ChoicesTable = function(skipRefresh) {
      var updatesUrl = APP_CONFIG.apiUrl + 'choices/updates/';
      if (tables['mermaid-choices']) {
        return $q.resolve(tables['mermaid-choices']);
      }

      var fetchUpdates = function(tableName) {
        return OfflineTableSync.getLastAccessed(tableName).then(function(
          timestamp
        ) {
          timestamp = timestamp || '';
          var url = utils.attachQueryParams(updatesUrl, {
            timestamp: timestamp
          });
          return $http.get(url).then(function(resp) {
            return resp.data;
          });
        });
      };

      var applyUpdates = function(updates, table) {
        var modified = updates.modified || [];
        return table.addRemoteRecords(modified).then(function() {
          return table;
        });
      };

      var refreshChoices = function(table) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }

        return fetchUpdates(table.name).then(function(updates) {
          return applyUpdates(updates, table);
        });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'choices',
        null,
        Choice,
        {
          offlineTablePrimaryKey: 'name',
          isPublic: true
        },
        refreshChoices,
        skipRefresh
      );
    };

    var FishAttributesTable = function(skipRefresh) {
      return $q
        .all([
          FishSpeciesTable(skipRefresh),
          FishGeneraTable(skipRefresh),
          FishFamiliesTable(skipRefresh)
        ])
        .then(function(responses) {
          return OfflineTableGroup('fishattributes', responses);
        });
    };

    var FishSizesTable = function(skipRefresh) {
      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'fishsizes',
        null,
        FishSize,
        {
          updatesUrl: APP_CONFIG.apiUrl + 'fishsizes/updates/',
          isPublic: true
        },
        paginatedRefresh,
        skipRefresh
      );
    };

    var FishFamiliesTable = function(skipRefresh) {
      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'fishfamilies',
        APP_CONFIG.apiUrl + 'fishfamilies/',
        FishFamily,
        {
          limit: 200,
          isPublic: true
        },
        paginatedRefresh,
        skipRefresh
      );
    };

    var FishGeneraTable = function(skipRefresh) {
      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'fishgenera',
        APP_CONFIG.apiUrl + 'fishgenera/',
        FishGenus,
        {
          joinDefn: {
            fishfamilies: 'family -> mermaid-fishfamilies.id, name'
          },
          limit: 1000,
          isPublic: true
        },
        paginatedRefresh,
        skipRefresh
      );
    };

    var FishSpeciesTable = function(skipRefresh) {
      const refreshFishSpecies = function(table, options) {
        return table
          .filter({
            status: 10, // PROPOSED_RECORD
            $$synced: false
          })
          .then(function(records) {
            return _.map(records, function(record) {
              if (!record.name || !record.genus) {
                return record.delete(true);
              }
              return $q.resolve();
            });
          })
          .then(function(deletePromises) {
            return $q.all(deletePromises);
          })
          .then(function() {
            return paginatedRefresh(table, options);
          });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'fishspecies',
        APP_CONFIG.apiUrl + 'fishspecies/',
        FishSpecies,
        {
          joinDefn: {
            fishgenera: 'genus -> mermaid-fishgenera.id, name'
          },
          limit: 3000,
          isPublic: true
        },
        refreshFishSpecies,
        skipRefresh
      );
    };

    var BenthicAttributesTable = function(skipRefresh) {
      const refreshBenthicAttributes = function(table, options) {
        return table
          .filter({
            status: 10, // PROPOSED_RECORD
            $$synced: false
          })
          .then(function(records) {
            return _.map(records, function(record) {
              if (!record.name || !record.parent) {
                return record.delete(true);
              }
              return $q.resolve();
            });
          })
          .then(function(deletePromises) {
            return $q.all(deletePromises);
          })
          .then(function() {
            return paginatedRefresh(table, options);
          });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        'benthicattributes',
        APP_CONFIG.apiUrl + 'benthicattributes/',
        BenthicAttribute,
        {
          limit: 300,
          isPublic: true
        },
        refreshBenthicAttributes,
        skipRefresh
      );
    };

    var loadProjectRelatedTables = function(projectId, skipRefresh) {
      var promises = [
        ProjectsTable(projectId, skipRefresh),
        ProjectSitesTable(projectId, skipRefresh),
        ProjectManagementsTable(projectId, skipRefresh),
        ProjectProfilesTable(projectId, skipRefresh),
        CollectRecordsTable(projectId, skipRefresh)
      ];
      return $q.all(promises);
    };

    var loadLookupTables = function(skipRefresh) {
      var promises = [
        ChoicesTable(skipRefresh),
        FishSizesTable(skipRefresh),
        FishAttributesTable(skipRefresh),
        BenthicAttributesTable(skipRefresh),
        FishFamiliesTable(skipRefresh),
        FishGeneraTable(skipRefresh),
        FishSpeciesTable(skipRefresh)
      ];
      return $q.all(promises);
    };

    var offlineutils = {
      getTableByName: getTableByName,
      databaseExists: databaseExists,
      refreshAll: refreshAll,
      isSynced: function() {
        var db_prefix = 'mermaid-collect-';

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
      },
      clearDatabases: clearDatabases,
      deleteDatabases: deleteDatabases,
      ProjectsTable: ProjectsTable,
      ProjectSitesTable: ProjectSitesTable,
      ProjectManagementsTable: ProjectManagementsTable,
      ProjectProfilesTable: ProjectProfilesTable,
      CollectRecordsTable: CollectRecordsTable,
      ChoicesTable: ChoicesTable,
      FishAttributesTable: FishAttributesTable,
      FishSizesTable: FishSizesTable,
      FishFamiliesTable: FishFamiliesTable,
      FishGeneraTable: FishGeneraTable,
      FishSpeciesTable: FishSpeciesTable,
      BenthicAttributesTable: BenthicAttributesTable,
      loadProjectRelatedTables: loadProjectRelatedTables,
      isProjectOffline: isProjectOffline,
      getProjectTableNames: getProjectTableNames,
      loadLookupTables: loadLookupTables,
      projectIdFromTableName: projectIdFromTableName,
      isOrphanedProject: isOrphanedProject,
      getProjectIds: getProjectIds,
      getOrphanedProjects: getOrphanedProjects,
      deleteProjectDatabases: deleteProjectDatabases
    };

    return offlineutils;
  }
]);
