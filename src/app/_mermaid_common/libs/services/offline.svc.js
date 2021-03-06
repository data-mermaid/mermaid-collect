/* globals Dexie */

angular.module('mermaid.libs').service('offlineservice', [
  'APP_CONFIG',
  '$q',
  '$http',
  '$injector',
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
  'SpatialUtils',
  'logger',
  function(
    APP_CONFIG,
    $q,
    $http,
    $injector,
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
    OfflineTableSync,
    SpatialUtils,
    logger
  ) {
    'use strict';

    const projectsTableName = APP_CONFIG.localDbName + '-projects_v2';
    let deleteProjectPromises = {};
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

    const getTableByName = function(tableParts, skipRefresh) {
      const tableNameMap = {
        benthicattributes: BenthicAttributesTable,
        fishfamilies: FishFamiliesTable,
        fishgenera: FishGeneraTable,
        fishsizes: FishSizesTable,
        fishspecies: FishSpeciesTable,
        choices: ChoicesTable,
        projects_v2: ProjectsTable,
        projectmanagements: ProjectManagementsTable,
        collectrecords: CollectRecordsTable,
        project_profiles: ProjectProfilesTable,
        projectsites: ProjectSitesTable
      };

      if (tableParts.baseName === 'offlinetables') {
        // Mocking OfflineTable factory so table can be removed
        return $q.resolve({
          name: `${tableParts.prefix}-${tableParts.baseName}`,
          isSynced: function() {
            return $q.resolve(true);
          }
        });
      }

      if (tableParts.projectId) {
        return tableNameMap[tableParts.baseName](
          tableParts.projectId,
          skipRefresh
        );
      }
      return tableNameMap[tableParts.baseName](skipRefresh);
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
            return $q.reject({
              key: 'notsynced',
              message: 'Offline table not saved to server.'
            });
          }
          return tables;
        });
      });
    };

    var clearDatabases = function(projectId) {
      return fetchProjectTablesForRemoval(projectId).then(function(tables) {
        return $q.all(
          _.map(tables, function(table) {
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
          const deletePromises = _.map(tables, function(table) {
            const name = table.name;
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

        return ProjectsTable(true).then(function(table) {
          return table.get(projectId).then(function(record) {
            return record !== null;
          });
        });
      });
    };

    const getOfflineProjects = function() {
      return ProjectsTable(true)
        .then(function(table) {
          return table.filter();
        })
        .then(function(projects) {
          return $q.all(
            _.map(projects, function(project) {
              const projectId = project.id;
              return isProjectOffline(projectId).then(function(isOffline) {
                const o = {};
                o[projectId] = isOffline;
                return o;
              });
            })
          );
        })
        .then(function(results) {
          return _.merge.apply(_, results);
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

    var refreshAll = function() {
      // Check if records are synced
      const projectTablesPromise = getProjectTableNames()
        .then(function(names) {
          const projectIds = new Set();
          for (var n = 0; n < names.length; n++) {
            const projectId = projectIdFromTableName(names[n]);
            if (projectId === null) {
              continue;
            }
            projectIds.add(projectId);
          }
          return Array.from(projectIds);
        })
        .then(function(projectIds) {
          return checkRemoteProjectStatus(projectIds);
        })
        .then(function(projectStatuses) {
          return $q.all(
            _.map(projectStatuses, function(status, projectId) {
              if (status === false) {
                return deleteProjectDatabases(projectId, true);
              }
              return loadProjectRelatedTables(projectId);
            })
          );
        });

      const lookupTablesPromise = loadLookupTables(false);
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
      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        table_name,
        remote_url,
        resource,
        options,
        _.isFunction(options.refresh) ? options.refresh : paginatedRefresh,
        skipRefresh
      );
    };

    var ProjectsTable = function(skipRefresh) {
      const tableName = 'projects_v2';
      const updatesUrl = APP_CONFIG.apiUrl + 'projects/updates/';
      const remoteUrl = APP_CONFIG.apiUrl + 'projects/';
      const refreshProjects = function(table) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }

        const opts = { tableName: tableName, updatesUrl: updatesUrl };
        return OfflineTableSync.sync(table, opts)
          .then(function() {
            return table;
          })
          .catch(function(err) {
            logger.error('refreshProjects', err);
            return table;
          });
      };

      return getOrCreateOfflineTable(
        APP_CONFIG.localDbName,
        tableName,
        remoteUrl,
        null,
        {},
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
          var regionsChoices = convertToChoices('regions', choices);
          return {
            countryChoices: countryChoices,
            reefTypeChoices: reefTypeChoices,
            reefZoneChoices: reefZoneChoices,
            reefExposuresChoices: reefExposuresChoices,
            regionsChoices: regionsChoices
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
                },
                regions: {
                  foreignKey: 'location',
                  relatedKey: 'geom',
                  relatedRecords: choices.regionsChoices,
                  relateFunction: function(obj, relatedRecord) {
                    return SpatialUtils.pointInPolygon(
                      obj.location,
                      relatedRecord.geom
                    );
                  },
                  relatedColumns: ['id', 'name']
                }
              }
            },
            skipRefresh
          ).then(function(table) {
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
              '.id, name',
            managements:
              'data.sample_event.management -> mermaid-projectmanagements-' +
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

    const syncAndDeleteV1Tables = function(retryCount) {
      const ProjectService = $injector.get('ProjectService');
      if (retryCount == null) {
        retryCount = 0;
      }

      if (retryCount > 1) {
        return $q.reject({
          key: 'notsynced',
          message: 'Offline table not saved to server.'
        });
      }

      return getDatabaseNames()
        .then(function(tableNames) {
          return tableNames.filter(function(tableName) {
            return tableName.startsWith(`${APP_CONFIG.localDbName}-`);
          });
        })
        .then(function(filteredTableNames) {
          // Parse old MERMAID IndexedDB table names
          return filteredTableNames.map(function(name) {
            let projectId = null;
            const parts = name.split('-');
            const prefix = parts.shift();
            const baseName = parts.shift();
            if (parts.length > 0) {
              projectId = parts.join('-');
            }
            return {
              prefix: prefix,
              baseName: baseName,
              projectId: projectId
            };
          });
        })
        .then(function(nameObjs) {
          // Fetch OfflineTable instances for old tables
          // and check if they are synced.
          return $q.all(
            nameObjs.map(function(nameObj) {
              return getTableByName(nameObj, retryCount === 0).then(function(
                table
              ) {
                return table.isSynced().then(function(isSynced) {
                  return {
                    table: table,
                    isSynced: isSynced,
                    projectId: nameObj.projectId
                  };
                });
              });
            })
          );
        })
        .then(function(syncObjs) {
          // Delete tables that are synced.
          const refreshTablePromises = [];
          syncObjs.forEach(function(syncObj) {
            if (syncObj.isSynced) {
              Dexie.delete(syncObj.table.name);
              if (syncObj.projectId != null) {
                ProjectService.loadProject(syncObj.projectId);
              }
            } else {
              refreshTablePromises.push(syncObj.table.refresh());
            }
          });
          return refreshTablePromises;
        })
        .then(function(refreshTablePromises) {
          // if tables had to be refreshed because they
          // weren't synced, run this whole process again.
          if (refreshTablePromises.length > 0) {
            retryCount = retryCount + 1;
            return syncAndDeleteV1Tables(retryCount);
          }
          return $q.resolve(true);
        });
    };

    var offlineutils = {
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
      getOfflineProjects: getOfflineProjects,
      getProjectTableNames: getProjectTableNames,
      loadLookupTables: loadLookupTables,
      projectIdFromTableName: projectIdFromTableName,
      syncAndDeleteV1Tables: syncAndDeleteV1Tables
    };

    return offlineutils;
  }
]);
