angular
  .module('app.project')

  .service('ProjectService', [
    'FISH_BELT_TRANSECT_TYPE',
    'BENTHIC_LIT_TRANSECT_TYPE',
    'BENTHIC_PIT_TRANSECT_TYPE',
    'HABITAT_COMPLEXITY_TRANSECT_TYPE',
    'BLEACHING_QC_QUADRAT_TYPE',
    'BENTHIC_PQT_TYPE',
    '$http',
    '$q',
    '$filter',
    'authService',
    'OfflineTableUtils',
    'APP_CONFIG',
    'OfflineTables',
    'OfflineCommonTables',
    'blockUI',
    function(
      FISH_BELT_TRANSECT_TYPE,
      BENTHIC_LIT_TRANSECT_TYPE,
      BENTHIC_PIT_TRANSECT_TYPE,
      HABITAT_COMPLEXITY_TRANSECT_TYPE,
      BLEACHING_QC_QUADRAT_TYPE,
      BENTHIC_PQT_TYPE,
      $http,
      $q,
      $filter,
      authService,
      OfflineTableUtils,
      APP_CONFIG,
      OfflineTables,
      OfflineCommonTables,
      blockUI
    ) {
      'use strict';
      var ProjectService = {};
      var mermaidChoices = {};
      ProjectService.ADMIN_ROLE = 'admin';
      ProjectService.COLLECTOR_ROLE = 'collector';
      ProjectService.READONLY_ROLE = 'readonly';
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
          id: FISH_BELT_TRANSECT_TYPE,
          name: 'Fish Belt',
          state: 'app.project.records.collectfishbelt',
          submittedState:
            'app.project.submittedtransects.fishbelttransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_belt_fishes'
          ],
          obsFields: ['data.obs_belt_fishes'],
          method: 'obstransectbeltfishes',
          reportProtocol: 'beltfishes'
        },
        {
          id: BENTHIC_LIT_TRANSECT_TYPE,
          name: 'Benthic LIT',
          state: 'app.project.records.collectbenthiclit',
          submittedState:
            'app.project.submittedtransects.benthiclittransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_benthic_lits'
          ],
          obsFields: ['data.obs_benthic_lits'],
          method: 'obstransectbenthiclits',
          reportProtocol: 'benthiclits'
        },
        {
          id: BENTHIC_PIT_TRANSECT_TYPE,
          name: 'Benthic PIT',
          state: 'app.project.records.collectbenthicpit',
          submittedState:
            'app.project.submittedtransects.benthicpittransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_benthic_pits'
          ],
          obsFields: ['data.obs_benthic_pits'],
          method: 'obstransectbenthicpits',
          reportProtocol: 'benthicpits'
        },
        {
          id: HABITAT_COMPLEXITY_TRANSECT_TYPE,
          name: 'Habitat Complexity',
          state: 'app.project.records.collecthabitatcomplexity',
          submittedState:
            'app.project.submittedtransects.habitatcomplexitytransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_habitat_complexities'
          ],
          obsFields: ['data.obs_habitat_complexities'],
          method: 'obshabitatcomplexities',
          reportProtocol: 'habitatcomplexities'
        },
        {
          id: BLEACHING_QC_QUADRAT_TYPE,
          name: 'Bleaching',
          reportNames: ['Colonies Bleached', 'Quadrat Percentage'],
          state: 'app.project.records.collectbleaching',
          submittedState:
            'app.project.submittedtransects.bleachingquadratcollectionmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_colonies_bleached',
            'data.obs_quadrat_benthic_percent'
          ],
          obsFields: [
            'data.obs_colonies_bleached',
            'data.obs_quadrat_benthic_percent'
          ],
          methods: ['obscoloniesbleacheds', 'obsquadratbenthicpercents'],
          reportProtocol: 'bleachingqcs'
        },
        {
          id: BENTHIC_PQT_TYPE,
          name: 'Benthic Photo Quadrat',
          state: 'app.project.records.collectbenthicpqt',
          submittedState:
            'app.project.submittedtransects.benthicpqttransectmethod',
          fields: [
            'data.sample_event.sample_date',
            'data.sample_event.sample_time',
            'data.obs_benthic_photo_quadrats'
          ],
          obsFields: ['data.obs_benthic_photo_quadrats'],
          method: 'obstransectbenthicpqts',
          reportProtocol: 'benthicpqts'
        }
      ];

      ProjectService.getObservationAttributeNames = function(record) {
        const obsFields = _.flatten(
          _.map(ProjectService.transect_types, 'obsFields')
        );
        const matchedObsFields = [];
        for (let i = 0; i < obsFields.length; i++) {
          const obsFieldName = obsFields[i];
          const hasKey = _.has(record, obsFieldName);
          if (hasKey === true) {
            matchedObsFields.push(obsFieldName);
          }
        }
        return matchedObsFields;
      };

      var formatChoices = function(table) {
        // Format choices
        if (table != null) {
          table.filter().then(function(records) {
            for (var i = 0; i < records.length; i++) {
              mermaidChoices[records[i].name] = records[i].data;
            }
          });
        }
      };

      ProjectService.loadLookupTables = function() {
        return OfflineCommonTables.loadLookupTables().then(function(tables) {
          // Format choices
          var choicesTable = _.find(tables, {
            name: APP_CONFIG.localDbName + '-choices'
          });
          formatChoices(choicesTable);
        });
      };

      const loadProject = function(projectId) {
        var promises = [];
        if (projectId != null) {
          promises.push(OfflineTables.loadProjectRelatedTables(projectId));
        } else {
          promises.push($q.resolve(null));
        }

        promises.push(OfflineCommonTables.loadLookupTables());
        return $q.all(promises);
      };

      ProjectService.getTransectType = function(transect_type_id) {
        for (let i = 0; i < ProjectService.transect_types.length; i++) {
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
        let isProjectOfflinePromise;
        if (projectId != null) {
          isProjectOfflinePromise = ProjectService.isProjectOffline(projectId);
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
        return OfflineCommonTables.ChoicesTable().then(function(table) {
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
          OfflineTables.ProjectProfilesTable(project_id)
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

      ProjectService.setupFormDataPolicies = function(
        scope,
        dataPolicyChoices
      ) {
        scope.dataPolicies = dataPolicyChoices;
        var policyLookup = _.reduce(
          dataPolicyChoices,
          function(o, v) {
            o[v.id] = v.description;
            return o;
          },
          {}
        );

        var policyNameLookup = _.reduce(
          dataPolicyChoices,
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
      /** Filter attributes by site by matching regions.
       * @param  {Array} attributes: Array of attributes to filter
       * @param  {String} siteId: Filter attributes by this site id
       * @param  {Object} choices: List of sites choices, `choices.sites`
       */
      ProjectService.filterAttributesBySite = function(
        attributes,
        siteId,
        choices
      ) {
        if (siteId == null || _.has(choices, 'sites') === false) {
          return attributes;
        }

        // There should be none or 1 site region.
        const siteRegion = $filter('matchchoice')(
          siteId,
          choices.sites,
          '$$regions'
        );

        if (siteRegion === null || _.keys(siteRegion).length === 0) {
          return attributes;
        }

        // If attribute does not have a region it should be included,
        // else only include attributes where at least one
        // attribute region matches site region.
        return _.filter(attributes, function(attribute) {
          const attributeRegions = attribute.regions || [];
          if (attributeRegions.length === 0) {
            return true;
          }
          return attributeRegions.indexOf(siteRegion.id) !== -1;
        });
      };

      ProjectService.isProjectOffline = function(projectId) {
        if (projectId == null) {
          throw 'projectId is required';
        }

        const databaseNamesPromise = OfflineTableUtils.getDatabaseNames();
        const projectTableNamePromise = OfflineTables.getProjectsTableName();
        const projectTableNamesPromise = OfflineTables.getProjectTableNames(
          projectId,
          OfflineTables.PROJECT_TABLE_NAMES
        );
        const commonTableNamesPromise = OfflineCommonTables.getTableNames();
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
