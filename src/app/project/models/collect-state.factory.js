angular.module('app.project').factory('CollectState', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/collect/states/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
