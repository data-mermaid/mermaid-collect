angular.module('app.project').factory('ProjectSite', [
  'APP_CONFIG',
  '$pageresource',
  function(APP_CONFIG, $pageresource) {
    'use strict';
    return $pageresource('projects/:project_pk/sites/:id/', {
      project_pk: '@project_pk',
      id: '@id'
    });
  }
]);
