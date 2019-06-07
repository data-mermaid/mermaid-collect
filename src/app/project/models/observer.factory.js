angular.module('app.project').factory('Observer', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/observers/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
