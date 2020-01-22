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
    logger
  ) {
    'use strict';

    const deleteProjectPromises = {};
    const PROJECT_NAME = 'projects_v2';
    const PROJECT_SITES_NAME = 'projectsites';
    const PROJECT_MANAGEMENTS_NAME = 'projectmanagements';
    const PROJECT_PROFILES_NAME = 'project_profiles';
    const COLLECT_RECORDS_NAME = 'collectrecords';

    const PROJECT_TABLE_NAMES = [
      PROJECT_SITES_NAME,
      PROJECT_MANAGEMENTS_NAME,
      PROJECT_PROFILES_NAME,
      COLLECT_RECORDS_NAME
    ];

    let profileIdPromise = null;

    const getProfileId = function() {
      profileIdPromise = authService
        .getCurrentUser()
        .then(function(user) {
          return user.profile.id;
        })
        .finally(function() {
          profileIdPromise = null;
        });
      return profileIdPromise;
    };

    const getProjectTableName = function(excludeProfileId) {
      return getProfileId().then(function(profileId) {
        if (excludeProfileId === true) {
          return `${APP_CONFIG.localDbName}-projects_v2`;
        }
        return `${APP_CONFIG.localDbName}projects_v2-${profileId}`;
      });
    };

    const getProjectTableNames = function(
      projectId,
      baseNames,
      excludeProfileId
    ) {
      let isMulti = true;
      if (angular.isArray(baseNames) === false) {
        baseNames = [baseNames];
        isMulti = false;
      }

      return getProfileId().then(function(profileId) {
        const results = baseNames.map(function(baseName) {
          if (excludeProfileId === true) {
            return `${APP_CONFIG.localDbName}-${baseName}-${projectId}`;
          }
          return `${
            APP_CONFIG.localDbName
          }-${baseName}-${projectId}-${profileId}`;
        });
        return isMulti === false ? results[0] : results;
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

      tableName += '-' + projectId;
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
          APP_CONFIG.localDbName,
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

      return getProjectTableName().then(function(name) {
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

      return OfflineCommonTables.ChoicesTable()
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
        {
          joinDefn: {
            sites:
              'data.sample_event.site -> mermaid-projectsites-' +
              projectId +
              '.id, name',
            managements:
              'data.sample_event.management -> mermaid-projectmanagements-' +
              projectId +
              '.id, name'
          }
        },
        skipRefresh
      );
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

    const deleteProjectDatabases = function(projectId, force) {
      throw 'TODO Refactor deleteProjectDatabases';
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
            return OfflineTableUtils.deleteDatabase(name).then(function() {
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

    const fetchProjectTablesForRemoval = function(projectId) {
      return loadProjectRelatedTables(projectId, true).then(function(tables) {
        return $q
          .all(
            _.map(tables, function(table) {
              return table.isSynced();
            })
          )
          .then(function(syncedResults) {
            if (syncedResults.indexOf(false) !== -1) {
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
        CollectRecordsTable(projectId, skipRefresh)
      ];
      return $q.all(promises);
    };

    return {
      PROJECT_TABLE_NAMES: PROJECT_TABLE_NAMES,
      CollectRecordsTable: CollectRecordsTable,
      ProjectsTable: ProjectsTable,
      ProjectManagementsTable: ProjectManagementsTable,
      ProjectProfilesTable: ProjectProfilesTable,
      ProjectSitesTable: ProjectSitesTable,
      clearDatabases: clearDatabases,
      fetchProjectTablesForRemoval: fetchProjectTablesForRemoval,
      getProjectTableName: getProjectTableName,
      getProjectTableNames: getProjectTableNames,
      loadProjectRelatedTables: loadProjectRelatedTables
    };
  }
]);
