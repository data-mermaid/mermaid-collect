angular.module('app.project').factory('BeltFishTransectMethod', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/beltfishtransectmethods/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
