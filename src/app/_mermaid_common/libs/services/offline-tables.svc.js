angular.module('mermaid.libs').service('OfflineTables', [
  '$q',
  'OfflineTableUtils',
  'OfflineCommonTables',
  'utils',
  'connectivity',
  'authService',
  'OfflineTableSync',
  'APP_CONFIG',
  'ProjectSite',
  'ProjectManagement',
  'ProjectProfile',
  'CollectRecord',
  'SampleEvent',
  'SpatialUtils',
  'cache',
  'logger',
  function(
    $q,
    OfflineTableUtils,
    OfflineCommonTables,
    utils,
    connectivity,
    authService,
    OfflineTableSync,
    APP_CONFIG,
    ProjectSite,
    ProjectManagement,
    ProjectProfile,
    CollectRecord,
    SampleEvent,
    SpatialUtils,
    cache,
    logger
  ) {
    'use strict';

    let tablePromises = {};
    const deleteProjectPromises = {};
    const PROJECT_NAME = 'projects_v2';
    const PROJECT_SITES_NAME = 'projectsites';
    const PROJECT_MANAGEMENTS_NAME = 'projectmanagements';
    const PROJECT_PROFILES_NAME = 'project_profiles';
    const COLLECT_RECORDS_NAME = 'collectrecords';
    const SAMPLE_EVENTS_NAME = 'sampleevents';

    const PROJECT_TABLE_NAMES = [
      PROJECT_SITES_NAME,
      PROJECT_MANAGEMENTS_NAME,
      PROJECT_PROFILES_NAME,
      COLLECT_RECORDS_NAME,
      SAMPLE_EVENTS_NAME
    ];

    const getProjectsTableName = function() {
      return authService.getProfileId().then(function(profileId) {
        return `${
          APP_CONFIG.localDbName
        }${OfflineTableUtils.TABLE_NAME_DELIMITER}${PROJECT_NAME}${OfflineTableUtils.TABLE_NAME_DELIMITER}${profileId}`;
      });
    };

    const getProjectTableNames = function(projectId, baseNames) {
      let isMulti = true;

      baseNames = baseNames || PROJECT_TABLE_NAMES;

      if (angular.isArray(baseNames) === false) {
        baseNames = [baseNames];
        isMulti = false;
      }

      return authService.getProfileId().then(function(profileId) {
        const results = baseNames.map(function(baseName) {
          return `${
            APP_CONFIG.localDbName
          }${OfflineTableUtils.TABLE_NAME_DELIMITER}${baseName}${OfflineTableUtils.TABLE_NAME_DELIMITER}${profileId}${OfflineTableUtils.TABLE_NAME_DELIMITER}${projectId}`;
        });
        return isMulti === false ? results[0] : results;
      });
    };

    const getTableProjectIds = function() {
      return $q
        .all([authService.getProfileId(), OfflineTableUtils.getDatabaseNames()])
        .then(function(results) {
          const profileId = results[0];
          const names = results[1];
          const filteredList = _.filter(names, function(name) {
            const tableNameObj = OfflineTableUtils.splitTableName(name);
            return (
              tableNameObj.projectId && tableNameObj.profileId === profileId
            );
          });

          return Array.from(
            new Set(
              _.map(filteredList, OfflineTableUtils.getProjectIdFromTableName)
            )
          );
        });
    };

    const buildProjectRelatedRemoteUrl = function(resourceUrlName, projectId) {
      if (projectId == null) {
        throw 'Project (${projectId}) does not exist.';
      }
      return `${APP_CONFIG.apiUrl}projects/${projectId}/${resourceUrlName}/`;
    };

    const buildProjectRelatedTable = function(
      resource,
      resourceUrlName,
      projectId,
      tableName,
      options,
      skipRefresh
    ) {
      let remote_url;

      options = _.merge(options || {}, {
        queryArgs: { project_pk: projectId }
      });

      const tableNamePromise = getProjectTableNames(
        projectId,
        tableName,
        options.excludeProfileId
      );

      if (resourceUrlName) {
        remote_url = buildProjectRelatedRemoteUrl(resourceUrlName, projectId);
      }

      return tableNamePromise.then(function(name) {
        return OfflineTableUtils.createOfflineTable(
          name,
          remote_url,
          resource,
          options,
          _.isFunction(options.refresh)
            ? options.refresh
            : OfflineTableUtils.paginatedRefresh,
          skipRefresh
        );
      });
    };

    const ProjectsTable = function(skipRefresh) {
      const updatesUrl = APP_CONFIG.apiUrl + 'projects/updates/';
      const remoteUrl = APP_CONFIG.apiUrl + 'projects/';

      return getProjectsTableName().then(function(name) {
        const tableName = name;

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

        return OfflineTableUtils.createOfflineTable(
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
      });
    };

    const ProjectSitesTable = function(projectId, skipRefresh) {
      const convertToChoices = function(choicesName, choices) {
        const choicesSubset = _.filter(choices, { name: choicesName })[0];
        return _.reduce(
          choicesSubset.data,
          function(o, choice) {
            o[choice.id] = choice;
            return o;
          },
          {}
        );
      };
      const cacheKey = `ProjectSitesTable-${projectId}`;
      const table = cache.get(cacheKey);

      if (table) {
        return $q.resolve(table);
      }

      if (tablePromises[cacheKey]) {
        return tablePromises[cacheKey];
      }

      tablePromises[cacheKey] = OfflineCommonTables.ChoicesTable()
        .then(function(table) {
          return table.filter();
        })
        .then(function(choices) {
          const countryChoices = convertToChoices('countries', choices);
          const reefTypeChoices = convertToChoices('reeftypes', choices);
          const reefZoneChoices = convertToChoices('reefzones', choices);
          const reefExposuresChoices = convertToChoices(
            'reefexposures',
            choices
          );
          const regionsChoices = convertToChoices('regions', choices);
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
            projectId,
            PROJECT_SITES_NAME,
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
          )
            .then(function(table) {
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
                    utils.showAlert(
                      'Warning',
                      msg,
                      utils.statuses.warning,
                      5000
                    );
                  }
                },
                null,
                'site-del-error'
              );

              return table;
            })
            .then(function(table) {
              cache.set(cacheKey, table, 30000);
              tablePromises[cacheKey] = null;
              return table;
            });
        });
      return tablePromises[cacheKey];
    };

    const ProjectManagementsTable = function(projectId, skipRefresh) {
      return buildProjectRelatedTable(
        ProjectManagement,
        'managements',
        projectId,
        PROJECT_MANAGEMENTS_NAME,
        {},
        skipRefresh
      ).then(function(table) {
        table.$watch(
          function(event) {
            if (
              event.event === 'ot-deleterecord-error' &&
              event.data[1].status === 403
            ) {
              const msg = event.data[1].data || event.data[1].statusText;
              utils.showAlert('Warning', msg, utils.statuses.warning, 5000);
            }
          },
          null,
          'management-del-error'
        );
        return table;
      });
    };

    const ProjectProfilesTable = function(projectId, skipRefresh) {
      const projectProfilesRefresh = function(table, options) {
        if (connectivity.isOnline !== true) {
          return $q.resolve(table);
        }
        return OfflineTableUtils.paginatedRefresh(table, options).catch(
          function(err) {
            if (err.status === 403) {
              deleteProjectDatabases(projectId);
            }
            return err;
          }
        );
      };
      return buildProjectRelatedTable(
        ProjectProfile,
        'project_profiles',
        projectId,
        PROJECT_PROFILES_NAME,
        { refresh: projectProfilesRefresh },
        skipRefresh
      );
    };

    const CollectRecordsTable = function(projectId, skipRefresh) {
      return buildProjectRelatedTable(
        CollectRecord,
        'collectrecords',
        projectId,
        COLLECT_RECORDS_NAME,
        {},
        skipRefresh
      );
    };

    const SampleEventsTable = function(projectId, skipRefresh) {
      const projectSitesTablePromise = ProjectSitesTable(projectId, true);
      const projectManagementsTablePromise = ProjectManagementsTable(
        projectId,
        true
      );
      return $q
        .all([projectSitesTablePromise, projectManagementsTablePromise])
        .then(function(results) {
          const sitesTableName = results[0].name;
          const managementTableName = results[1].name;
          return buildProjectRelatedTable(
            SampleEvent,
            'sampleevents',
            projectId,
            SAMPLE_EVENTS_NAME,
            {
              joinDefn: {
                sites: `site -> ${sitesTableName}.id,name`,
                managements: `management -> ${managementTableName}.id,name`
              }
            },
            skipRefresh
          );
        });
    };

    const clearDatabases = function(projectId) {
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

    const deleteProjectDatabases = function(
      projectId,
      force,
      relatedDatabasesOnly
    ) {
      if (deleteProjectPromises[projectId] != null) {
        return deleteProjectPromises[projectId];
      }

      force = force || false;
      relatedDatabasesOnly = relatedDatabasesOnly || false;

      let tablesPromise;
      let projectDeletePromise;

      if (force) {
        tablesPromise = loadProjectRelatedTables(projectId, true);
      } else {
        tablesPromise = fetchProjectTablesForRemoval(projectId);
      }
      const tableRemovalPromise = tablesPromise.then(function(tables) {
        const deletePromises = _.map(tables, function(table) {
          const name = table.name;
          if (table.closeDbGroup) {
            table.closeDbGroup();
          } else {
            table.db.close();
          }
          return OfflineTableUtils.deleteDatabase(name).then(function() {
            return OfflineTableSync.removeLastAccessed(name);
          });
        });
        return $q.all(deletePromises);
      });

      if (relatedDatabasesOnly === true) {
        projectDeletePromise = $q.resolve();
      } else {
        projectDeletePromise = ProjectsTable().then(function(table) {
          return table.deleteRecords([projectId], true);
        });
      }

      deleteProjectPromises[projectId] = $q
        .all([projectDeletePromise, tableRemovalPromise])
        .finally(function() {
          delete deleteProjectPromises[projectId];
        });

      return deleteProjectPromises[projectId];
    };

    const deleteProjectsDatabase = function(force) {
      return ProjectsTable()
        .then(function(table) {
          if (force) {
            return table;
          } else {
            return OfflineTableUtils.isSynced([table]).then(function() {
              return table;
            });
          }
        })
        .then(function(table) {
          const name = table.name;
          if (table.closeDbGroup) {
            table.closeDbGroup();
          } else {
            table.db.close();
          }
          return OfflineTableUtils.deleteDatabase(name).then(function() {
            return OfflineTableSync.removeLastAccessed(name);
          });
        });
    };

    const fetchProjectTablesForRemoval = function(projectId) {
      return loadProjectRelatedTables(projectId, true).then(function(tables) {
        _.each(tables, function(table) {
          if (table.db.isOpen() === false) {
            table.db.open();
          }
        });

        return OfflineTableUtils.isSynced(tables).then(function(
          isTablesSynced
        ) {
          if (isTablesSynced === false) {
            return $q.reject('Offline table not saved to server.');
          }
          return tables;
        });
      });
    };

    const loadProjectRelatedTables = function(projectId, skipRefresh) {
      var promises = [
        ProjectSitesTable(projectId, skipRefresh),
        ProjectManagementsTable(projectId, skipRefresh),
        ProjectProfilesTable(projectId, skipRefresh),
        CollectRecordsTable(projectId, skipRefresh),
        SampleEventsTable(projectId, skipRefresh)
      ];
      return $q.all(promises);
    };

    return {
      PROJECT_TABLE_NAMES: PROJECT_TABLE_NAMES,
      CollectRecordsTable: CollectRecordsTable,
      SampleEventsTable: SampleEventsTable,
      ProjectsTable: ProjectsTable,
      ProjectManagementsTable: ProjectManagementsTable,
      ProjectProfilesTable: ProjectProfilesTable,
      ProjectSitesTable: ProjectSitesTable,
      clearDatabases: clearDatabases,
      deleteProjectDatabases: deleteProjectDatabases,
      deleteProjectsDatabase: deleteProjectsDatabase,
      fetchProjectTablesForRemoval: fetchProjectTablesForRemoval,
      getTableProjectIds: getTableProjectIds,
      getProjectsTableName: getProjectsTableName,
      getProjectTableNames: getProjectTableNames,
      loadProjectRelatedTables: loadProjectRelatedTables
    };
  }
]);
