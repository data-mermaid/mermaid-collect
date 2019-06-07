angular.module('app.project').factory('HabitatComplexityTransectMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/habitatcomplexitytransectmethods/:id/',
      {
        project_pk: '@project_pk',
        id: '@id'
      }
    );
  }
]);
