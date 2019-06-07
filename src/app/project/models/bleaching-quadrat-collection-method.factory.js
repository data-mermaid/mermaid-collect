angular.module('app.project').factory('BleachingQuadratCollectionMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource(
      'projects/:project_pk/bleachingquadratcollectionmethods/:id/',
      {
        project_pk: '@project_pk',
        id: '@id'
      }
    );
  }
]);
