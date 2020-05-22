'use strict';

angular.module('app.reference', ['ui.router']).config(function($stateProvider) {
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

  const _getChoices = function() {
    return [
      'ProjectService',
      function(ProjectService) {
        return ProjectService.fetchChoices().then(function(choices) {
          return choices;
        });
      }
    ];
  };

  $stateProvider
    .state('app.reference', {
      abstract: true,
      url: '/reference',
      data: {
        title: 'Reference',
        navTemplate: 'app/reference/partials/navigation.tpl.html',
        refText: 'REFERENCE',
        hideRightMenuItems: true
      }
    })
    .state('app.reference.home', {
      url: '/home',
      data: {
        title: 'Home',
        hideRightMenuItems: true,
        toggleMenu: true
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/referencehome.tpl.html'
        }
      }
    })
    .state('app.reference.fishfamilies.fishfamily', {
      url: '/:id',
      data: {
        title: 'Fish Family',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishfamilies']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishfamily.tpl.html',
          controller: 'FishFamilyCtrl'
        }
      },
      resolve: {
        checkId: _checkId(),
        choicesTable: _getChoices()
      }
    })
    .state('app.reference.fishfamilies', {
      url: '/fishattributes/families',
      data: {
        title: 'Fish Families',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishfamilies']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishfamilies.tpl.html',
          controller: 'FishFamiliesCtrl'
        }
      },
      resolve: {
        fishFamiliesTable: function(OfflineCommonTables) {
          return OfflineCommonTables.FishFamiliesTable();
        },
        fishFamiliesCount: function(OfflineCommonTables) {
          return OfflineCommonTables.FishFamiliesTable().then(function(table) {
            return table.count();
          });
        }
      }
    })
    .state('app.reference.fishgenera.fishgenus', {
      url: '/:id',
      data: {
        title: 'Fish Genus',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishgenera']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishgenus.tpl.html',
          controller: 'FishGenusCtrl'
        }
      },
      resolve: {
        checkId: _checkId(),
        choicesTable: _getChoices(),
        fishFamilies: function(FishAttributeService) {
          return FishAttributeService.fetchFishFamilies();
        }
      }
    })
    .state('app.reference.fishgenera', {
      url: '/fishattributes/genera',
      data: {
        title: 'Fish Genera',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishgenera']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishgenera.tpl.html',
          controller: 'FishGeneraCtrl'
        }
      },
      resolve: {
        fishGeneraTable: function(OfflineCommonTables) {
          return OfflineCommonTables.FishGeneraTable(true);
        },
        fishGeneraCount: function(OfflineCommonTables) {
          return OfflineCommonTables.FishGeneraTable().then(function(table) {
            return table.count();
          });
        }
      }
    })
    .state('app.reference.fishspeciess.fishspecies', {
      url: '/:id',
      data: {
        title: 'Fish Species',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishspeciess']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishspecies.tpl.html',
          controller: 'FishSpeciesCtrl'
        }
      },
      resolve: {
        checkId: _checkId(),
        choicesTable: _getChoices(),
        fishFamilies: function(FishAttributeService) {
          return FishAttributeService.fetchFishFamilies();
        }
      }
    })
    .state('app.reference.fishspeciess', {
      url: '/fishattributes/species',
      data: {
        title: 'Fish Species',
        hideRightMenuItems: true,
        parentStates: ['app.reference.fishspeciess']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/fishspeciess.tpl.html',
          controller: 'FishSpeciessCtrl'
        }
      },
      resolve: {
        fishSpeciesTable: function(OfflineCommonTables) {
          return OfflineCommonTables.FishSpeciesTable();
        },
        fishSpeciesCount: function(OfflineCommonTables) {
          return OfflineCommonTables.FishSpeciesTable().then(function(table) {
            return table.count();
          });
        }
      }
    })
    .state('app.reference.groupings.grouping', {
      url: '/:id',
      data: {
        title: 'Grouping',
        hideRightMenuItems: true,
        parentStates: ['app.reference.groupings']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/grouping.tpl.html',
          controller: 'GroupingCtrl'
        }
      },
      resolve: {
        checkId: _checkId(),
        fishFamilies: function(FishAttributeService) {
          return FishAttributeService.fetchFishFamilies();
        }
      }
    })
    .state('app.reference.groupings', {
      url: '/fishattributes/groupings',
      data: {
        title: 'Groupings',
        hideRightMenuItems: true,
        parentStates: ['app.reference.groupings']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/groupings.tpl.html',
          controller: 'GroupingsCtrl'
        }
      },
      resolve: {
        groupingsTable: function(OfflineCommonTables) {
          return OfflineCommonTables.FishGroupingsTable();
        }
      }
    })
    .state('app.reference.benthicattributes.benthicattribute', {
      url: '/:id',
      data: {
        title: 'Benthic Attributes',
        hideRightMenuItems: true,
        parentStates: ['app.reference.benthicattributes']
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/benthicattribute.tpl.html',
          controller: 'BenthicAttributeCtrl'
        }
      },
      resolve: {
        checkId: _checkId(),
        choicesTable: _getChoices(),
        parents: function(BenthicAttributeService) {
          return BenthicAttributeService.fetchBenthicAttributes();
        }
      }
    })
    .state('app.reference.benthicattributes', {
      url: '/benthicattributes',
      data: {
        title: 'Benthic Attributes',
        hideRightMenuItems: true
      },
      views: {
        'content@app': {
          templateUrl: 'app/reference/partials/benthicattributes.tpl.html',
          controller: 'BenthicAttributesCtrl'
        }
      },
      resolve: {
        choicesTable: _getChoices(),
        benthicAttributesTable: function(OfflineCommonTables) {
          return OfflineCommonTables.BenthicAttributesTable();
        },
        benthicAttributesCount: function(OfflineCommonTables) {
          return OfflineCommonTables.BenthicAttributesTable().then(function(
            table
          ) {
            return table.count();
          });
        }
      }
    });
});
