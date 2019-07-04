'use strict';

angular
  .module('app.project', ['ui.router'])

  .config(function($stateProvider) {
    var _checkUuid = function($q, utils, id) {
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

    var _checkId = function() {
      return [
        '$stateParams',
        '$q',
        'utils',
        function($stateParams, $q, utils) {
          var id = $stateParams.id;
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

    var _loadProject = function() {
      return [
        '$stateParams',
        'ProjectService',
        '$q',
        'utils',
        function($stateParams, ProjectService, $q, utils) {
          var project_id = $stateParams.project_id;
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

    var _backgroundLoadChoices = function($q, ProjectService) {
      ProjectService.loadLookupTables();
      return $q.resolve(true);
    };

    var _getMyProjectProfile = function($stateParams, ProjectService) {
      return ProjectService.getMyProjectProfile($stateParams.project_id);
    };

    var _fetchCurrentUser = function(authService) {
      return authService.getCurrentUser();
    };

    var _fetchCollectRecord = function($stateParams, offlineservice) {
      return offlineservice
        .CollectRecordsTable($stateParams.project_id)
        .then(function(table) {
          return table.get($stateParams.id);
        });
    };

    var _fetchTransectLookups = function($stateParams, TransectService) {
      return TransectService.getLookups($stateParams.project_id);
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
        loginRequired: true,
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
          currentUser: _fetchCurrentUser
        }
      })
      .state('fullapp.project', {
        url: '/startproject',
        loginRequired: true,
        data: {
          title: 'New Project',
          loginRequired: true
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
        loginRequired: true,
        data: {
          title: 'Contact MERMAID',
          loginRequired: true
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
        loginRequired: true,
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
          project: function($stateParams, offlineservice, $q) {
            const projectId = $stateParams.project_id;
            return offlineservice
              .ProjectsTable(projectId)
              .then(function(table) {
                if (projectId == null) {
                  return $q.resolve({});
                }
                return table.get(projectId).then(function(record) {
                  return record;
                });
              });
          },
          projectProfile: _getMyProjectProfile,
          dataPolicies: function(offlineservice) {
            return offlineservice
              .ChoicesTable()
              .then(function(table) {
                return table.filter({ name: 'datapolicies' });
              })
              .then(function(result) {
                return result[0].data;
              });
          }
        }
      })
      .state('app.project.datasharing', {
        url: '/datasharing',
        loginRequired: true,
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
          project: function($stateParams, offlineservice, $q) {
            const projectId = $stateParams.project_id;
            return offlineservice
              .ProjectsTable(projectId)
              .then(function(table) {
                if (projectId == null) {
                  return $q.resolve({});
                }
                return table.get(projectId).then(function(record) {
                  return record;
                });
              });
          },
          projectProfile: _getMyProjectProfile,
          dataPolicies: function(offlineservice) {
            return offlineservice
              .ChoicesTable()
              .then(function(table) {
                return table.filter({ name: 'datapolicies' });
              })
              .then(function(result) {
                return result[0].data;
              });
          }
        }
      })
      .state('app.project.sites', {
        url: '/sites',
        loginRequired: true,
        data: {
          title: 'Sites'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/sites.tpl.html',
            controller: 'SitesCtrl'
          }
        }
      })
      .state('app.project.sites.site', {
        url: '/:id',
        loginRequired: true,
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
          checkId: _checkId()
        }
      })

      .state('app.project.managements', {
        url: '/managements',
        loginRequired: true,
        data: {
          title: 'Management Regimes'
        },
        views: {
          'content@app': {
            templateUrl: 'app/project/partials/managements.tpl.html',
            controller: 'ManagementsCtrl'
          }
        }
      })
      .state('app.project.managements.management', {
        url: '/:id',
        loginRequired: true,
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
          checkId: _checkId()
        }
      })
      .state('app.project.submittedtransects.fishbelttransectmethod', {
        url: '/fishbelttransectmethods/:id',
        loginRequired: true,
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
          record: function($stateParams, BeltFishTransectMethod, utils) {
            return BeltFishTransectMethod.get({
              project_pk: $stateParams.project_id,
              id: $stateParams.id
            }).$promise.then(function(beltFishRecord) {
              const record = { data: beltFishRecord };
              utils.assignUniqueId(_.get(record.data, 'obs_belt_fishes') || []);
              return record;
            });
          },
          transectLookups: _fetchTransectLookups,
          projectProfile: _getMyProjectProfile
        }
      })
      .state('app.project.records.collectfishbelt', {
        url: '/fishbelt/:id',
        loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
          loginRequired: true,
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
        loginRequired: true,
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
        loginRequired: true,
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
          projectProfile: function($stateParams, ProjectService) {
            const projectId = $stateParams.project_id;
            return ProjectService.getMyProjectProfile(projectId);
          }
        }
      })
      .state('app.project.users', {
        url: '/users',
        loginRequired: true,
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
        loginRequired: true,
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
          sites: function($stateParams, offlineservice) {
            const project_id = $stateParams.project_id;
            return offlineservice
              .ProjectSitesTable(project_id)
              .then(function(table) {
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
