angular
  .module('app.project')

  .service('ProjectService', [
    '$http',
    '$q',
    'authService',
    'OfflineTableUtils',
    'utils',
    'APP_CONFIG',
    'OfflineTables',
    'OfflineCommonTables',
    'blockUI',
    function(
      $http,
      $q,
      authService,
      OfflineTableUtils,
      utils,
      APP_CONFIG,
      OfflineTables,
      OfflineCommonTables,
      blockUI
    ) {
      'use strict';
      const ProjectService = {};
      ProjectService.ADMIN_ROLE = 'admin';
      ProjectService.COLLECTOR_ROLE = 'collector';
      ProjectService.READONLY_ROLE = 'readonly';
      ProjectService.FISH_BELT_TRANSECT_TYPE = 'fishbelt';
      ProjectService.BENTHIC_LIT_TRANSECT_TYPE = 'benthiclit';
      ProjectService.BENTHIC_PIT_TRANSECT_TYPE = 'benthicpit';
      ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE = 'habitatcomplexity';
      ProjectService.BLEACHING_QC_QUADRAT_TYPE = 'bleachingqc';
      ProjectService.benthicAttributes = [];
      ProjectService.fishAttributes = [];
      ProjectService.fishGenera = [];
      ProjectService.fishFamilies = [];
      ProjectService.SAVING_STAGE = 3;
      ProjectService.SAVED_STAGE = 5;
      ProjectService.VALIDATING_STAGE = 10;
      ProjectService.VALIDATED_STAGE = 15;
      ProjectService.SUBMITTING_STAGE = 20;
      ProjectService.SUBMITTED_STAGE = 25;
      ProjectService.PRIVATE_DATA_POLICY = 10;
      ProjectService.DEFAULT_DATA_POLICY = 50;
      ProjectService.PUBLIC_DATA_POLICY = 100;

      ProjectService.user_roles = [
        {
          id: ProjectService.ADMIN_ROLE,
          name: 'project administrator'
        },
        {
          id: ProjectService.COLLECTOR_ROLE,
          name: 'data collector'
        },
        {
          id: ProjectService.READONLY_ROLE,
          name: 'read-only user'
        }
      ];

      ProjectService.transect_types = [
        {
          id: ProjectService.FISH_BELT_TRANSECT_TYPE,
          name: 'Fish Belt',
          state: 'app.project.records.collectfishbelt',
          submittedState:
            'app.project.submittedtransects.fishbelttransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_belt_fishes'
          ],
          method: 'beltfishtransectmethods',
          protocol: 'fishbelt'
        },
        {
          id: ProjectService.BENTHIC_LIT_TRANSECT_TYPE,
          name: 'Benthic LIT',
          state: 'app.project.records.collectbenthiclit',
          submittedState:
            'app.project.submittedtransects.benthiclittransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_benthic_lits'
          ],
          method: 'benthiclittransectmethods',
          protocol: 'benthiclit'
        },
        {
          id: ProjectService.BENTHIC_PIT_TRANSECT_TYPE,
          name: 'Benthic PIT',
          state: 'app.project.records.collectbenthicpit',
          submittedState:
            'app.project.submittedtransects.benthicpittransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_benthic_pits'
          ],
          method: 'benthicpittransectmethods',
          protocol: 'benthicpit'
        },
        {
          id: ProjectService.HABITAT_COMPLEXITY_TRANSECT_TYPE,
          name: 'Habitat Complexity',
          state: 'app.project.records.collecthabitatcomplexity',
          submittedState:
            'app.project.submittedtransects.habitatcomplexitytransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_habitat_complexities'
          ],
          method: 'habitatcomplexitytransectmethods',
          protocol: 'habitatcomplexity'
        },
        {
          id: ProjectService.BLEACHING_QC_QUADRAT_TYPE,
          name: 'Bleaching',
          state: 'app.project.records.collectbleaching',
          submittedState:
            'app.project.submittedtransects.bleachingquadratcollectionmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_colonies_bleached',
            'data.obs_quadrat_benthic_percent'
          ],
          method: 'bleachingquadratcollectionmethods',
          protocol: ProjectService.BLEACHING_QC_QUADRAT_TYPE
        }
      ];

      var formatChoices = function(table) {
        // Format choices
        if (table != null) {
          table.filter().then(function(records) {
            for (var i = 0; i < records.length; i++) {
              utils.choices[records[i].name] = records[i].data;
            }
          });
        }
      };

      ProjectService.loadLookupTables = function() {
        return OfflineTableUtils.loadLookupTables().then(function(tables) {
          // Format choices
          var choicesTable = _.find(tables, {
            name: APP_CONFIG.localDbName + '-choices'
          });
          formatChoices(choicesTable);
        });
      };

      var loadProject = function(projectId) {
        var promises = [];
        if (projectId != null) {
          promises.push(OfflineTableUtils.loadProjectRelatedTables(projectId));
        } else {
          promises.push($q.resolve(null));
        }

        promises.push(ProjectService.loadLookupTables());
        return $q.all(promises);
      };

      ProjectService.getTransectType = function(transect_type_id) {
        for (var i = 0; i < ProjectService.transect_types.length; i++) {
          if (ProjectService.transect_types[i].id === transect_type_id) {
            return ProjectService.transect_types[i];
          }
        }
        return null;
      };

      ProjectService.isFormDisabled = function(projectProfile, minAccess) {
        var access_denied = true;
        var min_access =
          _.find(ProjectService.user_roles, { id: minAccess }).id ||
          ProjectService.ADMIN_ROLE;
        if (min_access == ProjectService.ADMIN_ROLE) {
          access_denied = projectProfile.is_admin !== true;
        } else if (min_access == ProjectService.COLLECTOR_ROLE) {
          access_denied =
            projectProfile.is_admin !== true &&
            projectProfile.is_collector !== true;
        }
        return !projectProfile || access_denied;
      };

      ProjectService.loadProject = function(projectId) {
        var isProjectOfflinePromise;
        if (projectId != null) {
          isProjectOfflinePromise = OfflineTableUtils.isProjectOffline(
            projectId
          );
        } else {
          isProjectOfflinePromise = $q.resolve(true);
        }

        return isProjectOfflinePromise.then(function(projectOffline) {
          if (projectOffline !== true) {
            blockUI.start();
            return loadProject(projectId).finally(function() {
              blockUI.stop();
            });
          }
          return loadProject(projectId);
        });
      };

      ProjectService.fetchChoices = function() {
        return OfflineTableUtils.ChoicesTable().then(function(table) {
          return table.filter().then(function(choices) {
            return _.reduce(
              choices,
              function(choices, c) {
                choices[c.name] = c.data;
                return choices;
              },
              {}
            );
          });
        });
      };

      ProjectService.getMyProjectProfile = function(project_id) {
        var promises = [
          authService.getCurrentUser(),
          OfflineTableUtils.ProjectProfilesTable(project_id)
        ];

        return $q
          .all(promises)
          .then(function(responses) {
            var profile = responses[0];
            var table = responses[1];
            var qry = { project: project_id, profile: profile.id };
            return table.filter(qry);
          })
          .then(function(records) {
            records = records || [];
            if (records.length === 1) {
              return records[0];
            }
            return null;
          })
          .catch(function(err) {
            console.error(err);
            throw err;
          });
      };

      ProjectService.getFishAttributes = function() {
        return ProjectService.fishAttributes;
      };

      ProjectService.getBenthicAttributes = function() {
        return ProjectService.benthicAttributes;
      };

      ProjectService.getFishFamilies = function() {
        return ProjectService.fishFamilies;
      };

      ProjectService.getFishGenera = function() {
        return ProjectService.fishGenera;
      };

      ProjectService.refreshTable = function(projectId, projectTableFx) {
        return projectTableFx(projectId).then(function(table) {
          return table.refresh();
        });
      };

      ProjectService.replaceObjs = function(
        projectId,
        replaceEndpoint,
        find,
        replace
      ) {
        var replaceUrl =
          APP_CONFIG.apiUrl + 'projects/' + projectId + replaceEndpoint;
        var data = { find: find, replace: replace };
        return $http.put(replaceUrl, data);
      };

      ProjectService.setupFormDataPolicies = function(scope, choices) {
        scope.dataPolicies = choices;
        var policyLookup = _.reduce(
          choices,
          function(o, v) {
            o[v.id] = v.description;
            return o;
          },
          {}
        );

        var policyNameLookup = _.reduce(
          choices,
          function(o, v) {
            o[v.id] = v.name;
            return o;
          },
          {}
        );

        // default data policy (not necessarily that of the API)
        if (!angular.isDefined(scope.project.data_policy)) {
          scope.project.data_policy = ProjectService.DEFAULT_DATA_POLICY;
        }

        scope.private_data_policy = {
          name: policyNameLookup[ProjectService.PRIVATE_DATA_POLICY] || '',
          description: policyLookup[ProjectService.PRIVATE_DATA_POLICY] || ''
        };
        scope.public_summary_data_policy = {
          name: policyNameLookup[ProjectService.DEFAULT_DATA_POLICY] || '',
          description: policyLookup[ProjectService.DEFAULT_DATA_POLICY] || ''
        };
        scope.public_data_policy = {
          name: policyNameLookup[ProjectService.PUBLIC_DATA_POLICY] || '',
          description: policyLookup[ProjectService.PUBLIC_DATA_POLICY] || ''
        };
        scope.$watch('project.data_policy_beltfish', function() {
          scope.fishbeltPolicy =
            policyNameLookup[scope.project.data_policy_beltfish] ||
            policyNameLookup[ProjectService.DEFAULT_DATA_POLICY];
        });
        scope.$watch('project.data_policy_benthiclit', function() {
          scope.benthicsPolicy =
            policyNameLookup[scope.project.data_policy_benthiclit] ||
            policyNameLookup[ProjectService.DEFAULT_DATA_POLICY];
        });
        scope.$watch('project.data_policy_bleachingqc', function() {
          scope.bleachingPolicy =
            policyNameLookup[scope.project.data_policy_bleachingqc] ||
            policyNameLookup[ProjectService.DEFAULT_DATA_POLICY];
        });
      };

      ProjectService.transferSampleUnitOwnership = function(
        projectId,
        fromProfileId,
        toProfileId
      ) {
        var transformOwnershipUrl =
          APP_CONFIG.apiUrl +
          'projects/' +
          projectId +
          '/transfer_sample_units/';
        var data = { from_profile: fromProfileId, to_profile: toProfileId };
        return $http.put(transformOwnershipUrl, data);
      };

      ProjectService.isProjectOffline = function(projectId) {
        if (projectId == null) {
          throw 'projectId is required';
        }

        const databaseNamesPromise = OfflineTableUtils.getDatabaseNames();
        const projectTableNamePromise = OfflineTables.getProjectTableName();
        const projectTableNamesPromise = OfflineTables.getProjectTableNames(
          OfflineTables.PROJECT_TABLE_NAMES
        );
        const commonTableNamesPromise = OfflineCommonTables.getTableNames(
          OfflineTables.TABLE_NAMES
        );
        const projectRecordPromise = OfflineTables.ProjectsTable(true).then(
          function(table) {
            return table.get(projectId).then(function(record) {
              return record !== null;
            });
          }
        );

        return $q
          .all([
            databaseNamesPromise,
            projectTableNamePromise,
            projectTableNamesPromise,
            commonTableNamesPromise,
            projectRecordPromise
          ])
          .then(function(results) {
            const databaseNames = new Set(results[0]);
            const tables = [results[1]].concat(results[2], results[3]);
            const projectRecord = results[4];

            for (let i = 0; i < tables.length; i++) {
              if (databaseNames.has(tables[i]) === false) {
                return false;
              }
            }
            return projectRecord !== null;
          });
      };

      ProjectService.getOfflineProjects = function() {
        return OfflineTables.ProjectsTable(true)
          .then(function(table) {
            return table.filter();
          })
          .then(function(projects) {
            return $q.all(
              _.map(projects, function(project) {
                const projectId = project.id;
                return ProjectService.isProjectOffline(projectId).then(function(
                  isOffline
                ) {
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

      return ProjectService;
    }
  ]);
