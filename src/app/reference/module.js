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

  $stateProvider
    .state('app.reference', {
      abstract: true,
      url: '/reference',
      loginRequired: false,
      data: {
        title: 'Reference',
        navTemplate: 'app/reference/partials/navigation.tpl.html',
        refText: 'REFERENCE',
        hideRightMenuItems: true
      }
    })
    .state('app.reference.home', {
      url: '/home',
      loginRequired: false,
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
      loginRequired: false,
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
        checkId: _checkId()
      }
    })
    .state('app.reference.fishfamilies', {
      url: '/fishattributes/families',
      loginRequired: false,
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
      }
    })
    .state('app.reference.fishgenera.fishgenus', {
      url: '/:id',
      loginRequired: false,
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
        fishFamilies: function(FishAttributeService) {
          return FishAttributeService.fetchFishFamilies();
        }
      }
    })
    .state('app.reference.fishgenera', {
      url: '/fishattributes/genera',
      loginRequired: false,
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
      }
    })
    .state('app.reference.fishspeciess.fishspecies', {
      url: '/:id',
      loginRequired: false,
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
        fishGenera: function(FishAttributeService) {
          return FishAttributeService.fetchFishGenera();
        }
      }
    })
    .state('app.reference.fishspeciess', {
      url: '/fishattributes/species',
      loginRequired: false,
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
      }
    })
    .state('app.reference.benthicattributes.benthicattribute', {
      url: '/:id',
      loginRequired: false,
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
        parents: function(BenthicAttributeService) {
          return BenthicAttributeService.fetchBenthicAttributes();
        },
        benthicAttribute: function($stateParams, BenthicAttributeService) {
          return BenthicAttributeService.getBenthicAttribute($stateParams.id);
        },
        choices: function(ProjectService) {
          return ProjectService.fetchChoices();
        }
      }
    })
    .state('app.reference.benthicattributes', {
      url: '/benthicattributes',
      loginRequired: false,
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
        benthicAttributesTable: function(offlineservice) {
          return offlineservice.BenthicAttributesTable();
        }
      }
    });
});
