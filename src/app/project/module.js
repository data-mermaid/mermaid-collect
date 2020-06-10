'use strict';

angular
  .module('app.project', ['ui.router'])

  .config(function($stateProvider) {
    const _checkUuid = function($q, utils, id) {
      var deferred = $q.defer();
      if (id === '' || utils.isUuid(id)) {
        deferred.resolve(true);
      } else {
        deferred.reject({
          code: 400,
          detail: id + ' is not a valid uuid. Please check the url.'
        });
      }
      return deferred.promise;
    };

    const _checkId = function() {
      return [
        '$stateParams',
        '$q',
        'utils',
        function($stateParams, $q, utils) {
          const id = $stateParams.id;
          return _checkUuid($q, utils, id).then(
            function(response) {
              return $q.resolve(response);
            },
            function(rejection) {
              return $q.reject(rejection);
            }
          );
        }
      ];
    };

    const _loadProject = function() {
      return [
        '$stateParams',
        'ProjectService',
        '$q',
        'utils',
        function($stateParams, ProjectService, $q, utils) {
          const project_id = $stateParams.project_id;
          return _checkUuid($q, utils, project_id).then(
            function() {
              return ProjectService.loadProject(project_id);
            },
            function(rejection) {
              return $q.reject(rejection);
            }
          );
        }
      ];
    };

    const _backgroundLoadChoices = function($q, ProjectService) {
      ProjectService.loadLookupTables();
      return $q.resolve(true);
    };

    const _fetchDataPolicyChoices = function($q, ProjectService) {
      return ProjectService.fetchChoices().then(function(choices) {
        return choices.datapolicies;
      });
    };

    const _getMyProjectProfile = function($q, $stateParams, ProjectService) {
      return ProjectService.getMyProjectProfile($stateParams.project_id).then(
        function(projectProfile) {
          if (projectProfile === null) {
            return $q.reject('Project profile is null');
          }
          return projectProfile;
        }
      );
    };

    const _getNonAdminCollectorProfile = function(
      $stateParams,
      ProjectService
    ) {
      return ProjectService.getMyProjectProfile($stateParams.project_id).then(
        function(projectProfile) {
          return (
            !projectProfile ||
            (projectProfile.is_admin !== true &&
              projectProfile.is_collector !== true)
          );
        }
      );
    };

    const _fetchCurrentUser = function(authService) {
      return authService.getCurrentUser();
    };

    const _fetchCollectRecord = function($stateParams, OfflineTables) {
      return OfflineTables.CollectRecordsTable($stateParams.project_id).then(
        function(table) {
          return table.get($stateParams.id);
        }
      );
    };

    const _fetchTransectLookups = function($stateParams, TransectService) {
      return TransectService.getLookups($stateParams.project_id);
    };

    const _getProject = function($stateParams, OfflineTables, $q) {
      const projectId = $stateParams.project_id;
      return OfflineTables.ProjectsTable().then(function(table) {
        if (projectId == null) {
          return $q.resolve({});
        }
        return table.get(projectId).then(function(record) {
          return record;
        });
      });
    };

    const _getProjectsTable = function(OfflineTables) {
      return OfflineTables.ProjectsTable();
    };

    const checkAuthentication = function($transition$) {
      const authService = $transition$.injector().get('authService');
      if (!authService.isAuthenticated()) {
        return authService.login();
      }
    };

    const _getChoices = function(ProjectService) {
      return ProjectService.fetchChoices().then(function(choices) {
        return choices;
      });
    };

    $stateProvider
      .state('app.project', {
        abstract: true,
        url: '/projects/:project_id',
        data: {
          title: 'Project',
          breadcrumbsTemplate:
            'app/project/partials/project-breadcrumbs.tpl.html'
        },
        resolve: {
          loadProject: _loadProject(),
          watchers: function($q, $stateParams, ValidateDuplicationService) {
            var projectId = $stateParams.project_id;
            ValidateDuplicationService.watchSites(projectId);
            ValidateDuplicationService.watchMRs(projectId);
            return $q.resolve();
          }
        }
      })
      .state('fullapp.projects', {
        url: '/projects',
        onEnter: checkAuthentication,
        data: {
          title: 'Projects'
        },
        views: {
          'content@fullapp': {
            templateUrl: 'app/project/partials/projects.tpl.html',
            controller: 'ProjectsCtrl'
          }
        },
        resolve: {
          backgroundLoadChoices: _backgroundLoadChoices,
          dataPolicies: _fetchDataPolicyChoices
        }
      })
      .state('fullapp.project', {
        url: '/startproject',
        onEnter: checkAuthentication,
        data: {
          title: 'New Project'
        },
        params: {
          projectId: null
        },
        views: {
          'content@fullapp': {
            templateUrl: 'app/project/partials/project-wizard.tpl.html',
            controller: 'ProjectWizardCtrl'
          }
        },
        resolve: {
          backgroundLoadChoices: _backgroundLoadChoices,
          tags: function(TagService) {
            return TagService.fetchTags();
          }
        }
      })
      .state('fullapp.contact', {
        url: '/contact',
        onEnter: checkAuthentication,
        data: {
          title: 'Contact MERMAID'
        },
        views: {
          'content@fullapp': {
            templateUrl: 'app/project/partials/contact.tpl.html',
            controller: 'ContactCtrl'
          }
        }
      })
      .state('app.project.project', {
        url: '/details',
        onEnter: checkAuthentication,
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/project.tpl.html',
            controller: 'ProjectCtrl'
          }
        },
        resolve: {
          tags: function(TagService) {
            return TagService.fetchTags();
          },
          projectsTable: _getProjectsTable,
          project: _getProject,
          projectProfile: _getMyProjectProfile,
          dataPolicies: _fetchDataPolicyChoices
        }
      })
      .state('app.project.datasharing', {
        url: '/datasharing',
        onEnter: checkAuthentication,
        data: {
          title: 'Data Sharing'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/datasharing.tpl.html',
            controller: 'ProjectCtrl'
          }
        },
        resolve: {
          tags: function(TagService) {
            return TagService.fetchTags();
          },
          projectsTable: _getProjectsTable,
          project: _getProject,
          projectProfile: _getMyProjectProfile,
          dataPolicies: _fetchDataPolicyChoices
        }
      })
      .state('app.project.sites', {
        url: '/sites',
        onEnter: checkAuthentication,
        data: {
          title: 'Sites'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/sites.tpl.html',
            controller: 'SitesCtrl'
          }
        },
        resolve: {
          project: _getProject,
          notAdminCollectorProfile: _getNonAdminCollectorProfile
        }
      })
      .state('app.project.sites.site', {
        url: '/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Site',
          parentStates: ['app.project.sites']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/site.tpl.html',
            controller: 'SiteCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          project: _getProject,
          projectProfile: _getMyProjectProfile,
          site: function($stateParams, SiteService) {
            const projectId = $stateParams.project_id;
            const siteId = $stateParams.id;
            return SiteService.fetchData(projectId, siteId);
          },
          choices: _getChoices
        }
      })
      .state('app.project.managements', {
        url: '/managements',
        onEnter: checkAuthentication,
        data: {
          title: 'Management Regimes'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/managements.tpl.html',
            controller: 'ManagementsCtrl'
          }
        },
        resolve: {
          project: _getProject,
          notAdminCollectorProfile: _getNonAdminCollectorProfile
        }
      })
      .state('app.project.managements.management', {
        url: '/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Management Regime',
          parentStates: ['app.project.managements']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/management.tpl.html',
            controller: 'ManagementCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          project: _getProject,
          projectProfile: _getMyProjectProfile,
          management: function($stateParams, ManagementService) {
            const projectId = $stateParams.project_id;
            const managementId = $stateParams.id;
            return ManagementService.fetchData(projectId, managementId);
          },
          choices: _getChoices
        }
      })
      .state('app.project.submittedtransects.fishbelttransectmethod', {
        url: '/fishbelttransectmethods/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Fish Belt',
          parentStates: ['app.project.submittedtransects']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'BeltFishTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          fishAttributes: function(FishAttributeService) {
            return FishAttributeService.fetchFishAttributes();
          },
          record: function($stateParams, BeltFishTransectMethod) {
            return BeltFishTransectMethod.get({
              project_pk: $stateParams.project_id,
              id: $stateParams.id
            }).$promise.then(function(beltFishRecord) {
              const record = { data: beltFishRecord };
              return record;
            });
          },
          transectLookups: _fetchTransectLookups,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records.collectfishbelt', {
        url: '/fishbelt/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Fish Belt',
          parentStates: ['app.project.records']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'CollectBeltFishTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          fishAttributes: function(FishAttributeService) {
            return FishAttributeService.fetchFishAttributes();
          },
          collectRecord: _fetchCollectRecord,
          transectLookups: _fetchTransectLookups,
          currentUser: _fetchCurrentUser,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.submittedtransects.benthiclittransectmethod', {
        url: '/benthiclittransectmethods/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Benthic LIT',
          parentStates: ['app.project.submittedtransects']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'BenthicLitTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          benthicAttributes: function(BenthicAttributeService) {
            return BenthicAttributeService.fetchBenthicAttributes();
          },
          record: function($stateParams, utils, BenthicLitTransectMethod) {
            return BenthicLitTransectMethod.get({
              project_pk: $stateParams.project_id,
              id: $stateParams.id
            }).$promise.then(function(benthicLitRecord) {
              const record = { data: benthicLitRecord };
              utils.assignUniqueId(
                _.get(record.data, 'obs_benthic_lits') || []
              );
              return record;
            });
          },
          transectLookups: _fetchTransectLookups,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records.collectbenthiclit', {
        url: '/benthiclit/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Benthic LIT',
          parentStates: ['app.project.records']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'CollectBenthicLitTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          benthicAttributes: function(BenthicAttributeService) {
            return BenthicAttributeService.fetchBenthicAttributes();
          },
          collectRecord: _fetchCollectRecord,
          transectLookups: _fetchTransectLookups,
          currentUser: _fetchCurrentUser,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.submittedtransects.benthicpittransectmethod', {
        url: '/benthicpittransectmethods/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Benthic PIT',
          parentStates: ['app.project.submittedtransects']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'BenthicPitTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          benthicAttributes: function(BenthicAttributeService) {
            return BenthicAttributeService.fetchBenthicAttributes();
          },
          record: function($stateParams, utils, BenthicPitTransectMethod) {
            return BenthicPitTransectMethod.get({
              project_pk: $stateParams.project_id,
              id: $stateParams.id
            }).$promise.then(function(benthicPitRecord) {
              const record = { data: benthicPitRecord };
              utils.assignUniqueId(
                _.get(record.data, 'obs_benthic_pits') || []
              );
              return record;
            });
          },
          transectLookups: _fetchTransectLookups,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records.collectbenthicpit', {
        url: '/benthicpit/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Benthic PIT',
          parentStates: ['app.project.records']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'CollectBenthicPitTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          benthicAttributes: function(BenthicAttributeService) {
            return BenthicAttributeService.fetchBenthicAttributes();
          },
          collectRecord: _fetchCollectRecord,
          transectLookups: _fetchTransectLookups,
          currentUser: _fetchCurrentUser,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.submittedtransects.habitatcomplexitytransectmethod', {
        url: '/habitatcomplexitytransectmethods/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Habitat Complexity',
          parentStates: ['app.project.submittedtransects']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'HabitatComplexityTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          record: function(
            $stateParams,
            utils,
            HabitatComplexityTransectMethod
          ) {
            return HabitatComplexityTransectMethod.get({
              project_pk: $stateParams.project_id,
              id: $stateParams.id
            }).$promise.then(function(habitatRecord) {
              const record = { data: habitatRecord };
              utils.assignUniqueId(
                _.get(record.data, 'obs_habitat_complexities') || []
              );
              return record;
            });
          },
          transectLookups: _fetchTransectLookups,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records.collecthabitatcomplexity', {
        url: '/habitatcomplexity/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Habitat Complexity',
          parentStates: ['app.project.records']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'CollectHabitatComplexityTransectMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          collectRecord: _fetchCollectRecord,
          transectLookups: _fetchTransectLookups,
          currentUser: _fetchCurrentUser,
          projectProfile: _getMyProjectProfile
        }
      })
      .state(
        'app.project.submittedtransects.bleachingquadratcollectionmethod',
        {
          url: '/bleachingqcmethods/:id',
          onEnter: checkAuthentication,
          data: {
            title: 'Bleaching',
            parentStates: ['app.project.submittedtransects']
          },
          views: {
            'content@app': {
              templateUrl: 'app/project/partials/protocol.tpl.html',
              controller: 'BleachingQuadCollMethodCtrl'
            }
          },
          resolve: {
            checkId: _checkId(),
            benthicAttributes: function(BenthicAttributeService) {
              return BenthicAttributeService.fetchBenthicAttributes();
            },
            record: function(
              $stateParams,
              utils,
              BleachingQuadratCollectionMethod
            ) {
              return BleachingQuadratCollectionMethod.get({
                project_pk: $stateParams.project_id,
                id: $stateParams.id
              }).$promise.then(function(bleachingRecord) {
                const record = { data: bleachingRecord };
                utils.assignUniqueId(
                  _.get(record.data, 'obs_quadrat_benthic_percent') || []
                );
                utils.assignUniqueId(
                  _.get(record.data, 'obs_colonies_bleached') || []
                );
                return record;
              });
            },
            transectLookups: _fetchTransectLookups,
            projectProfile: _getMyProjectProfile
          }
        }
      )
      .state('app.project.records.collectbleaching', {
        url: '/bleachingqc/:id',
        onEnter: checkAuthentication,
        data: {
          title: 'Bleaching',
          parentStates: ['app.project.records']
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/protocol.tpl.html',
            controller: 'CollectBleachingQuadCollMethodCtrl'
          }
        },
        resolve: {
          checkId: _checkId(),
          benthicAttributes: function(BenthicAttributeService) {
            return BenthicAttributeService.fetchBenthicAttributes();
          },
          collectRecord: _fetchCollectRecord,
          transectLookups: _fetchTransectLookups,
          currentUser: _fetchCurrentUser,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records', {
        url: '/collect',
        onStart: checkAuthentication,
        data: {
          title: 'Collecting'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/collect-records.tpl.html',
            controller: 'CollectRecordsCtrl'
          }
        },
        resolve: {
          projectProfile: _getMyProjectProfile,
          beltTransectWidthChoices: function(ProjectService) {
            return ProjectService.fetchChoices().then(function(choices) {
              return choices.belttransectwidths;
            });
          }
        }
      })
      .state('app.project.users', {
        url: '/users',
        onEnter: checkAuthentication,
        data: {
          title: 'Users'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/users.tpl.html',
            controller: 'UsersCtrl'
          }
        }
      })
      .state('app.project.submittedtransects', {
        url: '/transectmethods',
        onEnter: checkAuthentication,
        data: {
          title: 'Submitted Sample Units'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/transects.tpl.html',
            controller: 'SubmittedTransectMethodsCtrl'
          }
        },
        resolve: {
          sites: function($stateParams, OfflineTables) {
            const project_id = $stateParams.project_id;
            return OfflineTables.ProjectSitesTable(project_id).then(function(
              table
            ) {
              return table.filter().then(function(sites) {
                return _.map(sites, function(site) {
                  return { id: site.id, name: site.name };
                });
              });
            });
          }
        }
      });
  });
